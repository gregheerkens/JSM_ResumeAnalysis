import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
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
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    if (!id) return;
    const data = loadResume(id);
    setResume(data);
  }, [id]);

  const imageUrl = resume?.imagePath;
  const feedback = resume?.feedback;

  return (
    <main className="pt-0!">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm">Back to Home</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg)] bg-cover h-[100vh] sticky top-0">
          {imageUrl && (
            <div className="animate-in fade-in-1000 gradient-border max-sm:m-0 h-[90%]">
                <img src={imageUrl} className="w-full h-full object-contain"/>
            </div>
          )}
        </section>
        <section className="feedback-section">
            <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
            { feedback ? (
                <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                    <Summary feedback={feedback}/>
                    <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []}/>
                    <Details feedback={feedback}/>
                </div>
            ) : (
                <img src="/images/resume-scan-2.gif" className="w-full"/>
            )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
