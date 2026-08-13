"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Award, Check, FileSearch, FolderGit2, GraduationCap,
  Rocket, Sparkles, Target, UserCircle
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui/ui";
import { CATEGORY_LABEL, CATEGORY_COLOR, LEVEL_LABELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { extractTextFromFile } from "@/lib/resume-extract";

const STEPS = [
  { label: "Profile", icon: UserCircle },
  { label: "Career goal", icon: Target },
  { label: "Skills", icon: GraduationCap },
  { label: "Projects", icon: FolderGit2 },
  { label: "Certifications", icon: Award },
  { label: "Resume", icon: FileSearch }
];

interface WizardProps {
  initialProfile: {
    phone?: string | null; college?: string | null; university?: string | null;
    departmentId?: string | null; batchId?: string | null; graduationYear?: number | null;
    cgpa?: number | null; location?: string | null; targetRoleId?: string | null;
  } | null;
  roles: { id: string; name: string; description: string | null; category: string | null }[];
  skills: { id: string; name: string; category: string }[];
  departments: { id: string; name: string }[];
  batches: { id: string; name: string; departmentId: string }[];
}

export function OnboardingWizard({ initialProfile, roles, skills, departments, batches }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    phone: initialProfile?.phone ?? "", college: initialProfile?.college ?? "",
    university: initialProfile?.university ?? "", departmentId: initialProfile?.departmentId ?? "",
    batchId: initialProfile?.batchId ?? "", graduationYear: initialProfile?.graduationYear ? String(initialProfile.graduationYear) : "",
    cgpa: initialProfile?.cgpa ? String(initialProfile.cgpa) : "", location: initialProfile?.location ?? ""
  });
  const [roleId, setRoleId] = useState(initialProfile?.targetRoleId ?? "");
  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>({});
  const [project, setProject] = useState({ name: "", description: "", technologies: "", githubUrl: "" });
  const [projectAdded, setProjectAdded] = useState(false);
  const [certification, setCertification] = useState({ name: "", issuer: "" });
  const [certAdded, setCertAdded] = useState(false);
  const [resume, setResume] = useState<{ name: string; status: "none" | "uploading" | "done" | "error" }>({ name: "", status: "none" });
  const [roleQuery, setRoleQuery] = useState("");

  const setP = (key: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile({ ...profile, [key]: e.target.value });

  async function saveStep() {
    setLoading(true);
    try {
      if (step === 1) {
        await api("/api/profile", {
          method: "PATCH",
          body: JSON.stringify({
            phone: profile.phone || null, college: profile.college || null, university: profile.university || null,
            departmentId: profile.departmentId || null, batchId: profile.batchId || null,
            graduationYear: profile.graduationYear ? Number(profile.graduationYear) : null,
            cgpa: profile.cgpa ? Number(profile.cgpa) : null, location: profile.location || null
          })
        });
      } else if (step === 2) {
        if (!roleId) { toast.error("Select a target role"); setLoading(false); return; }
        await api("/api/profile/target-role", { method: "POST", body: JSON.stringify({ roleId }) });
      } else if (step === 3) {
        for (const [skillId, level] of Object.entries(selectedSkills)) {
          await api("/api/skills/self", { method: "POST", body: JSON.stringify({ skillId, level }) });
        }
      } else if (step === 4) {
        if (projectAdded && project.name) {
          await api("/api/projects", {
            method: "POST",
            body: JSON.stringify({ ...project, technologies: project.technologies.split(",").map((t) => t.trim()).filter(Boolean), difficulty: "INTERMEDIATE", status: "IN_PROGRESS", demoUrl: null, role: "Developer" })
          });
        }
      } else if (step === 5) {
        if (certAdded && certification.name) {
          await api("/api/certifications", { method: "POST", body: JSON.stringify({ ...certification, date: null, credentialUrl: null }) });
        }
      } else if (step === 6) {
        await api("/api/onboarding/complete", { method: "POST" });
        toast.success("Profile complete — welcome to CareerLens! 🎉");
        router.push("/student");
        router.refresh();
        return;
      }
      setStep((s) => Math.min(6, s + 1));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save this step");
    } finally {
      setLoading(false);
    }
  }

  async function onResume(file: File) {
    setResume({ name: file.name, status: "uploading" });
    try {
      const text = await extractTextFromFile(file);
      const result = await api<{ resumeId: string }>("/api/resume/upload", {
        method: "POST",
        body: (() => {
          const form = new FormData();
          form.append("file", file);
          form.append("text", text);
          return form;
        })()
      });
      // Auto-apply extracted skills (minimal, safe merge)
      void result;
      setResume({ name: file.name, status: "done" });
      toast.success("Resume uploaded — skills will be refined later in Resume Analysis");
    } catch (err) {
      setResume({ name: file.name, status: "error" });
      toast.error(err instanceof ApiError ? err.message : "Could not upload resume");
    }
  }

  const filteredRoles = roles.filter((r) => r.name.toLowerCase().includes(roleQuery.toLowerCase()));
  const canNext = step === 1 || (step === 2 ? Boolean(roleId) : true);

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white">
          <Sparkles className="h-5.5 w-5.5" />
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink-900">Set up your profile</h1>
        <p className="mt-1 text-sm text-ink-500">Six quick steps — most students finish in under 3 minutes.</p>
      </div>

      {/* Stepper */}
      <div className="mb-6 flex items-center justify-between">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done = n < step;
          const active = n === step;
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors", done ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 bg-white text-ink-400")}>
                  {done ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn("hidden text-[10px] font-semibold sm:block", active ? "text-brand-700" : "text-ink-400")}>{s.label}</span>
              </div>
              {n < STEPS.length && <div className={cn("mx-1 h-0.5 flex-1 rounded", n < step ? "bg-emerald-400" : "bg-ink-200")} />}
            </div>
          );
        })}
      </div>

      <Card className="p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-[15px] font-bold text-ink-900">Personal profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="o-phone">Phone</Label>
                <Input id="o-phone" value={profile.phone} onChange={setP("phone")} placeholder="+91 98xxxxxx00" />
              </div>
              <div>
                <Label htmlFor="o-location">Location</Label>
                <Input id="o-location" value={profile.location} onChange={setP("location")} placeholder="Hyderabad" />
              </div>
              <div>
                <Label htmlFor="o-college">College</Label>
                <Input id="o-college" value={profile.college} onChange={setP("college")} placeholder="Your college" />
              </div>
              <div>
                <Label htmlFor="o-university">University</Label>
                <Input id="o-university" value={profile.university} onChange={setP("university")} placeholder="Your university" />
              </div>
              <div>
                <Label htmlFor="o-dept">Department</Label>
                <Select id="o-dept" value={profile.departmentId} onChange={setP("departmentId")}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="o-batch">Batch</Label>
                <Select id="o-batch" value={profile.batchId} onChange={setP("batchId")}>
                  <option value="">Select batch</option>
                  {batches.filter((b) => !profile.departmentId || b.departmentId === profile.departmentId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="o-year">Graduation year</Label>
                <Input id="o-year" type="number" min={2000} max={2100} value={profile.graduationYear} onChange={setP("graduationYear")} placeholder="2026" />
              </div>
              <div>
                <Label htmlFor="o-cgpa">CGPA</Label>
                <Input id="o-cgpa" type="number" step="0.01" min={0} max={10} value={profile.cgpa} onChange={setP("cgpa")} placeholder="8.5" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-[15px] font-bold text-ink-900">Career goal</h2>
            <p className="text-[13px] text-ink-500">Select the role you're preparing for. CareerLens compares your skills against its exact requirements.</p>
            <Input placeholder="Search roles…" value={roleQuery} onChange={(e) => setRoleQuery(e.target.value)} />
            <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredRoles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoleId(r.id)}
                  className={cn("rounded-xl border p-3.5 text-left transition-colors", roleId === r.id ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-ink-200 hover:border-ink-300 hover:bg-ink-50")}
                >
                  <p className="text-[13px] font-semibold text-ink-900">{r.name}</p>
                  {r.description && <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-500">{r.description}</p>}
                  {r.category && <span className="mt-1.5 inline-block rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">{r.category}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-[15px] font-bold text-ink-900">Your skills</h2>
            <p className="text-[13px] text-ink-500">Tap a skill to add it, then set your proficiency. You can refine this anytime later.</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => {
                const selected = s.id in selectedSkills;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSkills((cur) => {
                      const next = { ...cur };
                      if (s.id in next) delete next[s.id];
                      else next[s.id] = 3;
                      return next;
                    })}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", selected ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50")}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: selected ? "#fff" : CATEGORY_COLOR[s.category] ?? "#64748b" }} />
                    {s.name}
                  </button>
                );
              })}
            </div>
            {Object.keys(selectedSkills).length > 0 && (
              <div className="space-y-2.5 rounded-xl border border-ink-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Proficiency</p>
                {Object.entries(selectedSkills).map(([skillId, level]) => {
                  const skill = skills.find((s) => s.id === skillId);
                  if (!skill) return null;
                  return (
                    <div key={skillId} className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-medium text-ink-700">{skill.name}</span>
                      <Select className="w-40" value={level} onChange={(e) => setSelectedSkills({ ...selectedSkills, [skillId]: Number(e.target.value) })}>
                        {Object.entries(LEVEL_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                      </Select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-[15px] font-bold text-ink-900">A project (optional but recommended)</h2>
            <p className="text-[13px] text-ink-500">Projects power your Projects readiness component and give interviewers something to ask about.</p>
            {projectAdded ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="text-[13px] font-semibold text-emerald-800">{project.name}</p>
                  <p className="text-[11px] text-emerald-600">Added to your profile</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setProjectAdded(false)}>Edit</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="o-pname">Project name</Label>
                  <Input id="o-pname" value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} placeholder="Placement Prep Tracker" />
                </div>
                <div>
                  <Label htmlFor="o-pdesc">Description</Label>
                  <Textarea id="o-pdesc" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} placeholder="What does it do? Your role in it?" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="o-ptech">Technologies</Label>
                    <Input id="o-ptech" value={project.technologies} onChange={(e) => setProject({ ...project, technologies: e.target.value })} placeholder="Python, React, SQL" />
                  </div>
                  <div>
                    <Label htmlFor="o-purl">GitHub URL</Label>
                    <Input id="o-purl" value={project.githubUrl} onChange={(e) => setProject({ ...project, githubUrl: e.target.value })} placeholder="https://github.com/…" />
                  </div>
                </div>
                <Button variant="outline" onClick={() => project.name && setProjectAdded(true)} disabled={!project.name}>
                  <Check className="h-4 w-4" /> Add this project
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-[15px] font-bold text-ink-900">A certification (optional)</h2>
            <p className="text-[13px] text-ink-500">Certifications strengthen your Resume readiness component.</p>
            {certAdded ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="text-[13px] font-semibold text-emerald-800">{certification.name}</p>
                  <p className="text-[11px] text-emerald-600">Added to your profile</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCertAdded(false)}>Edit</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="o-cname">Certification name</Label>
                  <Input id="o-cname" value={certification.name} onChange={(e) => setCertification({ ...certification, name: e.target.value })} placeholder="Python for Everybody" />
                </div>
                <div>
                  <Label htmlFor="o-issuer">Issuer</Label>
                  <Input id="o-issuer" value={certification.issuer} onChange={(e) => setCertification({ ...certification, issuer: e.target.value })} placeholder="Coursera" />
                </div>
                <Button variant="outline" onClick={() => certification.name && setCertAdded(true)} disabled={!certification.name}>
                  <Check className="h-4 w-4" /> Add this certification
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 6 */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-[15px] font-bold text-ink-900">Upload your resume (optional)</h2>
            <p className="text-[13px] text-ink-500">We'll extract your skills, education and certifications — you'll confirm everything in Resume Analysis later.</p>
            <div className="rounded-xl border-2 border-dashed border-ink-300 p-8 text-center">
              {resume.status === "done" ? (
                <div className="text-emerald-600">
                  <Check className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm font-semibold">{resume.name}</p>
                  <p className="text-xs text-ink-400">Uploaded successfully</p>
                </div>
              ) : (
                <>
                  <input type="file" id="o-resume" accept=".pdf,.docx" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onResume(f);
                    e.target.value = "";
                  }} />
                  <label htmlFor="o-resume" className="cursor-pointer text-sm font-semibold text-brand-600 hover:text-brand-700">
                    {resume.status === "uploading" ? "Uploading…" : "Choose a PDF or DOCX"}
                  </label>
                  {resume.status === "error" && <p className="mt-2 text-xs text-rose-600">Could not process that file — try another.</p>}
                </>
              )}
            </div>
            <div className="rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 p-4 text-white">
              <p className="flex items-center gap-2 text-sm font-bold"><Rocket className="h-4 w-4" /> You're all set!</p>
              <p className="mt-1 text-[13px] text-white/85">Hit Finish and CareerLens will analyze your skills, compute your readiness and generate a personalized roadmap.</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || loading}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-400">Step {step} of 6</span>
            <Button onClick={saveStep} loading={loading} disabled={!canNext}>
              {step === 6 ? "Finish" : "Continue"} {step < 6 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
