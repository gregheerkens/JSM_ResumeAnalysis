import { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import Navbar from "../components/navbar";
import ResumeCard from "../components/resumeCard";
import { loadResumes } from "~/lib/storage";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Resume Analysis" },
  ];
}

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    setResumes(loadResumes());
  }, []);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover bg-center bg-no-repeat">
      <Navbar />
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Resumind</h1>
          <h2>Resume Analysis</h2>
        </div>
      </section>

      {resumes.length > 0 ? (
        <div className="resumes-section">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      ) : (
        <div className="no-resumes-section">
          <h2>No resumes found</h2>
        </div>
      )}
    </main>
  );
}
