import Link from "next/link";
import { ArrowRight, Target, Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge, ProgressBar, EmptyState, statusBadgeColor } from "@/components/ui/ui";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MissingSkill {
  name: string;
  current: number;
  required: number;
  gap: number;
  status: string;
}

export default async function RolesPage() {
  const session = await requireRole("STUDENT");
  const [matches, profile] = await Promise.all([
    prisma.roleMatch.findMany({ where: { userId: session.id }, include: { role: true }, orderBy: { fitScore: "desc" } }),
    prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true } })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Role Matching</h1>
          <p className="mt-1 text-sm text-ink-500">Every role scored against your real skill profile — with the exact gaps for each.</p>
        </div>
        {profile?.targetRole && (
          <Badge color="brand">Target: {profile.targetRole.name}</Badge>
        )}
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title="No matches yet"
          description="Add more skills and take an assessment so the matcher has enough signal."
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m, i) => {
            const missing = safeJsonParse<MissingSkill[]>(m.missingSkills, []);
            const strengths = safeJsonParse<{ name: string; score: number }[]>(m.strengths, []);
            const reasons = safeJsonParse<string[]>(m.reasons, []);
            return (
              <Card key={m.roleId} className={`p-6 ${i === 0 ? "border-amber-300 ring-1 ring-amber-100" : ""}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {i === 0 && <Trophy className="h-5 w-5 text-amber-500" />}
                      <h2 className="text-[16px] font-bold text-ink-900">{m.role.name}</h2>
                      {m.role.category && <Badge color="slate">{m.role.category}</Badge>}
                      {profile?.targetRoleId === m.roleId && <Badge color="brand">Your target</Badge>}
                    </div>
                    <div className="mt-3 grid max-w-lg gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Fit score</p>
                        <div className="mt-1.5"><ProgressBar value={m.fitScore} color={m.fitScore >= 70 ? "emerald" : m.fitScore >= 50 ? "brand" : "rose"} showLabel /></div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Readiness for role</p>
                        <div className="mt-1.5"><ProgressBar value={m.readinessScore} color="sky" showLabel /></div>
                      </div>
                    </div>
                    {reasons.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        {reasons.map((r, idx) => (
                          <p key={idx} className="flex items-start gap-2 text-[12px] text-ink-600">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                            {r}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {strengths.slice(0, 4).map((s) => (
                        <span key={s.name} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          ✓ {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 lg:w-64">
                    <div className="rounded-xl border border-ink-200 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">To unlock this role</p>
                      {missing.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {missing.slice(0, 3).map((ms) => (
                            <div key={ms.name}>
                              <div className="flex justify-between text-[11px]">
                                <span className="font-medium text-ink-700">{ms.name}</span>
                                <span className="text-ink-400">{ms.current}% → {ms.required}%</span>
                              </div>
                              <Badge color={statusBadgeColor(ms.status)} className="mt-0.5">{ms.gap} pt gap</Badge>
                            </div>
                          ))}
                          {missing.length > 3 && <p className="text-[11px] text-ink-400">+{missing.length - 3} more</p>}
                        </div>
                      ) : (
                        <p className="mt-2 text-[13px] font-medium text-emerald-700">All requirements met 🎉</p>
                      )}
                    </div>
                    <Link href="/student/gaps" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                      Plan for this role <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
