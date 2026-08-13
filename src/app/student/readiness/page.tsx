import Link from "next/link";
import { ArrowRight, TrendingUp, Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, ScoreRing, ProgressBar, EmptyState, Badge, statusBadgeColor } from "@/components/ui/ui";
import { ReadinessTrend } from "@/components/charts";
import { COMPONENT_LABELS } from "@/engines/readiness";

export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const session = await requireRole("STUDENT");
  const [snapshots, profile] = await Promise.all([
    prisma.readinessSnapshot.findMany({ where: { userId: session.id }, orderBy: { createdAt: "asc" }, take: 30 }),
    prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true } })
  ]);

  const latest = snapshots[snapshots.length - 1];
  const first = snapshots[0];
  const improvement = latest && first ? latest.overall - first.overall : 0;
  const trend = snapshots.map((s) => ({
    date: s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    overall: s.overall
  }));

  const components: { key: keyof typeof COMPONENT_LABELS; value: number }[] = latest
    ? [
        { key: "technical", value: latest.technical },
        { key: "coding", value: latest.coding },
        { key: "aptitude", value: latest.aptitude },
        { key: "communication", value: latest.communication },
        { key: "interview", value: latest.interview },
        { key: "projects", value: latest.projects },
        { key: "resume", value: latest.resume }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Placement Readiness</h1>
          <p className="mt-1 text-sm text-ink-500">A single score from seven components — recalculated after every assessment cycle.</p>
        </div>
        {latest && (
          <div className={`inline-flex items-center gap-2 self-start rounded-xl px-4 py-2 text-sm font-semibold ${improvement >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            <TrendingUp className="h-4 w-4" />
            {improvement >= 0 ? "+" : ""}{improvement} points since your first snapshot
          </div>
        )}
      </div>

      {!latest ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No readiness score yet"
          description="Complete your profile, add skills and take an assessment — then your readiness is computed automatically."
          action={<Link href="/student/assessments" className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white">Take an assessment</Link>}
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center p-6">
              <ScoreRing value={latest.overall} size={170} stroke={14} />
              <p className="mt-3 text-sm font-semibold text-ink-700">
                {latest.overall >= 75 ? "Placement Ready" : latest.overall >= 60 ? "Close to Ready" : latest.overall >= 40 ? "Developing" : "Needs Focus"}
              </p>
              <p className="mt-1 text-center text-xs text-ink-400">
                {profile?.targetRole ? `Assessed for your target role` : "Target role not selected"}
              </p>
              <Link href="/student/gaps" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700">
                Improve it <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <CardHeader title="Component breakdown" subtitle="Weights are configured by your institution" />
              <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {components.map((c) => (
                  <div key={c.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-700">{COMPONENT_LABELS[c.key]}</span>
                      <Badge color={statusBadgeColor(c.value >= 75 ? "STRONG" : c.value >= 50 ? "IMPROVE" : "MAJOR_GAP")}>{c.value}%</Badge>
                    </div>
                    <ProgressBar value={c.value} color={c.value >= 75 ? "emerald" : c.value >= 50 ? "brand" : "rose"} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <CardHeader title="Readiness over time" subtitle="Every analysis saves a snapshot — watch the loop move your score" />
            <div className="mt-4">
              {trend.length > 1 ? <ReadinessTrend data={trend} /> : <p className="py-8 text-center text-sm text-ink-400">Take another assessment to see your trend line grow.</p>}
            </div>
          </Card>

          {snapshots.length > 1 && (
            <Card className="overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Overall</th>
                    {(["technical", "coding", "aptitude", "communication", "interview"] as const).map((k) => (
                      <th key={k} className="hidden px-3 py-3 font-semibold sm:table-cell">{COMPONENT_LABELS[k]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...snapshots].reverse().slice(0, 12).map((s) => (
                    <tr key={s.id} className="border-t border-ink-100">
                      <td className="px-5 py-3 text-ink-500">{s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-5 py-3 font-bold text-ink-900">{s.overall}%</td>
                      {(["technical", "coding", "aptitude", "communication", "interview"] as const).map((k) => (
                        <td key={k} className="hidden px-3 py-3 text-ink-600 sm:table-cell">{s[k]}%</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
