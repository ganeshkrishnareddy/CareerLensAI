"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";
import { confirmDelete } from "@/lib/confirm";

interface AssessmentRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  difficulty: string;
  durationMinutes: number;
  passScore: number;
  isActive: boolean;
  role: { id: string; name: string } | null;
  skill: { id: string; name: string } | null;
  _count: { questions: number; attempts: number };
}

const TYPE_LABELS: Record<string, string> = {
  TECHNICAL: "Technical",
  CODING: "Coding",
  APTITUDE: "Aptitude",
  COMMUNICATION: "Communication",
  INTERVIEW: "Interview",
  ROLE_SPECIFIC: "Role-specific",
  SKILL_SPECIFIC: "Skill-specific"
};

export function AssessmentsClient({
  initial,
  roles,
  skills
}: {
  initial: AssessmentRow[];
  roles: { id: string; name: string }[];
  skills: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<AssessmentRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("TECHNICAL");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [duration, setDuration] = useState("15");
  const [passScore, setPassScore] = useState("50");
  const [roleId, setRoleId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function createAssessment(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await api<{ assessment: { id: string } }>("/api/admin/assessments", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: desc.trim() || undefined, type, difficulty, durationMinutes: Number(duration), passScore: Number(passScore), roleId: roleId || null, skillId: skillId || null })
      });
      toast.success("Assessment created — now add questions");
      setOpen(false);
      router.push(`/admin/assessments/${res.assessment.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create assessment");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAssessment(a: AssessmentRow) {
    setBusy(a.id);
    try {
      await api(`/api/admin/assessments/${a.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !a.isActive }) });
      toast.success(a.isActive ? "Assessment deactivated" : "Assessment activated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update assessment");
    } finally {
      setBusy(null);
    }
  }

  async function removeAssessment(a: AssessmentRow) {
    if (!(await confirmDelete(`Delete "${a.title}"?`, "All questions and attempt history for this assessment will be removed."))) return;
    setBusy(a.id);
    try {
      await api(`/api/admin/assessments/${a.id}`, { method: "DELETE" });
      toast.success("Assessment deleted");
      setRows((prev) => prev.filter((x) => x.id !== a.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete assessment");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        subtitle="The assessment bank powers skill mapping — every question can feed the student's skill profile."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New assessment</Button>}
      />

      {rows.length === 0 && <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="No assessments yet" description="Create an assessment to start building questions." />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((a) => (
          <Card key={a.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-ink-900">{a.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  {TYPE_LABELS[a.type] ?? a.type} · {a.difficulty} · {a.durationMinutes} min
                </p>
              </div>
              {!a.isActive && <Badge color="slate">Inactive</Badge>}
            </div>
            <p className="mt-2 line-clamp-2 flex-1 text-xs text-ink-500">{a.description ?? "No description"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {a.role && <Badge color="brand">{a.role.name}</Badge>}
              {a.skill && <Badge color="violet">{a.skill.name}</Badge>}
              <Badge color="slate">{a._count.questions} Q</Badge>
              <Badge color="slate">{a._count.attempts} attempts</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Link href={`/admin/assessments/${a.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Questions <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled={busy === a.id} onClick={() => toggleAssessment(a)}>
                  {a.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" size="sm" disabled={busy === a.id} onClick={() => removeAssessment(a)} className="text-ink-400 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create assessment" size="lg">
        <form onSubmit={createAssessment} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DSA Fundamentals Test" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What does this assess?" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <Label>Pass score %</Label>
              <Input type="number" min={0} max={100} value={passScore} onChange={(e) => setPassScore(e.target.value)} />
            </div>
            <div>
              <Label>Target role (optional)</Label>
              <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                <option value="">No role</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Target skill (optional)</Label>
              <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
                <option value="">No skill</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!title.trim()}>Create & add questions</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
