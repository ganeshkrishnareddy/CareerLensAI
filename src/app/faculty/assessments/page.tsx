import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, CardHeader, PageHeader, ProgressBar, statusBadgeColor } from "@/components/ui/ui";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  TECHNICAL: "Technical",
  CODING: "Coding",
  APTITUDE: "Aptitude",
  COMMUNICATION: "Communication",
  INTERVIEW: "Interview",
  ROLE: "Role-specific"
};

export default async function FacultyAssessmentsPage() {
  await requireRole("FACULTY", "ADMIN");

  const assessments = await prisma.assessment.findMany({
    where: { isActive: true },
    include: {
      skill: true,
      attempts: {
        where: { status: "SUBMITTED" },
        select: { score: true }
      }
    },
    orderBy: { title: "asc" }
  });

  const stats = assessments.map((a) => {
    const scores = a.attempts.map((t) => t.score).filter((s): s is number => s !== null);
    const avg = scores.length ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 10) / 10 : null;
    const passed = scores.filter((s) => s >= (a.passScore ?? 50)).length;
    return {
      id: a.id,
      title: a.title,
      type: a.type,
      skill: a.skill?.name ?? null,
      difficulty: a.difficulty,
      attempts: scores.length,
      average: avg,
      passRate: scores.length ? Math.round((passed / scores.length) * 100) : null
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assessment performance" subtitle="Batch-wide participation, averages and pass rates per assessment." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Active assessments</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-ink-900">{assessments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Total attempts</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-ink-900">{stats.reduce((a, s) => a + s.attempts, 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Avg pass rate</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-ink-900">
            {stats.length && stats.some((s) => s.passRate !== null) ? `${Math.round(stats.filter((s) => s.passRate !== null).reduce((a, s) => a + (s.passRate ?? 0), 0) / stats.filter((s) => s.passRate !== null).length)}%` : "—"}
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Assessment list" />
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="rounded-l-lg px-4 py-2.5 font-semibold">Assessment</th>
                <th className="px-4 py-2.5 font-semibold">Type</th>
                <th className="px-4 py-2.5 font-semibold">Skill</th>
                <th className="px-4 py-2.5 font-semibold">Attempts</th>
                <th className="px-4 py-2.5 font-semibold">Average score</th>
                <th className="rounded-r-lg px-4 py-2.5 font-semibold">Pass rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.id} className="border-b border-ink-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{s.title}</p>
                    <p className="text-[11px] text-ink-400">Difficulty: {s.difficulty.replace(/_/g, " ").toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3"><Badge color="violet">{TYPE_LABELS[s.type] ?? s.type}</Badge></td>
                  <td className="px-4 py-3 text-ink-600">{s.skill ?? "General"}</td>
                  <td className="px-4 py-3 text-ink-600">{s.attempts}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20"><ProgressBar value={s.average ?? 0} color={s.average !== null && s.average >= 75 ? "emerald" : s.average !== null && s.average >= 50 ? "brand" : "rose"} /></div>
                      <span className="text-xs font-bold text-ink-700">{s.average !== null ? `${s.average}%` : "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.passRate !== null ? (
                      <Badge color={statusBadgeColor(s.passRate >= 75 ? "PASSED" : s.passRate >= 50 ? "SUBMITTED" : "FAILED")}>{s.passRate}%</Badge>
                    ) : (
                      <span className="text-xs text-ink-400">No attempts</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
