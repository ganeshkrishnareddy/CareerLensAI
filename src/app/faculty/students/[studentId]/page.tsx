import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Target } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getFacultyStudentDetail } from "@/services/faculty-service";
import { Badge, Card, CardHeader, PageHeader, ProgressBar, ScoreRing, statusBadgeColor } from "@/components/ui/ui";
import { formatDate } from "@/lib/utils";
import { ReadinessTrend } from "@/components/charts";
import { NotesClient } from "./notes-client";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InterventionPage({ params }: { params: Promise<{ studentId: string }> }) {
  const session = await requireRole("FACULTY", "ADMIN");
  const { studentId } = await params;
  const data = await getFacultyStudentDetail(session.id, studentId);
  if (!data) notFound();

  const { profile, skills, gaps, attempts, latest, trend, improvement, roadmap, notes, projects, certifications } = data;

  const strengths = skills.filter((s) => s.score >= 70).slice(0, 6);
  const weaknesses = skills.filter((s) => s.score < 50).slice(0, 6);

  return (
    <div className="space-y-6">
      <Link href="/faculty/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <PageHeader
        title={profile.user.name}
        subtitle={`${profile.user.email} · ${profile.college ?? "—"}${profile.batch ? ` · ${profile.batch.name}` : ""}`}
        action={
          <Link href={`/student/reports`} className="hidden">
            <FileText className="h-4 w-4" /> Report
          </Link>
        }
      />

      {/* Readiness summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-5 p-5 lg:col-span-1">
          <ScoreRing value={latest?.overall ?? 0} size={110} stroke={11} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Placement readiness</p>
            <p className="mt-1 text-sm font-semibold text-ink-800">{profile.targetRole?.name ?? "No target role"}</p>
            <p className={`mt-1 text-xs font-bold ${improvement >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {improvement >= 0 ? "+" : ""}{improvement} pts overall trend
            </p>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {([
              ["Technical", latest?.technical ?? 0],
              ["Coding", latest?.coding ?? 0],
              ["Aptitude", latest?.aptitude ?? 0],
              ["Communication", latest?.communication ?? 0],
              ["Interview", latest?.interview ?? 0],
              ["Projects", latest?.projects ?? 0]
            ] as [string, number][]).map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-[11px]">
                  <span className="font-medium text-ink-600">{label}</span>
                  <span className="font-bold text-ink-800">{value}%</span>
                </div>
                <ProgressBar value={value} color={value >= 75 ? "emerald" : value >= 50 ? "brand" : "rose"} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill gaps */}
        <Card>
          <CardHeader title="Skill gaps" subtitle="Priority-ordered gaps vs target role" />
          <div className="space-y-2.5 p-5">
            {gaps.length === 0 && <p className="text-sm text-ink-400">No gaps recorded. Set a target role first.</p>}
            {gaps.slice(0, 8).map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{g.skill.name}</p>
                  <p className="text-xs text-ink-400">P{g.priority} · {g.currentScore}% → {g.requiredScore}% required</p>
                </div>
                <Badge color={statusBadgeColor(g.status)}>{g.status.replace(/_/g, " ")}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Strengths & weaknesses */}
        <Card>
          <CardHeader title="Strengths & weaknesses" />
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-600">Strengths (≥ 70%)</p>
              <div className="flex flex-wrap gap-2">
                {strengths.map((s) => (
                  <span key={s.skillId} className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">{s.skill.name} · {s.score}%</span>
                ))}
                {strengths.length === 0 && <p className="text-xs text-ink-400">None yet.</p>}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-600">Weaknesses (&lt; 50%)</p>
              <div className="flex flex-wrap gap-2">
                {weaknesses.map((s) => (
                  <span key={s.skillId} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">{s.skill.name} · {s.score}%</span>
                ))}
                {weaknesses.length === 0 && <p className="text-xs text-ink-400">None — great job!</p>}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">Projects & certifications</p>
              <p className="text-xs text-ink-600">{projects.length} project{projects.length === 1 ? "" : "s"} · {certifications.length} certification{certifications.length === 1 ? "" : "s"}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assessment history */}
        <Card>
          <CardHeader title="Assessment history" subtitle="Recent attempts" />
          <div className="space-y-2.5 p-5">
            {attempts.length === 0 && <p className="text-sm text-ink-400">No assessments taken yet.</p>}
            {attempts.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-2.5">
                <div>
                  <p className="text-[13px] font-medium text-ink-800">{a.assessment.title}</p>
                  <p className="text-[11px] text-ink-400">{formatDate(a.submittedAt)}</p>
                </div>
                <span className={`font-display text-base font-bold ${(a.score ?? 0) >= (a.assessment.passScore ?? 50) ? "text-emerald-600" : "text-rose-500"}`}>
                  {a.score}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader title="Roadmap progress" />
          <div className="p-5">
            {roadmap ? (
              <>
                <ProgressBar value={roadmap.progress} color="violet" showLabel />
                <p className="mt-2 text-xs text-ink-500">
                  {roadmap.title} · {roadmap.items.filter((i) => i.status === "COMPLETED").length}/{roadmap.items.length} tasks
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {roadmap.items.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-xl border border-ink-200 p-3">
                      <p className="text-xs font-semibold text-ink-800">Week {item.week} · {item.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-400">{item.status.replace(/_/g, " ")}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-400">No roadmap generated yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader title="Readiness trend" subtitle="Snapshots over time" />
        <div className="p-5">
          {trend.length > 1 ? <ReadinessTrend data={trend} height={220} /> : <p className="py-8 text-center text-sm text-ink-400">Not enough snapshots yet to plot a trend.</p>}
        </div>
      </Card>

      {/* Notes */}
      <NotesClient studentId={studentId} initialNotes={notes.map((n) => ({ id: n.id, note: n.content, facultyName: n.faculty.name, createdAt: formatDate(n.createdAt) }))} />

      {/* Recommended intervention */}
      <Card className="border-l-4 border-l-brand-500 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600"><Target className="h-5 w-5" /></div>
          <div>
            <h3 className="text-[15px] font-bold text-ink-900">Recommended intervention</h3>
            {gaps.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-ink-600">
                <li>
                  Highest priority: <b>{gaps[0].skill.name}</b> (P{gaps[0].priority} — {gaps[0].status.replace(/_/g, " ").toLowerCase()}).
                </li>
                <li>Assign {gaps[0].skill.name} practice tasks and a follow-up assessment within 2 weeks.</li>
                {attempts.length === 0 && <li>Student has not taken any assessment — recommend starting with a diagnostic.</li>}
                {roadmap && roadmap.progress < 50 && <li>Roadmap completion is {roadmap.progress}% — nudge task completion.</li>}
                {latest && latest.overall < 50 && <li>Student is at risk — schedule a 1:1 review.</li>}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-ink-500">Set a target role for this student to generate gap-based interventions.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
