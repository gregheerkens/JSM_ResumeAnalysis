import { useState, useEffect } from "react";
import { Link, useFetcher } from "react-router";
import type { Route } from "./+types/archetypes";
import FileUploader from "~/components/fileUploader";
import { generateUUID } from "~/lib/utils";
import { loadArchetypes, saveArchetype, deleteArchetype } from "~/lib/storage";
import path from "node:path";
import fs from "node:fs/promises";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    const id = formData.get("id") as string;
    const filePath = formData.get("filePath") as string;
    try {
      await fs.unlink(filePath);
    } catch {
      // File already gone — still remove the record
    }
    return { deleted: id };
  }

  if (intent === "save") {
    const name = formData.get("name") as string;
    const file = formData.get("file") as File;

    if (!name?.trim()) return { error: "Name is required." };
    if (!file || file.size === 0) return { error: "Please select a PDF file." };

    const archetypeDir = process.env.ARCHETYPE_DIR
      ? path.resolve(process.cwd(), process.env.ARCHETYPE_DIR)
      : path.resolve(process.cwd(), "archetypes");

    await fs.mkdir(archetypeDir, { recursive: true });

    const ext = path.extname(file.name) || ".pdf";
    const fileName = `${generateUUID()}${ext}`;
    const filePath = path.join(archetypeDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return { saved: { id: generateUUID(), name: name.trim(), filePath } };
  }

  return { error: "Unknown intent." };
}

const Archetypes = () => {
  const fetcher = useFetcher();
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setArchetypes(loadArchetypes());
  }, []);

  useEffect(() => {
    if (!fetcher.data) return;
    const data = fetcher.data as { saved?: Archetype; deleted?: string; error?: string };

    if (data.error) {
      setError(data.error);
      return;
    }
    if (data.saved) {
      saveArchetype(data.saved);
      setArchetypes(loadArchetypes());
      setFile(null);
      setName("");
    }
    if (data.deleted) {
      deleteArchetype(data.deleted);
      setArchetypes(loadArchetypes());
    }
  }, [fetcher.data]);

  const handleSave = () => {
    if (!file) return setError("Please select a PDF file.");
    if (!name.trim()) return setError("Please enter a name.");
    setError(null);

    const submitData = new FormData();
    submitData.set("intent", "save");
    submitData.set("name", name.trim());
    submitData.set("file", file);
    fetcher.submit(submitData, { method: "post", encType: "multipart/form-data" });
  };

  const handleDelete = (archetype: Archetype) => {
    const submitData = new FormData();
    submitData.set("intent", "delete");
    submitData.set("id", archetype.id);
    submitData.set("filePath", archetype.filePath);
    fetcher.submit(submitData, { method: "post" });
  };

  const isSaving = fetcher.state !== "idle";

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="back" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm">Back to Home</span>
        </Link>
        <Link to="/upload" className="primary-button w-fit">
          Analyze Resume
        </Link>
      </nav>
      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Resume Archetypes</h1>
          <h2>Your saved resume templates</h2>
        </div>

        <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto pb-16">

          {archetypes.length > 0 && (
            <div className="flex flex-col gap-3">
              {archetypes.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl shadow-md p-5 flex flex-row items-center justify-between">
                  <div className="flex flex-row items-center gap-3">
                    <img src="/images/pdf.png" alt="pdf" className="size-8" />
                    <div className="flex flex-col">
                      <p className="font-semibold text-lg">{a.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{a.filePath}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(a)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-black">Add Archetype</h3>
            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
            <div className="form-div">
              <label htmlFor="archetype-name">Name</label>
              <input
                type="text"
                id="archetype-name"
                placeholder="e.g. IC Engineering, TPMM / Narrative, PM"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-div">
              <label>PDF</label>
              <FileUploader onFileSelect={setFile} />
            </div>
            <button
              className="primary-button w-fit"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Archetype"}
            </button>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Archetypes;
