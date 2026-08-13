import { requireRole } from "@/lib/auth";
import { eventCounts, dailySignups, getEngagementSummary } from "@/services/analytics-service";
import { Card, CardHeader, StatCard, ProgressBar } from "@/components/ui/ui";
import { SimpleBars } from "@/components/charts";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  SIGNUP: "Signups",
  LOGIN: "Logins",
  PROFILE_COMPLETION: "Profile completions",
  RESUME_UPLOAD: "Resume uploads",
  ASSESSMENT_STARTED: "Assessments started",
  ASSESSMENT_COMPLETED: "Assessments completed",
  ROADMAP_ITEM_COMPLETED: "Roadmap tasks done",
  SKILL_IMPROVEMENT: "Skill improvements",
  AI_COACH_USAGE: "Coach conversations",
  ROLE_VIEWED: "Roles viewed",
  ROLE_SELECTED: "Roles selected"
};

export default async function AdminAnalyticsPage() {
  await requireRole("ADMIN");
  const [events, signups, engagement] = await Promise.all([eventCounts(30), dailySignups(14), getEngagementSummary()]);
  const maxEvent = Math.max(1, ...events.map((e) => e.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Analytics</h1>
        <p className="mt-1 text-sm text-ink-500">Meaningful events across the placement-readiness loop — last 30 days.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total events" value={engagement.totalEvents} accent="brand" />
        <StatCard label="Assessments started" value={engagement.assessmentsStarted} accent="sky" />
        <StatCard label="Assessments completed" value={engagement.assessmentsCompleted} accent="emerald" />
        <StatCard label="Roadmap tasks" value={engagement.roadmapItemsCompleted} accent="violet" />
        <StatCard label="Coach sessions" value={engagement.coachSessions} accent="amber" />
        <StatCard label="Resumes uploaded" value={engagement.resumesUploaded} accent="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Daily signups" subtitle="Last 14 days" />
          <div className="mt-4">
            <SimpleBars data={signups.map((s) => ({ label: s.date.slice(5), value: s.count }))} height={220} />
          </div>
          {signups.every((s) => s.count === 0) && <p className="mt-2 text-center text-xs text-ink-400">No signups in this window.</p>}
        </Card>

        <Card className="p-5">
          <CardHeader title="Event distribution" subtitle="Last 30 days" />
          <div className="mt-4 space-y-2.5">
            {events.length === 0 && <p className="text-sm text-ink-400">No events tracked yet.</p>}
            {events.map((e) => (
              <div key={e.type}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-ink-700">{EVENT_LABELS[e.type] ?? e.type.replace(/_/g, " ")}</span>
                  <span className="font-bold text-ink-800">{e.count}</span>
                </div>
                <ProgressBar value={(e.count / maxEvent) * 100} color="brand" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
