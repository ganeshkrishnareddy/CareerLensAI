import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const [assessments, attempts] = await Promise.all([
    prisma.assessment.findMany({
      where: { isActive: true },
      include: { role: true, skill: true, _count: { select: { questions: true } } },
      orderBy: { type: "asc" }
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId: session.id, status: "SUBMITTED" },
      include: { assessment: true },
      orderBy: { submittedAt: "desc" }
    })
  ]);

  const bestByAssessment = new Map<string, number>();
  const lastByAssessment = new Map<string, { score: number; submittedAt: Date }>();
  for (const a of attempts) {
    if (a.score === null) continue;
    if (!bestByAssessment.has(a.assessmentId) || (a.score ?? 0) > (bestByAssessment.get(a.assessmentId) ?? 0)) {
      bestByAssessment.set(a.assessmentId, a.score ?? 0);
    }
    lastByAssessment.set(a.assessmentId, { score: a.score, submittedAt: a.submittedAt! });
  }

  return NextResponse.json({
    assessments: assessments.map((a) => ({
      ...a,
      bestScore: bestByAssessment.get(a.id) ?? null,
      lastScore: lastByAssessment.get(a.id)?.score ?? null,
      lastTakenAt: lastByAssessment.get(a.id)?.submittedAt ?? null
    })),
    attempts
  });
}
