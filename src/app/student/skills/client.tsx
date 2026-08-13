"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Input, Select, Label } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";
import { CATEGORY_LABEL, CATEGORY_COLOR, LEVEL_LABELS } from "@/lib/catalog";

interface Skill {
  id: string;
  name: string;
  category: string;
}

export function AddSkillModal({ skills, existingIds }: { skills: Skill[]; existingIds: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Skill | null>(null);
  const [level, setLevel] = useState(3);
  const [loading, setLoading] = useState(false);

  const filtered = skills.filter(
    (s) => !existingIds.includes(s.id) && s.name.toLowerCase().includes(query.toLowerCase())
  );

  async function add() {
    if (!selected) return;
    setLoading(true);
    try {
      await api("/api/skills/self", { method: "POST", body: JSON.stringify({ skillId: selected.id, level }) });
      toast.success(`${selected.name} added to your profile`);
      setOpen(false);
      setSelected(null);
      setQuery("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add skill");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="self-start sm:self-auto">
        <Plus className="h-4 w-4" /> Add skill
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a skill" footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={add} loading={loading} disabled={!selected}>Add to profile</Button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <Label>Search skills</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input className="pl-9" placeholder="e.g. Python, React, SQL…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ink-200 p-1.5">
            {filtered.slice(0, 40).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${selected?.id === s.id ? "bg-brand-50 text-brand-700" : "hover:bg-ink-50 text-ink-700"}`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[s.category] ?? "#64748b" }} />
                  {s.name}
                </span>
                <span className="text-[11px] text-ink-400">{CATEGORY_LABEL[s.category] ?? s.category}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="py-6 text-center text-xs text-ink-400">No matching skills. Try a different search.</p>}
          </div>
          {selected && (
            <div>
              <Label htmlFor="level">Proficiency level</Label>
              <Select id="level" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
                {Object.entries(LEVEL_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </Select>
            </div>
          )}
          <p className="flex items-start gap-1.5 rounded-lg bg-ink-50 p-2.5 text-[11px] leading-relaxed text-ink-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Your self-reported level seeds your score. Assessment results will refine it over time.
          </p>
        </div>
      </Modal>
    </>
  );
}

export function RemoveSkillButton({ skillId, skillName }: { skillId: string; skillName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function remove() {
    setLoading(true);
    try {
      await api(`/api/skills/self?skillId=${skillId}`, { method: "DELETE" });
      toast.success(`${skillName} removed`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove skill");
      setLoading(false);
    }
  }
  return (
    <button onClick={remove} disabled={loading} className="rounded-lg p-1.5 text-ink-300 hover:bg-rose-50 hover:text-rose-500" title={`Remove ${skillName}`} aria-label={`Remove ${skillName}`}>
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
