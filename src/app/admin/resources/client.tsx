"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Button, Card, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";
import { confirmDelete } from "@/lib/confirm";

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  difficulty: string;
  isActive: boolean;
  skill: { id: string; name: string } | null;
}

export function ResourcesClient({ initial, skills }: { initial: ResourceRow[]; skills: { id: string; name: string }[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<ResourceRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("ARTICLE");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [skillId, setSkillId] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function createResource(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    try {
      await api("/api/admin/resources", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), url: url.trim(), type, difficulty, description: description.trim() || undefined, skillId: skillId || null })
      });
      toast.success("Resource added");
      setOpen(false);
      setTitle("");
      setUrl("");
      setDescription("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add resource");
    } finally {
      setSaving(false);
    }
  }

  async function removeResource(r: ResourceRow) {
    if (!(await confirmDelete(`Remove "${r.title}"?`, "The resource will no longer appear in student roadmaps."))) return;
    setBusy(r.id);
    try {
      await api(`/api/admin/resources/${r.id}`, { method: "DELETE" });
      toast.success("Resource removed");
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove resource");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Resources"
        subtitle="Curated resources that the roadmap generator attaches to each task."
        action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add resource</Button>}
      />

      {rows.length === 0 && <EmptyState icon={<BookOpen className="h-8 w-8" />} title="No resources yet" description="Add courses, articles and practice links for students." />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-ink-900">{r.title}</p>
              {!r.isActive && <Badge color="slate">Inactive</Badge>}
            </div>
            <p className="mt-1 line-clamp-2 flex-1 text-xs text-ink-500">{r.description ?? "No description"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge color={r.type === "VIDEO" ? "rose" : r.type === "COURSE" ? "violet" : r.type === "PRACTICE" ? "sky" : "brand"}>{r.type}</Badge>
              <Badge color="slate">{r.difficulty}</Badge>
              {r.skill && <Badge color="emerald">{r.skill.name}</Badge>}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button variant="ghost" size="sm" disabled={busy === r.id} onClick={() => removeResource(r)} className="text-ink-400 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add learning resource">
        <form onSubmit={createResource} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SQL Joins Explained" />
          </div>
          <div>
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="ARTICLE">Article</option>
                <option value="VIDEO">Video</option>
                <option value="COURSE">Course</option>
                <option value="BOOK">Book</option>
                <option value="PRACTICE">Practice</option>
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
            <div className="sm:col-span-2">
              <Label>Related skill (optional)</Label>
              <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
                <option value="">No specific skill</option>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will the student learn?" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!title.trim() || !url.trim()}>Add resource</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
