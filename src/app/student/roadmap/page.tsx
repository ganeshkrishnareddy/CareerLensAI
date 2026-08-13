import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, Clock, ExternalLink, Flag, Play, SkipForward, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge, Card, EmptyState, ProgressBar, statusBadgeColor } from "@/components/ui/ui";
import { formatDate } from "@/lib/utils";
import { ItemActions, GenerateRoadmapButton, CompleteWeekButton } from "./client";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const session = await requireRole("STUDENT");
  const [roadmap, profile] = await Promise.all([
    prisma.roadmap.findFirst({
      where: { userId: session.id, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: {
        items: { include: { skill: true, assessment: true }, orderBy: [{ week: "asc" }, { order: "asc" }] },
        role: true
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true } })
  ]);

  if (!roadmap) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Personalized Roadmap</h1>
          <p className="mt-1 text-sm text-ink-500">A week-by-week plan generated from your real skill gaps.</p>
        </div>
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No roadmap yet"
          description={profile?.targetRole
            ? "Generate your personalized weekly plan — built from your current gaps for your target role."
            : "Select a target role first so we know what to prepare you for."}
          action={profile?.targetRole ? <GenerateRoadmapButton /> : <Link href="/student/profile" className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white">Choose target role</Link>}
        />
      </div>
    );
  }

  const weeks = Array.from(new Set(roadmap.items.map((i) => i.week))).sort((a, b) => a - b);
  const completed = roadmap.items.filter((i) => i.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{roadmap.title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {completed}/{roadmap.items.length} tasks done · generated from your real gaps
            {roadmap.role ? <> · for <b>{roadmap.role.name}</b></> : null}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <ProgressBar value={roadmap.progress} color="violet" showLabel />
        </div>
      </div>

      {roadmap.progress === 100 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
          <p className="font-display text-[15px] font-bold">Roadmap complete! 🎉</p>
          <p className="mt-1 text-[13px]">Re-assess now to lock in your new readiness score, then explore role matching for your next step.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/student/assessments" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">Take an assessment</Link>
            <Link href="/student/roles" className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-700">Role matching</Link>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {weeks.map((week) => {
          const items = roadmap.items.filter((i) => i.week === week);
          const weekDone = items.filter((i) => i.status === "COMPLETED").length;
          const weekPending = items.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS");
          return (
            <div key={week}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 font-display text-sm font-bold text-white">
                    {week}
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold text-ink-900">Week {week}</h2>
                    <p className="text-[11px] text-ink-400">{weekDone}/{items.length} done</p>
                  </div>
                </div>
                <ProgressBar value={(weekDone / items.length) * 100} className="w-24" color="violet" />
              </div>
              <div className="space-y-3">
                {items.map((item) => {
                  const tasks = (item.tasks as string[]) ?? [];
                  const statusColor = item.status === "COMPLETED" ? "border-emerald-300 bg-emerald-50/50" : item.status === "IN_PROGRESS" ? "border-brand-300 bg-brand-50/40" : item.status === "SKIPPED" ? "border-ink-200 bg-ink-50/50 opacity-70" : "border-ink-200";
                  return (
                    <Card key={item.id} className={`p-5 ${statusColor}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[14px] font-bold text-ink-900">{item.title}</h3>
                            <Badge color={statusBadgeColor(item.status)}>
                              {item.status === "COMPLETED" ? "Done" : item.status === "IN_PROGRESS" ? "In progress" : item.status === "SKIPPED" ? "Skipped" : "Pending"}
                            </Badge>
                            {item.difficulty && <Badge color="slate">{item.difficulty}</Badge>}
                          </div>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{item.objective}</p>
                          {tasks.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {tasks.map((t, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12px] text-ink-500">
                                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                                  {t}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-400">
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{item.estimatedMinutes} min</span>
                            {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
                            {item.skill && <span className="rounded-md bg-ink-100 px-1.5 py-0.5 font-medium text-ink-500">{item.skill.name}</span>}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {item.resourceUrl && (
                            <a href={item.resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50">
                              <ExternalLink className="h-3.5 w-3.5" /> {item.resourceTitle ?? "Resource"}
                            </a>
                          )}
                          {item.assessmentId && (
                            <Link href={`/student/assessments/take/${item.assessmentId}`} className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                              <Flag className="h-3.5 w-3.5" /> Assessment
                            </Link>
                          )}
                          <ItemActions itemId={item.id} status={item.status} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              {weekPending.length > 0 && (
                <div className="mt-3 text-right">
                  <CompleteWeekButton week={week} count={weekPending.length} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
