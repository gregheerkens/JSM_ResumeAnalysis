import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { loadResume } from "~/lib/storage";
import Summary from "~/components/summary";
import ATS from "~/components/ats";
import Details from "~/components/details";

export const meta = () => [
  { title: "Resumind" },
  { name: "description", content: "Detailed overview" },
];

const Resume = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const data = loadResume(id);
    setResume(data);
  }, [id]);

  const imageUrl = resume?.imagePath;
  const feedback = resume?.feedback;
  const tailoredResume = resume?.tailoredResume;

  const handleCopy = () => {
    if (!tailoredResume) return;
    navigator.clipboard.writeText(tailoredResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    if (!resume) return;
    const params = new URLSearchParams();
    if (resume.companyName) params.set("company", resume.companyName);
    if (resume.jobTitle) params.set("title", resume.jobTitle);
    if (resume.jobDescription) params.set("description", resume.jobDescription);
    navigate(`/upload?${params.toString()}`);
  };

  return (
    <main className="pt-0!">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm">Back to Home</span>
        </Link>
        {resume && (
          <button onClick={handleRetry} className="primary-button w-fit">
            Retry with New Resume
          </button>
        )}
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg)] bg-cover h-[100vh] sticky top-0">
          {imageUrl && (
            <div className="animate-in fade-in-1000 gradient-border max-sm:m-0 h-[90%]">
              <img src={imageUrl} className="w-full h-full object-contain" />
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl text-black! font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
              <Details feedback={feedback} />
              {tailoredResume && (
                <div className="bg-white rounded-2xl shadow-md w-full p-8 flex flex-col gap-4">
                  <div className="flex flex-row items-center justify-between">
                    <h3 className="text-2xl font-bold text-black">Tailored Resume</h3>
                    <button onClick={handleCopy} className="primary-button w-fit">
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-6 border border-gray-100">
                    {tailoredResume}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
