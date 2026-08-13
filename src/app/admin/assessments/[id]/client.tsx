"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Button, Card, CardHeader, EmptyState, Input, Label, PageHeader, Select, Textarea } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";
import { confirmDelete } from "@/lib/confirm";

interface SkillRef {
  id: string;
  name: string;
}

interface QuestionRow {
  id: string;
  text: string;
  type: string;
  options: { key: string; text: string }[] | null;
  correctAnswer: { keys?: string[] } | null;
  marks: number;
  difficulty: string;
  explanation: string | null;
  questionSk: { skill: SkillRef }[];
}

interface AssessmentMeta {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  durationMinutes: number;
  passScore: number;
  isActive: boolean;
  role: { name: string } | null;
  skill: { name: string } | null;
  _count: { questions: number; attempts: number };
}

const EMPTY_OPTIONS = [
  { key: "a", text: "" },
  { key: "b", text: "" },
  { key: "c", text: "" },
  { key: "d", text: "" }
];

export function QuestionsClient({
  assessment,
  initialQuestions,
  skills
}: {
  assessment: AssessmentMeta;
  initialQuestions: QuestionRow[];
  skills: SkillRef[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [type, setType] = useState("MCQ");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [correct, setCorrect] = useState<string[]>([]);
  const [marks, setMarks] = useState("1");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [explanation, setExplanation] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setText("");
    setType("MCQ");
    setOptions(EMPTY_OPTIONS);
    setCorrect([]);
    setMarks("1");
    setDifficulty("MEDIUM");
    setExplanation("");
    setSkillIds([]);
    setOpen(true);
  }

  function openEdit(q: QuestionRow) {
    setEditing(q);
    setText(q.text);
    setType(q.type);
    setOptions(q.options?.length ? q.options : EMPTY_OPTIONS);
    setCorrect(q.correctAnswer?.keys ?? []);
    setMarks(String(q.marks));
    setDifficulty(q.difficulty);
    setExplanation(q.explanation ?? "");
    setSkillIds(q.questionSk.map((qs) => qs.skill.id));
    setOpen(true);
  }

  function toggleSkill(id: string) {
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function toggleCorrect(key: string) {
    setCorrect((prev) => {
      if (type === "MULTIPLE") {
        return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      }
      return [key];
    });
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const payload = {
      text: text.trim(),
      type,
      options,
      correctAnswer: type === "CODING" || type === "TEXT" ? null : { keys: correct },
      marks: Number(marks),
      difficulty,
      explanation: explanation.trim() || undefined,
      skillIds
    };
    try {
      if (editing) {
        await api(`/api/admin/questions/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Question updated");
      } else {
        await api("/api/admin/questions", { method: "POST", body: JSON.stringify({ assessmentId: assessment.id, ...payload }) });
        toast.success("Question added");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save question");
    } finally {
      setSaving(false);
    }
  }

  async function removeQuestion(q: QuestionRow) {
    if (!(await confirmDelete("Delete question?", "This question and its attempt answers will be removed."))) return;
    setBusy(q.id);
    try {
      await api(`/api/admin/questions/${q.id}`, { method: "DELETE" });
      toast.success("Question deleted");
      setQuestions((prev) => prev.filter((x) => x.id !== q.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete question");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={assessment.title}
        subtitle={`${assessment._count.questions} questions · ${assessment.type} · ${assessment.durationMinutes} min · pass ${assessment.passScore}%`}
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add question</Button>}
      />

      {questions.length === 0 && (
        <EmptyState
          icon={<HelpCircle className="h-8 w-8" />}
          title="No questions yet"
          description="Add objective MCQs, multi-select, coding or text questions. Each question maps to skills that update the student's profile after submission."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add the first question</Button>}
        />
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-ink-400">Q{i + 1}</span>
                  <Badge color={q.type === "MCQ" ? "brand" : q.type === "MULTIPLE" ? "violet" : q.type === "CODING" ? "sky" : "slate"}>{q.type}</Badge>
                  <Badge color="slate">{q.marks} pt{q.marks > 1 ? "s" : ""} · {q.difficulty}</Badge>
                  {q.questionSk.map((qs) => (
                    <Badge key={qs.skill.id} color="emerald">{qs.skill.name}</Badge>
                  ))}
                </div>
                <p className="mt-2 text-[14px] font-medium text-ink-900">{q.text}</p>
                {q.options && (
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {q.options.map((o) => (
                      <p key={o.key} className="text-xs text-ink-600">
                        <b className="text-ink-800">{o.key.toUpperCase()}.</b> {o.text}
                        {q.correctAnswer?.keys?.includes(o.key) && <span className="ml-1 text-emerald-600">✓</span>}
                      </p>
                    ))}
                  </div>
                )}
                {q.explanation && <p className="mt-2 text-xs text-ink-500"><b>Explanation:</b> {q.explanation}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(q)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={busy === q.id} onClick={() => removeQuestion(q)} className="text-ink-400 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Question modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit question" : "Add question"} size="lg">
        <form onSubmit={saveQuestion} className="space-y-4">
          <div>
            <Label>Question text</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Write the question…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onChange={(e) => { setType(e.target.value); setCorrect([]); }}>
                <option value="MCQ">MCQ (single)</option>
                <option value="MULTIPLE">Multiple select</option>
                <option value="CODING">Coding</option>
                <option value="TEXT">Text</option>
              </Select>
            </div>
            <div>
              <Label>Marks</Label>
              <Input type="number" min={1} value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
            </div>
          </div>

          {(type === "MCQ" || type === "MULTIPLE") && (
            <div>
              <Label>{type === "MULTIPLE" ? "Options — select all correct answers" : "Options — select the correct answer"}</Label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCorrect(opt.key)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${correct.includes(opt.key) ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink-300 bg-white text-ink-500"}`}
                      title="Toggle as correct answer"
                    >
                      {correct.includes(opt.key) ? "✓" : opt.key.toUpperCase()}
                    </button>
                    <Input
                      value={opt.text}
                      onChange={(e) => setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o)))}
                      placeholder={`Option ${opt.key.toUpperCase()}`}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-ink-400">Click the letter to mark the correct answer{type === "MULTIPLE" ? "(s)" : ""}.</p>
            </div>
          )}

          {(type === "CODING" || type === "TEXT") && (
            <p className="rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-600">
              {type === "CODING" ? "Coding questions are evaluated against key concepts in the submitted answer." : "Text questions are reviewed manually by faculty."}
            </p>
          )}

          <div>
            <Label>Explanation (shown after submission)</Label>
            <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Why is this the right answer?" />
          </div>

          <div>
            <Label>Mapped skills — these update the student's profile</Label>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => {
                const active = skillIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50"}`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
            {skills.length === 0 && <p className="text-xs text-ink-400">No skills in the catalog yet — add some first.</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!text.trim()}>{editing ? "Save changes" : "Add question"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
