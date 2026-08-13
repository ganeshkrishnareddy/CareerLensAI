import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, ScoreRing } from "@/components/ui/ui";
import { CoachChat } from "./client";

export const dynamic = "force-dynamic";

const SUGGESTIONS = [
  "What should I learn next?",
  "Why is my readiness score low?",
  "How can I improve DSA?",
  "What roles am I ready for?",
  "What skills am I missing?",
  "Give me interview questions"
];

export default async function CoachPage() {
  const session = await requireRole("STUDENT");
  const [snapshot, gaps, roadmap] = await Promise.all([
    prisma.readinessSnapshot.findFirst({ where: { userId: session.id }, orderBy: { createdAt: "desc" } }),
    prisma.skillGap.findMany({ where: { userId: session.id }, include: { skill: true, role: true }, orderBy: { priority: "desc" } }),
    prisma.roadmap.findFirst({ where: { userId: session.id, status: { in: ["ACTIVE", "COMPLETED"] } } })
  ]);

  const topGap = gaps.find((g) => g.status !== "STRONG");
  const critical = gaps.filter((g) => g.status === "CRITICAL_GAP");
  const assessmentSuggestion = topGap
    ? `Suggested assessment: after practicing ${topGap.skill.name}, retake the linked skill test to update your score.`
    : "Suggested assessment: interview readiness — your next lever.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900 sm:text-2xl">
          <Sparkles className="h-5 w-5 text-brand-600" /> AI Career Coach
        </h1>
        <p className="mt-1 text-sm text-ink-500">Ask anything about your placement prep — answers are generated from your live profile and assessment data.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <CoachChat
          suggestions={SUGGESTIONS}
          initial={{
            readiness: snapshot?.overall ?? null,
            topGap: topGap ? `${topGap.skill.name} (${topGap.currentScore}% vs ${topGap.requiredScore}% needed)` : null,
            nextAction: topGap ? `Start with ${topGap.skill.name} on your roadmap` : roadmap ? "Continue your roadmap" : "Take your first assessment",
            assessment: assessmentSuggestion
          }}
        />

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Your readiness</p>
            <div className="mt-2 flex items-center gap-4">
              <ScoreRing value={snapshot?.overall ?? 0} size={88} stroke={9} />
              <div className="text-xs text-ink-500">
                <p className="text-ink-800">Target: {gaps[0]?.role?.name ?? "—"}</p>
                <p className="mt-1">{critical.length > 0 ? `${critical.length} critical gap${critical.length > 1 ? "s" : ""}` : "No critical gaps"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Top skill gap</p>
            <p className="mt-2 text-[14px] font-semibold text-ink-800">{topGap?.skill.name ?? "None — great position"}</p>
            {topGap && <p className="mt-1 text-xs text-ink-500">{topGap.currentScore}% → need {topGap.requiredScore}% · priority {topGap.priority}/10</p>}
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Recommended next action</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{topGap ? `Start with ${topGap.skill.name} — your roadmap has a focused plan ready.` : "Complete a readiness assessment to keep improving."}</p>
            <Link href={topGap ? "/student/roadmap" : "/student/assessments"} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
              Go <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card className="border-brand-200 bg-brand-50/50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">{assessmentSuggestion.split(":")[0]}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{assessmentSuggestion.split(":").slice(1).join(":")}</p>
            <Link href="/student/assessments" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
              Browse assessments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
