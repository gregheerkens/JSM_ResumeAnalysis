// ── Resumes ──────────────────────────────────────────────────────────────────

export function saveResume(resume: Resume): void {
  const existing = loadResumes();
  let updated = [resume, ...existing.filter((r) => r.id !== resume.id)];

  // Try to save, pruning oldest entries one at a time if quota is exceeded
  while (updated.length > 0) {
    try {
      localStorage.setItem("resumind_resumes", JSON.stringify(updated));
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        updated = updated.slice(0, updated.length - 1);
      } else {
        throw e;
      }
    }
  }

  throw new Error("Unable to save resume: localStorage is full even after pruning. Clear your browser storage and try again.");
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

// ── Archetypes ────────────────────────────────────────────────────────────────

export function saveArchetype(archetype: Archetype): void {
  const existing = loadArchetypes();
  const updated = [archetype, ...existing.filter((a) => a.id !== archetype.id)];
  localStorage.setItem("resumind_archetypes", JSON.stringify(updated));
}

export function loadArchetypes(): Archetype[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("resumind_archetypes");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function loadArchetype(id: string): Archetype | null {
  return loadArchetypes().find((a) => a.id === id) ?? null;
}

export function deleteArchetype(id: string): void {
  const updated = loadArchetypes().filter((a) => a.id !== id);
  localStorage.setItem("resumind_archetypes", JSON.stringify(updated));
}
