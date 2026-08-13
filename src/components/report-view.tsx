import { PrintButton } from "@/components/print-button";
import { Badge, Card, ProgressBar, ScoreRing, statusBadgeColor } from "@/components/ui/ui";
import { formatDate, safeJsonParse } from "@/lib/utils";
import { COMPONENT_LABELS } from "@/engines/readiness";
import { ReadinessTrend } from "@/components/charts";
import type { buildStudentReport } from "@/services/report-service";

type Report = Awaited<ReturnType<typeof buildStudentReport>>;

export function ReportView({ report, title = "Placement Readiness Report" }: { report: Report; title?: string }) {
  const components: { key: keyof typeof COMPONENT_LABELS; value: number }[] = [
    { key: "technical", value: report.readiness.technical },
    { key: "coding", value: report.readiness.coding },
    { key: "aptitude", value: report.readiness.aptitude },
    { key: "communication", value: report.readiness.communication },
    { key: "interview", value: report.readiness.interview },
    { key: "projects", value: report.readiness.projects },
    { key: "resume", value: report.readiness.resume }
  ];
  const trend = report.snapshots.map((s) => ({
    date: s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    overall: s.overall
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-ink-500">A complete snapshot of profile, gaps and progress. Use the Download button to export as PDF.</p>
        </div>
        <PrintButton />
      </div>

      <Card className="p-6 print-block">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">CareerLens AI · Placement Readiness Report</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink-900">{report.user?.name}</h2>
            <p className="mt-1 text-sm text-ink-500">
              {report.profile?.college ?? "—"}
              {report.profile?.graduationYear ? ` · Class of ${report.profile.graduationYear}` : ""}
            </p>
            <p className="mt-0.5 text-sm text-ink-500">
              Target role: <b className="text-ink-800">{report.profile?.targetRole?.name ?? "Not selected"}</b>
              {report.profile?.cgpa ? ` · CGPA ${report.profile.cgpa}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">Generated {formatDate(new Date())} · {report.snapshots.length} readiness snapshot{report.snapshots.length === 1 ? "" : "s"}</p>
          </div>
          <div className="text-center">
            <ScoreRing value={report.readiness.overall} size={140} stroke={12} />
            <p className="mt-2 text-sm font-semibold text-ink-700">Placement Readiness</p>
            <p className="text-[11px] text-ink-400">
              {report.improvement >= 0 ? "+" : ""}{report.improvement} pts overall trend
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[15px] font-bold text-ink-900">Skill breakdown</h3>
        <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {components.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-ink-700">{COMPONENT_LABELS[c.key]}</span>
                <span className="font-bold text-ink-800">{c.value}%</span>
              </div>
              <ProgressBar value={c.value} color={c.value >= 75 ? "emerald" : c.value >= 50 ? "brand" : "rose"} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-[15px] font-bold text-ink-900">Skill gaps vs. {report.profile?.targetRole?.name ?? "target role"}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="rounded-l-lg px-4 py-2.5 font-semibold">Skill</th>
                <th className="px-4 py-2.5 font-semibold">Current</th>
                <th className="px-4 py-2.5 font-semibold">Required</th>
                <th className="px-4 py-2.5 font-semibold">Gap</th>
                <th className="rounded-r-lg px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.gaps.map((g) => (
                <tr key={g.id} className="border-b border-ink-100">
                  <td className="px-4 py-2.5 font-medium text-ink-800">{g.skill.name}</td>
                  <td className="px-4 py-2.5 text-ink-600">{g.currentScore}%</td>
                  <td className="px-4 py-2.5 text-ink-600">{g.requiredScore}%</td>
                  <td className={`px-4 py-2.5 font-semibold ${g.gap > 0 ? "text-rose-600" : "text-emerald-600"}`}>{g.gap > 0 ? `${g.gap}%` : "—"}</td>
                  <td className="px-4 py-2.5"><Badge color={statusBadgeColor(g.status)}>{g.status.replace(/_/g, " ")}</Badge></td>
                </tr>
              ))}
              {report.gaps.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-400">No gaps recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 print-block">
        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-ink-900">Assessment performance</h3>
          <div className="mt-4 space-y-3">
            {report.attempts.length === 0 && <p className="text-sm text-ink-400">No assessments taken yet.</p>}
            {report.attempts.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3.5 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-ink-800">{a.assessment.title}</p>
                  <p className="text-[11px] text-ink-400">{formatDate(a.submittedAt)}</p>
                </div>
                <span className={`font-display text-lg font-bold ${(a.score ?? 0) >= (a.assessment.passScore ?? 50) ? "text-emerald-600" : "text-rose-500"}`}>{a.score}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-ink-900">Roadmap progress</h3>
          {report.roadmap ? (
            <>
              <div className="mt-4">
                <ProgressBar value={report.roadmap.progress} color="violet" showLabel />
                <p className="mt-2 text-xs text-ink-500">
                  {report.roadmap.title} · {report.roadmap.items.filter((i) => i.status === "COMPLETED").length}/{report.roadmap.items.length} tasks done
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from(new Set(report.roadmap.items.map((i) => i.week))).map((w) => (
                  <span key={w} className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${report.roadmap!.items.filter((i) => i.week === w && i.status === "COMPLETED").length === report.roadmap!.items.filter((i) => i.week === w).length ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>
                    Week {w}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink-400">No roadmap generated yet.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 print-block print-page-break">
        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-ink-900">Improvement trend</h3>
          <div className="mt-3">
            {trend.length > 1 ? <ReadinessTrend data={trend} height={220} /> : <p className="py-8 text-center text-sm text-ink-400">Take more assessments to build your trend.</p>}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-[15px] font-bold text-ink-900">Role matches</h3>
          <div className="mt-4 space-y-3">
            {report.roleMatches.slice(0, 6).map((m) => (
              <div key={m.roleId} className="flex items-center justify-between rounded-lg bg-ink-50 px-3.5 py-2.5">
                <p className="text-[13px] font-medium text-ink-800">{m.role.name}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-ink-400">Missing: {safeJsonParse<{ name: string }[]>(m.missingSkills, []).slice(0, 2).map((x) => x.name).join(", ") || "none"}</span>
                  <span className="font-display text-lg font-bold text-brand-600">{m.fitScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-[15px] font-bold text-ink-900">Strengths</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {report.skills.filter((s) => s.score >= 70).slice(0, 8).map((s) => (
            <span key={s.id} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {s.skill.name} · {s.score}%
            </span>
          ))}
          {report.skills.filter((s) => s.score >= 70).length === 0 && <p className="text-sm text-ink-400">Improve a few skills to surface strengths here.</p>}
        </div>
      </Card>
    </div>
  );
}
