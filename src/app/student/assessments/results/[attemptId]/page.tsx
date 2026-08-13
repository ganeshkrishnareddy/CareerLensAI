"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Card, Skeleton, statusBadgeColor } from "@/components/ui/ui";
import { SimpleBars } from "@/components/charts";
import { ArrowRight, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultData {
  attempt: {
    id: string;
    score: number | null;
    passed: boolean | null;
    correctCount: number;
    totalQuestions: number;
    timeTakenSeconds: number | null;
    submittedAt: string | null;
    assessment: { title: string; type: string };
  };
  perSkill: { skillId: string; skillName: string; score: number }[];
  questions: {
    id: string;
    text: string;
    type: string;
    options: { key: string; text: string }[] | null;
    marks: number;
    explanation: string | null;
    yourAnswer: unknown;
    isCorrect: boolean | null;
    marksEarned: number;
    feedback: string | null;
  }[];
}

export default function ResultsPage() {
  const params = useParams<{ attemptId: string }>();
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<ResultData>(`/api/assessments/attempts/${params.attemptId}`);
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load result");
      }
    })();
  }, [params.attemptId]);

  if (error) return <p className="py-16 text-center text-sm text-ink-500">{error}</p>;
  if (!result) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { attempt, perSkill, questions } = result;
  const score = attempt.score ?? 0;
  const minutes = attempt.timeTakenSeconds ? Math.round(attempt.timeTakenSeconds / 60) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className={cn("rounded-2xl p-6 text-white", attempt.passed ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-rose-600 to-orange-500")}>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{attempt.assessment.title}</p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{attempt.passed ? "You passed! 🎉" : "Keep pushing 💪"}</h1>
            <p className="mt-1 text-sm text-white/80">
              {attempt.correctCount}/{attempt.totalQuestions} correct · {minutes !== null ? `${minutes} min` : ""} · auto-evaluated
            </p>
          </div>
          <div className="text-center">
            <p className="font-display text-5xl font-bold">{score}%</p>
            <p className="mt-1 text-xs text-white/70">Score</p>
          </div>
        </div>
      </div>

      {perSkill.length > 0 && (
        <Card className="p-5">
          <h2 className="text-[15px] font-bold text-ink-900">Skill performance</h2>
          <p className="mt-0.5 text-xs text-ink-500">These scores were blended into your skill profile — gaps and readiness are now updated.</p>
          <div className="mt-4">
            <SimpleBars data={perSkill.map((s) => ({ label: s.skillName, value: s.score }))} height={Math.max(180, perSkill.length * 44)} />
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink-900">Answer review</h2>
          <Link href="/student/gaps" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
            See updated gaps <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {questions.map((q, i) => {
            const isCorrect = q.isCorrect;
            return (
              <div key={q.id} className="rounded-xl border border-ink-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-ink-800">{i + 1}. {q.text}</p>
                  {isCorrect === true ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : isCorrect === false ? (
                    <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                  ) : (
                    <Badge color="slate">—</Badge>
                  )}
                </div>
                {q.options && (
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {q.options.map((o) => {
                      const correctKeys: string[] = (q as unknown as { correctAnswer?: { keys?: string[] } }).correctAnswer?.keys ?? [];
                      const yourKeys = Array.isArray(q.yourAnswer) ? (q.yourAnswer as string[]) : typeof q.yourAnswer === "string" ? [q.yourAnswer] : [];
                      const isCorrectOpt = correctKeys.includes(o.key);
                      const isYourOpt = yourKeys.includes(o.key);
                      return (
                        <div key={o.key} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs", isCorrectOpt ? "bg-emerald-50 text-emerald-700" : isYourOpt ? "bg-rose-50 text-rose-700" : "text-ink-500")}>
                          <span className="font-bold">{o.key.toUpperCase()}.</span> {o.text}
                          {isCorrectOpt && <CheckCircle2 className="ml-auto h-3.5 w-3.5" />}
                          {isYourOpt && !isCorrectOpt && <XCircle className="ml-auto h-3.5 w-3.5" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.type === "CODING" || q.type === "TEXT" ? (
                  <div className="mt-2 rounded-lg bg-ink-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Your answer</p>
                    <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-ink-700">{typeof q.yourAnswer === "string" ? q.yourAnswer || "—" : JSON.stringify(q.yourAnswer ?? "—")}</p>
                  </div>
                ) : null}
                {q.feedback && <p className="mt-2 text-xs text-ink-500">{q.feedback}</p>}
                {q.explanation && (
                  <p className="mt-2 rounded-lg bg-brand-50 p-2.5 text-xs text-brand-800">
                    <b>Explanation:</b> {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap justify-center gap-3 pb-6">
        <Link href="/student/assessments" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          <RefreshCw className="h-4 w-4" /> Retake
        </Link>
        <Link href="/student/roadmap" className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50">
          Continue my roadmap <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
