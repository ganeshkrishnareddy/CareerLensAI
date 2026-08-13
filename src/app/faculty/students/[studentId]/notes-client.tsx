"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button, Card, CardHeader, Textarea } from "@/components/ui/ui";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface NoteRow {
  id: string;
  note: string;
  facultyName: string;
  createdAt: string;
}

export function NotesClient({ studentId, initialNotes }: { studentId: string; initialNotes: NoteRow[] }) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      const res = await api<{ note: { id: string; content: string } }>(`/api/faculty/students/${studentId}/notes`, {
        method: "POST",
        body: JSON.stringify({ note: value.trim() })
      });
      setNotes((prev) => [
        { id: res.note.id, note: res.note.content, facultyName: "You", createdAt: "Just now" },
        ...prev
      ]);
      setValue("");
      toast.success("Intervention note added");
    } catch {
      toast.error("Could not add note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Intervention notes" subtitle="Notes visible to the student as well" />
      <div className="space-y-3 p-5">
        <div>
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add an intervention note for this student…" />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={addNote} disabled={!value.trim() || saving} loading={saving}>
              <MessageSquarePlus className="h-4 w-4" /> Add note
            </Button>
          </div>
        </div>
        {notes.length === 0 && <p className="text-sm text-ink-400">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="rounded-xl bg-ink-50 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-ink-700">{n.facultyName}</p>
              <p className="text-[11px] text-ink-400">{n.createdAt}</p>
            </div>
            <p className="mt-1 text-[13px] text-ink-700">{n.note}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
