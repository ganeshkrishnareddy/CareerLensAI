"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Lightbulb } from "lucide-react";
import { Badge, Button, Card, EmptyState } from "@/components/ui/ui";

interface InterviewQ {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  sampleAnswer: string | null;
  role?: string | null;
  skill?: string | null;
  tips: string[];
}

export function InterviewPractice({ questions }: { questions: InterviewQ[] }) {
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={<Lightbulb className="h-8 w-8" />}
        title="No interview questions available"
        description="Your institution hasn't published questions for this role yet."
      />
    );
  }

  const q = questions[current];

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge color="brand">{q.category}</Badge>
          <Badge color="slate">{q.difficulty}</Badge>
          {q.role && <Badge color="violet">{q.role}</Badge>}
        </div>
        <span className="text-xs text-ink-400">Question {current + 1} of {questions.length}</span>
      </div>

      <h2 className="mt-5 text-[16px] font-semibold leading-relaxed text-ink-900">{q.question}</h2>

      <div className="mt-5">
        <Button variant={showAnswer ? "outline" : "secondary"} onClick={() => setShowAnswer(!showAnswer)}>
          {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showAnswer ? "Hide sample answer" : "Reveal sample answer"}
        </Button>
        {showAnswer && q.sampleAnswer && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 animate-fade-in">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Sample answer</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">{q.sampleAnswer}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4">
        <Button variant="outline" onClick={() => { setCurrent(Math.max(0, current - 1)); setShowAnswer(false); }} disabled={current === 0}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <p className="text-xs text-ink-400">Tip: answer out loud, time yourself, then compare.</p>
        <Button onClick={() => { setCurrent(Math.min(questions.length - 1, current + 1)); setShowAnswer(false); }} disabled={current === questions.length - 1}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
