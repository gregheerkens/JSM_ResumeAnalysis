import { useState, useEffect } from "react";
import { useFetcher, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/upload";
import Navbar from "~/components/navbar";
import FileUploader from "~/components/fileUploader";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { saveResume, loadArchetypes } from "~/lib/storage";
import { AIResponseFormat, prepareInstructions, prepareRewriteInstructions } from "../../constants";

export async function action({ request }: Route.ActionArgs) {
  try {
    const { anthropic } = await import("~/lib/anthropic.server");
    const fs = await import("node:fs/promises");

    const formData = await request.formData();
    const companyName = formData.get("companyName") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const jobDescription = formData.get("jobDescription") as string;
    const archetypeName = formData.get("archetypeName") as string | undefined;
    const id = formData.get("id") as string;

    // Resolve PDF — from disk path (archetype) or direct upload (one-time)
    let pdfBase64: string;
    const archetypeFilePath = formData.get("archetypeFilePath") as string | null;

    if (archetypeFilePath) {
      const buffer = await fs.readFile(archetypeFilePath);
      pdfBase64 = buffer.toString("base64");
    } else {
      const pdfFile = formData.get("pdfFile") as File;
      if (!pdfFile || pdfFile.size === 0) {
        return { error: "No resume file provided." };
      }
      pdfBase64 = Buffer.from(await pdfFile.arrayBuffer()).toString("base64");
    }

    const instructions = prepareInstructions({ jobTitle, jobDescription, AIResponseFormat });

    const pdfContent = {
      type: "document" as const,
      source: {
        type: "base64" as const,
        media_type: "application/pdf" as const,
        data: pdfBase64,
      },
    };

    // Call 1 — analysis and scoring
    const analysisResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8096,
      messages: [
        {
          role: "user",
          content: [pdfContent, { type: "text", text: instructions }],
        },
      ],
    });

    const analysisContent = analysisResponse.content[0];
    if (analysisContent.type !== "text") {
      return { error: "Analysis returned an unexpected response type. Please try again." };
    }

    let feedback: Feedback;
    try {
      const raw = analysisContent.text.trim();
      const json = raw.startsWith("```") ? raw.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim() : raw;
      feedback = JSON.parse(json);
    } catch {
      return { error: `Analysis response could not be parsed. The AI may have returned an unexpected format. First 300 chars: ${analysisContent.text.slice(0, 300)}` };
    }

    // Validate the feedback has the expected shape before proceeding
    if (typeof feedback.overallScore !== "number" || !feedback.ATS) {
      return { error: "Analysis response was missing required fields. Please try again." };
    }

    // Call 2 — rewrite, piping feedback from call 1
    let tailoredResume = "";
    try {
      const rewriteInstructions = prepareRewriteInstructions({ jobTitle, jobDescription, feedback });
      const rewriteResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8096,
        messages: [
          {
            role: "user",
            content: [pdfContent, { type: "text", text: rewriteInstructions }],
          },
        ],
      });
      const rewriteContent = rewriteResponse.content[0];
      tailoredResume = rewriteContent.type === "text" ? rewriteContent.text.trim() : "";
    } catch (rewriteErr) {
      // Rewrite failure is non-fatal — return analysis results with a warning
      console.error("[action] rewrite call failed:", rewriteErr);
      return { feedback, tailoredResume: "", id, companyName, jobTitle, jobDescription, archetypeName, warning: "Analysis succeeded but tailored resume generation failed. You can re-run to try again." };
    }

    return { feedback, tailoredResume, id, companyName, jobTitle, jobDescription, archetypeName };

  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[action] unhandled error:", err);
    return { error: `Something went wrong: ${message}` };
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
  const [searchParams] = useSearchParams();
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>("");
  const [oneTimeFile, setOneTimeFile] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const isProcessing = isConverting || fetcher.state !== "idle";

  useEffect(() => {
    const saved = loadArchetypes();
    setArchetypes(saved);
    if (saved.length > 0) setSelectedArchetypeId(saved[0].id);
  }, []);

  useEffect(() => {
    if (!fetcher.data) return;

    const data = fetcher.data as {
      feedback?: Feedback;
      tailoredResume?: string;
      id?: string;
      companyName?: string;
      jobTitle?: string;
      jobDescription?: string;
      archetypeName?: string;
      error?: string;
      warning?: string;
    };

    if (data.error) {
      setError(data.error);
      return;
    }

    if (data.warning) setWarning(data.warning);

    saveResume({
      id: data.id!,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      jobDescription: data.jobDescription,
      archetypeName: data.archetypeName,
      imagePath: pendingImageUrl ?? "",
      resumePath: "",
      feedback: data.feedback!,
      tailoredResume: data.tailoredResume,
    });

    navigate(`/resume/${data.id}`);
  }, [fetcher.data]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    const form = e.currentTarget;
    const rawData = new FormData(form);

    // Resolve archetype or one-time file
    const archetype = selectedArchetypeId
      ? archetypes.find((a) => a.id === selectedArchetypeId)
      : null;

    if (!archetype && !oneTimeFile) {
      setError("Please select an archetype or upload a resume file.");
      return;
    }

    setIsConverting(true);
    setStatusText("Preparing resume...");

    try {
      // Generate preview image client-side
      const previewSourceFile = oneTimeFile ?? await (async () => {
        // For archetypes, fetch the file via a resource route for preview only
        return null;
      })();

      if (previewSourceFile) {
        const imgResult = await convertPdfToImage(previewSourceFile);
        if (imgResult.file) {
          const imageBase64 = await fileToBase64(imgResult.file);
          setPendingImageUrl(`data:image/png;base64,${imageBase64}`);
        }
      }

      setIsConverting(false);
      setStatusText("Analyzing resume... (1/2)");

      const submitData = new FormData();
      const uuid = generateUUID();

      if (archetype) {
        submitData.set("archetypeFilePath", archetype.filePath);
        submitData.set("archetypeName", archetype.name);
      } else {
        submitData.set("pdfFile", oneTimeFile!);
      }

      submitData.set("companyName", rawData.get("company-name") as string);
      submitData.set("jobTitle", rawData.get("job-title") as string);
      submitData.set("jobDescription", rawData.get("job-description") as string);
      submitData.set("id", uuid);

      fetcher.submit(submitData, { method: "post", encType: "multipart/form-data" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error during processing.");
      setIsConverting(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1>Smart feedback for your dream job</h1>
          {error && <p className="text-red-600 font-medium bg-red-50 rounded-lg p-3">{error}</p>}
          {warning && <p className="text-yellow-700 font-medium bg-yellow-50 rounded-lg p-3">{warning}</p>}
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
                <input type="text" name="company-name" placeholder="Company Name" id="company-name" defaultValue={searchParams.get("company") ?? ""} />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input type="text" name="job-title" placeholder="Job Title" id="job-title" defaultValue={searchParams.get("title") ?? ""} />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" defaultValue={searchParams.get("description") ?? ""} />
              </div>
              <div className="form-div">
                <label>Resume</label>
                {archetypes.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <select
                      className="w-full border border-gray-200 rounded-lg p-3 text-gray-700 bg-white"
                      value={selectedArchetypeId}
                      onChange={(e) => {
                        setSelectedArchetypeId(e.target.value);
                        setOneTimeFile(null);
                      }}
                    >
                      {archetypes.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                      <option value="">— Upload a different file —</option>
                    </select>
                    {!selectedArchetypeId && (
                      <FileUploader onFileSelect={setOneTimeFile} />
                    )}
                  </div>
                ) : (
                  <FileUploader onFileSelect={setOneTimeFile} />
                )}
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
