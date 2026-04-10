export function saveResume(resume: Resume): void {
  const existing = loadResumes();
  const updated = [resume, ...existing.filter((r) => r.id !== resume.id)];
  localStorage.setItem("resumind_resumes", JSON.stringify(updated));
}

export function loadResumes(): Resume[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("resumind_resumes");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function loadResume(id: string): Resume | null {
  return loadResumes().find((r) => r.id === id) ?? null;
}

export function deleteResume(id: string): void {
  const updated = loadResumes().filter((r) => r.id !== id);
  localStorage.setItem("resumind_resumes", JSON.stringify(updated));
}
