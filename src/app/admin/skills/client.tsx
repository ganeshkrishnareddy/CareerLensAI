"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, GraduationCap, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Button, Card, CardHeader, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";
import { confirmDelete } from "@/lib/confirm";

interface SkillRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  isActive: boolean;
  _count: { roleSkills: number; studentSkills: number; questionSkills: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  PROGRAMMING: "Programming",
  FRAMEWORK: "Framework",
  DATABASE: "Database",
  CLOUD: "Cloud",
  CYBERSECURITY: "Cybersecurity",
  DATA_AI: "Data / AI",
  TOOLS: "Tools",
  SOFT: "Soft skills",
  APTITUDE: "Aptitude",
  COMMUNICATION: "Communication",
  DSA: "DSA",
  OTHER: "Other"
};

export function SkillsClient({ initial }: { initial: SkillRow[] }) {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillRow[]>(initial);
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [newCategory, setNewCategory] = useState("PROGRAMMING");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = category ? skills.filter((s) => s.category === category) : skills;
  const groups = new Map<string, SkillRow[]>();
  for (const s of filtered) {
    const key = CATEGORY_LABELS[s.category] ?? s.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  async function createSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api("/api/admin/skills", { method: "POST", body: JSON.stringify({ name: name.trim(), category: newCategory, description: desc.trim() || undefined }) });
      toast.success("Skill created");
      setOpen(false);
      setName("");
      setDesc("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create skill");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSkill(s: SkillRow) {
    setBusy(s.id);
    try {
      await api(`/api/admin/skills/${s.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !s.isActive }) });
      toast.success(s.isActive ? "Skill deactivated" : "Skill activated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update skill");
    } finally {
      setBusy(null);
    }
  }

  async function removeSkill(s: SkillRow) {
    if (!(await confirmDelete(`Delete ${s.name}?`, "This removes the skill from the catalog. Linked role requirements and questions will be affected."))) return;
    setBusy(s.id);
    try {
      await api(`/api/admin/skills/${s.id}`, { method: "DELETE" });
      toast.success("Skill deleted");
      setSkills((prev) => prev.filter((x) => x.id !== s.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete skill");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        subtitle="The skill catalog used by role requirements, assessments and resume extraction."
        action={
          <div className="flex items-center gap-2">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
              <option value="">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New skill</Button>
          </div>
        }
      />

      {skills.length === 0 && <EmptyState icon={<GraduationCap className="h-8 w-8" />} title="No skills yet" description="Add skills to power the gap engine." />}

      <div className="space-y-6">
        {[...groups.entries()].map(([label, items]) => (
          <div key={label}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-500">{label} · {items.length}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <Card key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{s.name}</p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {s._count.roleSkills} role{s._count.roleSkills === 1 ? "" : "s"} · {s._count.studentSkills} students · {s._count.questionSkills} questions
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!s.isActive && <Badge color="slate">Inactive</Badge>}
                      <Button variant="ghost" size="icon" disabled={busy === s.id} onClick={() => toggleSkill(s)} title={s.isActive ? "Deactivate" : "Activate"}>
                        <GraduationCap className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={busy === s.id} onClick={() => removeSkill(s)} className="text-ink-400 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add skill">
        <form onSubmit={createSkill} className="space-y-4">
          <div>
            <Label>Skill name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Docker" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!name.trim()}>Create skill</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
