import Link from "next/link";
import { Users, CheckCircle2, AlertTriangle, ClipboardList, BookOpen, Target, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFacultyAnalytics, getFacultyScope } from "@/services/faculty-service";
import { Badge, Card, CardHeader, PageHeader, StatCard, statusBadgeColor } from "@/components/ui/ui";
import { SimpleBars, ReadinessTrend } from "@/components/charts";
import { COMPONENT_LABELS } from "@/engines/readiness";

export const dynamic = "force-dynamic";

export default async function FacultyDashboard() {
  const session = await requireRole("FACULTY", "ADMIN");
  const scope = await getFacultyScope(session.id);
  const [analytics, departments, batches, roles] = await Promise.all([
    getFacultyAnalytics(session.id),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.batch.findMany({ orderBy: { year: "desc" } }),
    prisma.role.findMany({ where: { isActive: true, isCustom: false }, orderBy: { name: "asc" } })
  ]);

  const avgScores = Object.entries(analytics.averageScores).map(([key, value]) => ({
    label: COMPONENT_LABELS[key as keyof typeof COMPONENT_LABELS] ?? key,
    value: value ?? 0
  }));

  const trend = analytics.recentImprovements.length
    ? analytics.recentImprovements.map((r) => ({ date: r.name.split(" ")[0], overall: r.to }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Analytics"
        subtitle="Track placement readiness, common gaps and interventions across your batch."
        action={
          <Link href="/faculty/students" className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800">
            <Users className="h-4 w-4" /> View students
          </Link>
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students in scope" value={analytics.totalStudents} icon={<Users className="h-5 w-5" />} accent="brand" sub="across your batch & department" />
        <StatCard
          label="Average readiness"
          value={analytics.averageReadiness !== null ? `${analytics.averageReadiness}%` : "—"}
          icon={<TrendingUp className="h-5 w-5" />}
          accent={analytics.averageReadiness !== null && analytics.averageReadiness >= 65 ? "emerald" : analytics.averageReadiness !== null && analytics.averageReadiness >= 45 ? "amber" : "rose"}
          sub="batch average"
        />
        <StatCard label="Placement ready" value={analytics.placementReady} icon={<CheckCircle2 className="h-5 w-5" />} accent="emerald" sub="readiness ≥ 75%" />
        <StatCard label="At risk" value={analytics.atRisk} icon={<AlertTriangle className="h-5 w-5" />} accent="rose" sub="readiness < 50%" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Assessment participation" value={analytics.assessmentParticipation !== null ? `${analytics.assessmentParticipation}%` : "—"} icon={<ClipboardList className="h-5 w-5" />} accent="sky" sub="students who attempted ≥ 1 assessment" />
        <StatCard label="Roadmap completion" value={analytics.roadmapCompletion !== null ? `${analytics.roadmapCompletion}%` : "—"} icon={<BookOpen className="h-5 w-5" />} accent="violet" sub="avg across active roadmaps" />
        <StatCard label="Common critical gaps" value={analytics.commonGaps.filter((g) => g.status === "CRITICAL").length} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" sub="skills with critical gaps" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Average scores */}
        <Card>
          <CardHeader title="Average component scores" subtitle="Batch average across readiness components" />
          <div className="p-5">
            <SimpleBars data={avgScores} height={280} />
          </div>
        </Card>

        {/* Common gaps */}
        <Card>
          <CardHeader title="Most common skill gaps" subtitle="Skills flagged critical or major across the batch" />
          <div className="space-y-3 p-5">
            {analytics.commonGaps.length === 0 && <p className="text-sm text-ink-400">No critical or major gaps detected across the batch. Great job!</p>}
            {analytics.commonGaps.map((g) => (
              <div key={g.skillId} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{g.name}</p>
                  <p className="text-xs text-ink-400">{g.count} student{g.count === 1 ? "" : "s"} need intervention</p>
                </div>
                <Badge color={statusBadgeColor(g.status === "CRITICAL" ? "CRITICAL_GAP" : "MAJOR_GAP")}>
                  {g.status === "CRITICAL" ? "Critical" : "Major"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role-wise readiness */}
        <Card>
          <CardHeader title="Role-wise readiness" subtitle="Average readiness by target role" />
          <div className="space-y-3 p-5">
            {analytics.roleWise.map((r) => (
              <div key={r.roleId ?? "none"} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-ink-400" />
                  <p className="text-sm font-medium text-ink-800">{r.name}</p>
                  <span className="text-xs text-ink-400">({r.count})</span>
                </div>
                <span className={`font-display text-lg font-bold ${(r.averageReadiness ?? 0) >= 65 ? "text-emerald-600" : (r.averageReadiness ?? 0) >= 45 ? "text-amber-600" : "text-rose-500"}`}>
                  {r.averageReadiness !== null ? `${r.averageReadiness}%` : "—"}
                </span>
              </div>
            ))}
            {analytics.roleWise.length === 0 && <p className="text-sm text-ink-400">No students with target roles yet.</p>}
          </div>
        </Card>

        {/* Most improved */}
        <Card>
          <CardHeader title="Most improved students" subtitle="Students with the largest readiness gains" />
          <div className="space-y-3 p-5">
            {analytics.recentImprovements.length === 0 && <p className="text-sm text-ink-400">No improvement data yet — readiness snapshots accumulate as students take assessments.</p>}
            {analytics.recentImprovements.map((r) => (
              <div key={r.userId} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <Link href={`/faculty/students/${r.userId}`} className="text-sm font-semibold text-ink-800 hover:text-brand-600">
                  {r.name}
                </Link>
                <div className="text-right">
                  <p className="text-xs text-ink-400">{r.from}% → {r.to}%</p>
                  <p className="text-sm font-bold text-emerald-600">+{r.delta} pts</p>
                </div>
              </div>
            ))}
            {trend.length > 0 && (
              <div className="mt-4">
                <ReadinessTrend data={trend} height={120} />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Department-wise */}
      <Card>
        <CardHeader title="Department-wise readiness" subtitle="Breakdown across departments" />
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="rounded-l-lg px-4 py-2.5 font-semibold">Department</th>
                <th className="px-4 py-2.5 font-semibold">Students</th>
                <th className="rounded-r-lg px-4 py-2.5 font-semibold">Average readiness</th>
              </tr>
            </thead>
            <tbody>
              {analytics.departmentWise.map((d) => (
                <tr key={d.departmentId ?? "none"} className="border-b border-ink-100">
                  <td className="px-4 py-3 font-medium text-ink-800">{d.name}</td>
                  <td className="px-4 py-3 text-ink-600">{d.count}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${(d.averageReadiness ?? 0) >= 65 ? "text-emerald-600" : (d.averageReadiness ?? 0) >= 45 ? "text-amber-600" : "text-rose-500"}`}>
                      {d.averageReadiness !== null ? `${d.averageReadiness}%` : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-ink-400">
        Scope: {scope.institutionId ? "your institution" : "all institutions"}
        {scope.departmentId ? " · your department" : ""}
        {scope.batchId ? " · your batch" : ""}
      </p>
    </div>
  );
}
