import Link from "next/link";
import { ClipboardList, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge, EmptyState, statusBadgeColor } from "@/components/ui/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  TECHNICAL: "Technical",
  CODING: "Coding",
  APTITUDE: "Aptitude",
  COMMUNICATION: "Communication",
  INTERVIEW: "Interview Readiness",
  ROLE_SPECIFIC: "Role-specific",
  SKILL_SPECIFIC: "Skill-specific"
};

export default async function AssessmentsPage() {
  const session = await requireRole("STUDENT");
  const [assessments, attempts] = await Promise.all([
    prisma.assessment.findMany({
      where: { isActive: true },
      include: { role: true, skill: true, _count: { select: { questions: true } } },
      orderBy: [{ type: "asc" }, { title: "asc" }]
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId: session.id, status: "SUBMITTED" },
      include: { assessment: true },
      orderBy: { submittedAt: "desc" }
    })
  ]);

  const bestByAssessment = new Map<string, number>();
  for (const a of attempts) {
    if (a.score === null) continue;
    if (!bestByAssessment.has(a.assessmentId) || (a.score ?? 0) > (bestByAssessment.get(a.assessmentId) ?? 0)) {
      bestByAssessment.set(a.assessmentId, a.score ?? 0);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Assessments</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every question maps to real skills. Results automatically update your skill profile, gaps, readiness and roadmap.
        </p>
      </div>

      {assessments.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="No assessments available yet" description="Check back soon — your institution publishes assessments here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((a) => {
            const best = bestByAssessment.get(a.id);
            const lastAttempt = attempts.find((t) => t.assessmentId === a.id);
            return (
              <Card key={a.id} hover className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <Badge color="brand">{TYPE_LABELS[a.type] ?? a.type}</Badge>
                  <span className="rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">{a.difficulty}</span>
                </div>
                <h3 className="mt-3 text-[15px] font-bold text-ink-900">{a.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-[12px] leading-relaxed text-ink-500">
                  {a.description ?? "Timed assessment with instant evaluation and skill mapping."}
                  {a.role && <> · For {a.role.name}</>}
                  {a.skill && <> · Focus: {a.skill.name}</>}
                </p>
                <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-400">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.durationMinutes} min</span>
                  <span>{a._count.questions} questions</span>
                  <span>Pass: {a.passScore}%</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3.5">
                  {best !== undefined ? (
                    <span className="flex items-center gap-1.5 text-xs text-ink-500">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Best: <b className="text-ink-800">{best}%</b>
                      {lastAttempt && <span className="text-ink-400">· {formatDate(lastAttempt.submittedAt)}</span>}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">Not attempted yet</span>
                  )}
                  <Link
                    href={`/student/assessments/take/${a.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    {best !== undefined ? "Retake" : "Start"} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
