"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, Skeleton } from "@/components/ui/ui";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  type: string;
  options: { key: string; text: string }[] | null;
  marks: number;
  difficulty: string;
}

interface StartResult {
  attempt: { id: string; deadline: string; status: string };
  questions: Question[];
  fresh: boolean;
}

export default function TakeAssessmentPage() {
  const params = useParams<{ assessmentId: string }>();
  const router = useRouter();
  const [state, setState] = useState<StartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await api<StartResult>("/api/assessments/start", {
          method: "POST",
          body: JSON.stringify({ assessmentId: params.assessmentId })
        });
        setState(result);
        setTimeLeft(Math.max(0, Math.floor((new Date(result.attempt.deadline).getTime() - Date.now()) / 1000)));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not start assessment");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.assessmentId]);

  const questions = state?.questions ?? [];
  const totalMarks = useMemo(() => questions.reduce((a, q) => a + q.marks, 0) || 1, [questions]);

  // Countdown
  useEffect(() => {
    if (!state || state.attempt.status !== "IN_PROGRESS") return;
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(iv);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleSubmit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? null }));
      const result = await api<{ attemptId: string }>("/api/assessments/attempts/" + state!.attempt.id + "/submit", {
        method: "POST",
        body: JSON.stringify({ answers: payload })
      });
      if (auto) toast.info("Time's up — your attempt was submitted automatically.");
      router.push(`/student/assessments/results/${result.attemptId}`);
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      toast.error(err instanceof ApiError ? err.message : "Could not submit");
      if (err instanceof ApiError && err.status === 410) {
        router.refresh();
      }
    }
  }

  function currentAnswer(q: Question): string {
    const a = answers[q.id];
    return typeof a === "string" ? a : "";
  }

  function selectedKeys(q: Question): string[] {
    const a = answers[q.id];
    return Array.isArray(a) ? (a as string[]) : [];
  }

  function toggleOption(q: Question, key: string) {
    if (q.type === "MULTIPLE") {
      const arr = selectedKeys(q);
      setAnswers({ ...answers, [q.id]: arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key] });
    } else {
      setAnswers({ ...answers, [q.id]: key });
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
        <h1 className="mt-4 text-lg font-bold text-ink-900">Could not start</h1>
        <p className="mt-2 text-sm text-ink-500">{error}</p>
        <Link href="/student/assessments" className="mt-6 inline-block rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Back to assessments</Link>
      </div>
    );
  }

  if (!state || questions.length === 0) return null;

  const q = questions[current];
  const answeredCount = questions.filter((question) => {
    const a = answers[question.id];
    if (question.type === "MULTIPLE") return Array.isArray(a) && a.length > 0;
    return typeof a === "string" && a.length > 0;
  }).length;
  const mm = Math.floor(timeLeft / 60);
  const ss = timeLeft % 60;
  const urgent = timeLeft < 120;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/student/assessments" className="text-xs font-medium text-ink-400 hover:text-ink-600">← Assessments</Link>
          <h1 className="mt-1 text-lg font-bold text-ink-900">{state.fresh ? "Assessment in progress" : "Resuming assessment"}</h1>
        </div>
        <div className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2 font-display text-lg font-bold tabular-nums", urgent ? "bg-rose-50 text-rose-600" : "bg-ink-900 text-white")}>
          <Clock className="h-4.5 w-4.5" />
          {mm}:{String(ss).padStart(2, "0")}
        </div>
      </div>

      {/* Question */}
      <Card className="p-6">
        <div className="flex items-center justify-between text-xs text-ink-400">
          <span>Question {current + 1} of {questions.length}</span>
          <span className="rounded-md bg-ink-100 px-2 py-0.5 font-semibold text-ink-500">{q.marks} pt{q.marks > 1 ? "s" : ""} · {q.difficulty}</span>
        </div>
        <h2 className="mt-4 text-[16px] font-semibold leading-relaxed text-ink-900">{q.text}</h2>

        {q.type === "MCQ" || q.type === "MULTIPLE" ? (
          <div className="mt-5 space-y-2.5">
            {q.options?.map((opt) => {
              const selected = q.type === "MULTIPLE" ? selectedKeys(q).includes(opt.key) : currentAnswer(q) === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleOption(q, opt.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    selected ? "border-brand-600 bg-brand-50 text-brand-900 ring-1 ring-brand-600" : "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50"
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold", selected ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 text-ink-500")}>
                    {opt.key.toUpperCase()}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {q.type === "MULTIPLE" && selected && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                </button>
              );
            })}
            {q.type === "MULTIPLE" && <p className="mt-2 text-[11px] text-ink-400">Select all that apply.</p>}
          </div>
        ) : (
          <div className="mt-5">
            <textarea
              value={currentAnswer(q)}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              placeholder={q.type === "CODING" ? "Write your solution here… (evaluated against key concepts)" : "Write your answer…"}
              className="min-h-[180px] w-full rounded-xl border border-ink-300 bg-white px-4 py-3 font-mono text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <p className="mt-2 text-[11px] text-ink-400">Tip: include key steps, functions and reasoning — short answers are evaluated against a rubric.</p>
          </div>
        )}
      </Card>

      {/* Nav + question map */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent(current + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => handleSubmit()} loading={submitting}>
            <Send className="h-4 w-4" /> Submit assessment
          </Button>
        )}
      </div>

      <Card className="mt-5 p-4">
        <div className="mb-2.5 flex items-center justify-between text-xs text-ink-500">
          <span>Progress: {answeredCount}/{questions.length} answered</span>
          <span>Total marks: {Object.values(answers).filter((a) => a !== null && a !== "" && !(Array.isArray(a) && a.length === 0)).length > 0 ? "—" : ""}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((question, i) => {
            const a = answers[question.id];
            const answered = question.type === "MULTIPLE" ? Array.isArray(a) && a.length > 0 : typeof a === "string" && a.length > 0;
            return (
              <button
                key={question.id}
                onClick={() => setCurrent(i)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                  i === current ? "bg-brand-600 text-white ring-2 ring-brand-600 ring-offset-2" : answered ? "bg-emerald-100 text-emerald-700" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
