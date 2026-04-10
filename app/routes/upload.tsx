import { useState, useEffect } from "react";
import { useFetcher, useNavigate } from "react-router";
import type { Route } from "./+types/upload";
import Navbar from "~/components/navbar";
import FileUploader from "~/components/fileUploader";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { saveResume } from "~/lib/storage";
import { AIResponseFormat, prepareInstructions } from "../../constants";

export async function action({ request }: Route.ActionArgs) {
  const { anthropic } = await import("~/lib/anthropic.server");

  const formData = await request.formData();
  const imageBase64 = formData.get("imageBase64") as string;
  const companyName = formData.get("companyName") as string;
  const jobTitle = formData.get("jobTitle") as string;
  const jobDescription = formData.get("jobDescription") as string;
  const id = formData.get("id") as string;

  const instructions = prepareInstructions({ jobTitle, jobDescription, AIResponseFormat });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: imageBase64,
            },
          },
          { type: "text", text: instructions },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return { error: "Unexpected response from AI" };
  }

  try {
    const feedback = JSON.parse(content.text);
    return { feedback, id, companyName, jobTitle };
  } catch {
    return { error: "Failed to parse AI response" };
  }
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Upload = () => {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [statusText, setStatusText] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const isProcessing = isConverting || fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;

    if ("error" in fetcher.data) {
      setStatusText(fetcher.data.error as string);
      return;
    }

    const { feedback, id, companyName, jobTitle } = fetcher.data as {
      feedback: Feedback;
      id: string;
      companyName: string;
      jobTitle: string;
    };

    saveResume({
      id,
      companyName,
      jobTitle,
      imagePath: pendingImageUrl ?? "",
      resumePath: "",
      feedback,
    });

    navigate("/");
  }, [fetcher.data]);

  const handleFileSelect = (selected: File | null) => {
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    const form = e.currentTarget;
    const rawData = new FormData(form);

    setIsConverting(true);
    setStatusText("Converting resume to image...");

    try {
      console.log("[upload] starting PDF conversion");
      const imgResult = await convertPdfToImage(file);
      console.log("[upload] conversion result:", imgResult);

      if (!imgResult.file) {
        setStatusText(imgResult.error ?? "Failed to convert PDF to image");
        setIsConverting(false);
        return;
      }

      console.log("[upload] converting to base64");
      const imageBase64 = await fileToBase64(imgResult.file);
      console.log("[upload] base64 length:", imageBase64.length);

      setPendingImageUrl(`data:image/png;base64,${imageBase64}`);
      setIsConverting(false);
      setStatusText("Analyzing resume...");

      console.log("[upload] submitting to action");
      const submitData = new FormData();
      const uuid = generateUUID();
      submitData.set("imageBase64", imageBase64);
      submitData.set("companyName", rawData.get("company-name") as string);
      submitData.set("jobTitle", rawData.get("job-title") as string);
      submitData.set("jobDescription", rawData.get("job-description") as string);
      submitData.set("id", uuid);

      fetcher.submit(submitData, { method: "post" });

      setStatusText("Analyzing complete, redirecting...");
      navigate(`/resume/${uuid}`)
    } catch (err) {
      console.error("[upload] error:", err);
      setStatusText(err instanceof Error ? err.message : "Unexpected error during processing");
      setIsConverting(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" className="w-full" />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>
              <button className="primary-button" type="submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
