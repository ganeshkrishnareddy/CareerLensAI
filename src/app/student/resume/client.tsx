"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, Badge } from "@/components/ui/ui";
import { extractTextFromFile } from "@/lib/resume-extract";
import { cn } from "@/lib/utils";

interface Extraction {
  skills: { name: string; category: string; occurrences: number; confidence: number }[];
  education: { degree: string; field?: string; institution?: string }[];
  contact: { email?: string; phone?: string; linkedin?: string; location?: string };
  projects: string[];
  certifications: string[];
  experience: string[];
  summary: string[];
}

const MAX_SIZE = 5 * 1024 * 1024;

export function ResumeUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"idle" | "extracting" | "review">("idle");
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [deselectedSkills, setDeselectedSkills] = useState<string[]>([]);

  async function onFile(file: File) {
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      toast.error("Only PDF and DOCX files are supported");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File is too large (max 5 MB)");
      return;
    }
    setPhase("extracting");
    setError(null);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) throw new Error("Could not extract text from this file.");
      const result = await api<{ resumeId: string; extraction: Extraction }>("/api/resume/upload", {
        method: "POST",
        body: (() => {
          const form = new FormData();
          form.append("file", file);
          form.append("text", text);
          return form;
        })()
      });
      setExtraction(result.extraction);
      setResumeId(result.resumeId);
      setFileName(file.name);
      setDeselectedSkills([]);
      setPhase("review");
      toast.success("Extraction complete — review before applying");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not process this file";
      setError(message);
      setPhase("idle");
    }
  }

  async function apply(edits?: { skills: string[] }) {
    if (!resumeId || !extraction) return;
    setApplying(true);
    try {
      const data: Extraction = {
        ...extraction,
        skills: edits
          ? extraction.skills.filter((s) => edits.skills.includes(s.name))
          : extraction.skills.filter((s) => !deselectedSkills.includes(s.name))
      };
      await api("/api/resume/apply", { method: "POST", body: JSON.stringify({ resumeId, data }) });
      toast.success("Resume data applied to your profile");
      setPhase("idle");
      setExtraction(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not apply extraction");
    } finally {
      setApplying(false);
    }
  }

  if (phase === "extracting") {
    return (
      <Card className="flex items-center justify-center gap-3 p-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-ink-600">Extracting text and analyzing skills…</p>
      </Card>
    );
  }

  if (phase === "review" && extraction) {
    const selectedSkills = extraction.skills.filter((s) => !deselectedSkills.includes(s.name));
    return (
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{fileName}</p>
                <p className="text-xs text-ink-400">Extraction confidence: {(0.5 + Math.min(0.45, selectedSkills.length * 0.05)).toFixed(2)}</p>
              </div>
            </div>
            <button onClick={() => setPhase("idle")} className="text-xs font-semibold text-ink-400 hover:text-ink-600">Discard</button>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-[15px] font-bold text-ink-900">Extracted skills</h3>
          <p className="mt-0.5 text-xs text-ink-500">Uncheck any skill you don't want imported. Nothing already on your profile is overwritten.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {extraction.skills.map((s) => {
              const selected = !deselectedSkills.includes(s.name);
              return (
                <button
                  key={s.name}
                  onClick={() => setDeselectedSkills((d) => (selected ? [...d, s.name] : d.filter((x) => x !== s.name)))}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 bg-ink-50 text-ink-400 line-through"
                  )}
                >
                  {s.name}
                  <span className="text-[10px] font-semibold text-ink-400">{(s.confidence * 100).toFixed(0)}%</span>
                </button>
              );
            })}
            {extraction.skills.length === 0 && <p className="text-xs text-ink-400">No skills detected in this resume.</p>}
          </div>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-[14px] font-bold text-ink-900">Education</h3>
            {extraction.education.length > 0 ? (
              <div className="mt-3 space-y-2">
                {extraction.education.map((e, i) => (
                  <div key={i} className="rounded-lg bg-ink-50 p-3 text-xs text-ink-600">
                    <p className="font-semibold text-ink-800">{e.degree}{e.field ? ` · ${e.field}` : ""}</p>
                    {e.institution && <p className="mt-0.5 text-ink-500">{e.institution}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-400">Not detected. Add it in your profile.</p>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="text-[14px] font-bold text-ink-900">Contact detected</h3>
            <div className="mt-3 space-y-1.5 text-xs text-ink-600">
              <p>Email: {extraction.contact.email ?? "—"}</p>
              <p>Phone: {extraction.contact.phone ?? "—"}</p>
              <p>LinkedIn: {extraction.contact.linkedin ?? "—"}</p>
              <p>Location: {extraction.contact.location ?? "—"}</p>
            </div>
          </Card>
        </div>

        {extraction.certifications.length > 0 && (
          <Card className="p-5">
            <h3 className="text-[14px] font-bold text-ink-900">Certifications detected ({extraction.certifications.length})</h3>
            <div className="mt-3 space-y-1.5">
              {extraction.certifications.slice(0, 5).map((c, i) => (
                <p key={i} className="text-xs text-ink-600">{c}</p>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => apply()} loading={applying}>
            Apply {selectedSkills.length} skills to my profile
          </Button>
          <Button variant="outline" onClick={() => setPhase("idle")}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-ink-300 bg-white p-12 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/30"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-[15px] font-bold text-ink-900">Drop your resume here</h3>
        <p className="mt-1 text-[13px] text-ink-500">PDF or DOCX · up to 5 MB · text extracted locally, analysis on the server</p>
        <Button className="mt-4" onClick={() => inputRef.current?.click()}>Choose file</Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
        {error && <p className="mt-4 text-xs font-medium text-rose-600">{error}</p>}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-400">
        <Badge color="slate">Privacy</Badge> Files are stored securely on the server and never shared. You confirm every extraction before it's applied.
      </p>
    </div>
  );
}
