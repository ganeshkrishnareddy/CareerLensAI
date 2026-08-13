import Link from "next/link";
import {
  ArrowRight, Target, AlertTriangle, BookOpen, ClipboardList, Sparkles,
  TrendingUp, Trophy, MessageSquareText, ChevronRight, Activity, Layers
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, Badge, ProgressBar, ScoreRing, EmptyState, statusBadgeColor } from "@/components/ui/ui";
import { ReadinessTrend, SkillRadar } from "@/components/charts";
import { timeAgo, safeJsonParse } from "@/lib/utils";
import { criticalGaps } from "@/engines/gap";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT");

  const [profile, gaps, snapshot, matches, roadmap, attempts, progress, conversations, skills] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true } }),
    prisma.skillGap.findMany({ where: { userId: session.id }, include: { skill: true, role: true }, orderBy: { priority: "desc" } }),
    prisma.readinessSnapshot.findFirst({ where: { userId: session.id }, orderBy: { createdAt: "desc" } }),
    prisma.roleMatch.findMany({ where: { userId: session.id }, include: { role: true }, orderBy: { fitScore: "desc" }, take: 3 }),
    prisma.roadmap.findFirst({ where: { userId: session.id, status: { in: ["ACTIVE", "COMPLETED"] } }, include: { items: true }, orderBy: { updatedAt: "desc" } }),
    prisma.assessmentAttempt.findMany({ where: { userId: session.id, status: "SUBMITTED" }, include: { assessment: true }, orderBy: { submittedAt: "desc" }, take: 5 }),
    prisma.progress.findMany({ where: { userId: session.id }, orderBy: { recordedAt: "desc" }, take: 6 }),
    prisma.aiConversation.count({ where: { userId: session.id } }),
    prisma.studentSkill.findMany({ where: { userId: session.id }, include: { skill: true } })
  ]);

  const targetRoleSkills = profile?.targetRoleId ? await prisma.roleSkill.findMany({ where: { roleId: profile.targetRoleId } }) : [];
  const requiredSet = new Set(targetRoleSkills.filter((r) => r.requirement === "REQUIRED").map((r) => r.skillId));

  const critical = criticalGaps(gaps);
  const radarData = gaps
    .filter((g) => requiredSet.has(g.skillId))
    .slice(0, 6)
    .map((g) => ({ skill: g.skill.name, score: g.currentScore, required: g.requiredScore }));

  const completedItems = roadmap?.items.filter((i) => i.status === "COMPLETED").length ?? 0;

  const firstName = session.name.split(" ")[0];
  const readiness = snapshot?.overall ?? 0;

  // Determine the single most valuable next action
  const nextAction = critical[0]
    ? {
        title: `Close your critical ${critical[0].skill.name} gap`,
        detail: `${critical[0].currentScore}% → ${critical[0].requiredScore}% needed. Your roadmap has a focused plan ready.`,
        href: roadmap ? "/student/roadmap" : "/student/gaps",
        cta: roadmap ? "Open roadmap" : "View gaps"
      }
    : gaps.find((g) => g.status === "MAJOR_GAP")
      ? {
          title: `Work on ${gaps.find((g) => g.status === "MAJOR_GAP")!.skill.name}`,
          detail: `A focused push will move you closer to placement-ready for ${profile?.targetRole?.name ?? "your role"}.`,
          href: "/student/roadmap",
          cta: "Start this week"
        }
      : {
          title: "Re-assess to raise your score",
          detail: "Take a timed assessment — every result updates your readiness automatically.",
          href: "/student/assessments",
          cta: "Take an assessment"
        };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Welcome back, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-white/80">
            {profile?.targetRole
              ? `Preparing for ${profile.targetRole.name}${profile?.graduationYear ? ` · Class of ${profile.graduationYear}` : ""}.`
              : "Select a target role to unlock your skill-gap analysis."}
          </p>
        </div>
        <Link
          href={nextAction.href}
          className="group inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-lg transition hover:bg-ink-50 sm:self-auto"
        >
          <Sparkles className="h-4 w-4 text-brand-600" />
          {nextAction.cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Readiness + gaps */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Placement Readiness</p>
            <div className="mt-3"><ScoreRing value={readiness} size={150} stroke={12} /></div>
            <p className="mt-2 text-sm font-medium text-ink-600">
              {readiness >= 75 ? "Placement Ready" : readiness >= 60 ? "Close to Ready" : readiness >= 40 ? "Developing" : "Needs Focus"}
            </p>
            <Link href="/student/readiness" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
              View breakdown <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <CardHeader
            title="Skill gaps for your target role"
            subtitle={profile?.targetRole?.name ?? "No target role selected"}
            action={
              <Link href="/student/gaps" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all</Link>
            }
          />
          <div className="mt-4 space-y-3.5">
            {gaps.slice(0, 5).map((g) => (
              <div key={g.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-ink-700">
                    {g.skill.name}
                    {g.status === "CRITICAL_GAP" && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                  </span>
                  <span className="text-ink-400">{g.currentScore}% / {g.requiredScore}%</span>
                </div>
                <div className="relative">
                  <ProgressBar value={(g.currentScore / Math.max(1, g.requiredScore)) * 100} color={g.status === "CRITICAL_GAP" ? "rose" : g.status === "MAJOR_GAP" ? "amber" : g.status === "IMPROVE" ? "sky" : "emerald"} />
                  <div className="absolute -top-0.5 h-3 w-0.5 rounded bg-ink-900/70" style={{ left: `${Math.min(100, g.requiredScore)}%` }} title={`Required: ${g.requiredScore}%`} />
                </div>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  Required {g.requiredScore}% · {g.gap > 0 ? `${g.gap} point gap` : "on track"} · Priority {g.priority}/10
                </p>
              </div>
            ))}
            {gaps.length === 0 && (
              <EmptyState
                icon={<Target className="h-8 w-8" />}
                title="No skill gaps yet"
                description={profile?.targetRole ? "Great — you're meeting all requirements for your role." : "Select a target role to start the analysis."}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Next action + roadmap + coach */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-brand-200 bg-brand-50/50 p-5">
          <div className="flex items-center gap-2 text-brand-700">
            <Sparkles className="h-4.5 w-4.5" />
            <p className="text-xs font-bold uppercase tracking-wide">Recommended next action</p>
          </div>
          <h3 className="mt-3 text-[16px] font-bold text-ink-900">{nextAction.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{nextAction.detail}</p>
          <Link href={nextAction.href} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700">
            {nextAction.cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>

        <Card className="p-5">
          <CardHeader
            title="Roadmap progress"
            subtitle={roadmap ? `${completedItems}/${roadmap.items.length} tasks done` : "Not generated yet"}
            action={
              <Link href="/student/roadmap" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Open</Link>
            }
          />
          <div className="mt-5">
            {roadmap ? (
              <>
                <ProgressBar value={roadmap.progress} color="violet" showLabel />
                <p className="mt-3 text-[13px] text-ink-500">
                  {roadmap.title} · {roadmap.weeks} weeks
                </p>
              </>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title="No roadmap yet"
                description="Generate a personalized weekly plan from your gaps."
                action={<Link href="/student/roadmap" className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700">Generate roadmap</Link>}
              />
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader
            title="AI Career Coach"
            subtitle={conversations > 0 ? `${conversations} conversation${conversations > 1 ? "s" : ""} so far` : "Your personal coach"}
            action={
              <Link href="/student/coach" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Chat</Link>
            }
          />
          <div className="mt-5 flex h-[110px] flex-col justify-center rounded-xl bg-gradient-to-br from-ink-900 to-brand-950 p-4">
            <MessageSquareText className="h-6 w-6 text-brand-300" />
            <p className="mt-2 text-[13px] leading-snug text-white/90">“What should I learn next?” — answered from your live profile.</p>
          </div>
        </Card>
      </div>

      {/* Radar + activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Skill fingerprint" subtitle="Your scores vs. role requirements" action={
            <Link href="/student/skills" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Details</Link>
          } />
          <div className="mt-3">{radarData.length > 0 ? <SkillRadar data={radarData} /> : <p className="py-10 text-center text-sm text-ink-400">No required skills yet.</p>}</div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Recent activity" />
          <div className="mt-4 space-y-3">
            {progress.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-start gap-3 text-[13px]">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${p.type === "ROADMAP_ITEM" ? "bg-violet-50 text-violet-600" : "bg-brand-50 text-brand-600"}`}>
                  {p.type === "ROADMAP_ITEM" ? <Layers className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
                </span>
                <div>
                  <p className="text-ink-700">{p.type === "ROADMAP_ITEM" ? "Completed a roadmap task" : "Recorded progress"}</p>
                  <p className="text-[11px] text-ink-400">{timeAgo(p.recordedAt)}</p>
                </div>
              </div>
            ))}
            {attempts.slice(0, 2).map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-[13px]">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ClipboardList className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-ink-700">Completed {a.assessment.title} — scored {a.score}%</p>
                  <p className="text-[11px] text-ink-400">{timeAgo(a.submittedAt!)}</p>
                </div>
              </div>
            ))}
            {progress.length === 0 && attempts.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-400">Take an assessment or complete a roadmap task to see activity here.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Role matches */}
      <Card className="p-5">
        <CardHeader title="Your best role matches" subtitle="Computed from your live skill profile" action={
          <Link href="/student/roles" className="text-xs font-semibold text-brand-600 hover:text-brand-700">All matches</Link>
        } />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {matches.map((m, i) => (
            <div key={m.roleId} className="rounded-xl border border-ink-200 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-800">
                  {i === 0 && <Trophy className="h-4 w-4 text-amber-500" />}
                  {m.role.name}
                </span>
                <span className="font-display text-lg font-bold text-brand-600">{m.fitScore}%</span>
              </div>
              <div className="mt-2"><ProgressBar value={m.fitScore} color="brand" /></div>
              <p className="mt-2 text-[11px] text-ink-400">
                {safeJsonParse<string[]>(m.missingSkills, []).length > 0
                  ? `Missing: ${safeJsonParse<{ name?: string }[]>(m.missingSkills, []).slice(0, 2).map((x) => x.name ?? "skill").join(", ")}`
                  : "All requirements met"}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Assessment performance strip */}
      {attempts.length > 0 && (
        <Card className="p-5">
          <CardHeader title="Recent assessments" action={<Link href="/student/assessments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">All</Link>} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {attempts.slice(0, 5).map((a) => (
              <div key={a.id} className="rounded-xl border border-ink-200 p-3.5">
                <p className="truncate text-[12px] font-medium text-ink-700">{a.assessment.title}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-ink-900">{a.score}%</span>
                  <Badge color={statusBadgeColor(a.passed ? "PASSED" : "FAILED")}>{a.passed ? "Passed" : "Retake"}</Badge>
                </div>
                <p className="mt-1 text-[10px] text-ink-400">{timeAgo(a.submittedAt!)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
