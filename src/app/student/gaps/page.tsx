import Link from "next/link";
import { AlertTriangle, ArrowRight, Info, Target } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge, EmptyState, ProgressBar, statusBadgeColor } from "@/components/ui/ui";
import { GapBars } from "@/components/charts";
import { criticalGaps } from "@/engines/gap";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; blurb: string }> = {
  STRONG: { label: "Strong", blurb: "You're at or above the requirement. Keep it sharp with light weekly practice." },
  IMPROVE: { label: "Improve", blurb: "A small gap. One focused week plus a quick assessment should close it." },
  MAJOR_GAP: { label: "Major Gap", blurb: "A meaningful shortfall. A 2–3 week focused push will move the needle." },
  CRITICAL_GAP: { label: "Critical Gap", blurb: "This is blocking your candidacy. Highest priority — start here." }
};

export default async function GapsPage() {
  const session = await requireRole("STUDENT");
  const [profile, gaps] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true } }),
    prisma.skillGap.findMany({ where: { userId: session.id }, include: { skill: true, role: true }, orderBy: [{ priority: "desc" }, { gap: "desc" }] })
  ]);

  const roleSkills = profile?.targetRoleId ? await prisma.roleSkill.findMany({ where: { roleId: profile.targetRoleId } }) : [];
  const requirementMap = new Map(roleSkills.map((rs) => [rs.skillId, rs.requirement]));

  const critical = criticalGaps(gaps);
  const chartData = gaps.slice(0, 8).map((g) => ({
    skill: g.skill.name,
    current: g.currentScore,
    required: g.requiredScore,
    status: g.status
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Skill-Gap Analysis</h1>
          <p className="mt-1 text-sm text-ink-500">
            Your skills vs. {profile?.targetRole?.name ?? "your target role"} requirements, prioritized by placement impact.
          </p>
        </div>
        {!profile?.targetRole && (
          <Link href="/student/profile" className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700">
            Select a target role
          </Link>
        )}
      </div>

      {gaps.length === 0 ? (
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title="No gap analysis yet"
          description={profile?.targetRole ? "All requirements are met — great work. Re-check after your next assessment." : "Select a target role to compare your skills against real role requirements."}
          action={!profile?.targetRole ? <Link href="/student/profile" className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white">Choose role</Link> : undefined}
        />
      ) : (
        <>
          {critical.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-display text-[15px] font-bold">
                  {critical.length} critical gap{critical.length > 1 ? "s" : ""} need your attention
                </h2>
              </div>
              <p className="mt-1 text-[13px] text-rose-600">
                {critical.map((g) => g.skill.name).join(", ")} — {critical.length === 1 ? "this is" : "these are"} the highest-leverage areas to fix first for {profile?.targetRole?.name ?? "your role"}.
              </p>
            </div>
          )}

          <Card className="p-5">
            <h2 className="text-[15px] font-bold text-ink-900">Gap overview</h2>
            <div className="mt-3"><GapBars data={chartData} /></div>
          </Card>

          <div className="space-y-3">
            {gaps.map((g) => {
              const meta = STATUS_META[g.status] ?? STATUS_META.IMPROVE;
              return (
                <Card key={g.id} className={`p-5 ${g.status === "CRITICAL_GAP" ? "border-rose-300 ring-1 ring-rose-100" : g.status === "MAJOR_GAP" ? "border-amber-200" : ""}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-bold text-ink-900">{g.skill.name}</h3>
                        <Badge color={statusBadgeColor(g.status)}>{meta.label}</Badge>
                        <span className="text-[11px] text-ink-400">Priority {g.priority}/10 · {requirementMap.get(g.skillId) === "REQUIRED" ? "Required" : "Preferred"}</span>
                      </div>
                      <div className="mt-3 max-w-md">
                        <div className="mb-1 flex justify-between text-xs text-ink-500">
                          <span>You: <b className="text-ink-800">{g.currentScore}%</b></span>
                          <span>Needed: <b className="text-ink-800">{g.requiredScore}%</b></span>
                        </div>
                        <ProgressBar
                          value={(g.currentScore / Math.max(1, g.requiredScore)) * 100}
                          color={g.status === "CRITICAL_GAP" ? "rose" : g.status === "MAJOR_GAP" ? "amber" : g.status === "IMPROVE" ? "sky" : "emerald"}
                        />
                      </div>
                    </div>
                    <div className="sm:w-64">
                      <div className="rounded-xl bg-ink-50 p-3.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
                          <Info className="h-3.5 w-3.5" /> Why improve this?
                        </p>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-600">{g.impact}</p>
                      </div>
                    </div>
                  </div>
                  {g.status !== "STRONG" && (
                    <Link href="/student/roadmap" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                      See it in my roadmap <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
