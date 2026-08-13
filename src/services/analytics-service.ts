import { prisma } from "@/lib/db";

export type EventType =
  | "SIGNUP"
  | "LOGIN"
  | "PROFILE_COMPLETION"
  | "RESUME_UPLOAD"
  | "ASSESSMENT_STARTED"
  | "ASSESSMENT_COMPLETED"
  | "ROADMAP_ITEM_COMPLETED"
  | "SKILL_IMPROVEMENT"
  | "AI_COACH_USAGE"
  | "ROLE_VIEWED"
  | "ROLE_SELECTED";

export async function trackEvent(userId: string | null, type: EventType | string, meta?: unknown) {
  try {
    await prisma.analyticsEvent.create({
      data: { userId, type, meta: (meta as object) ?? undefined }
    });
  } catch (err) {
    console.error("analytics event failed:", err);
  }
}

export interface EventCount {
  type: string;
  count: number;
}

export async function eventCounts(days = 30): Promise<EventCount[]> {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: since } },
    _count: { _all: true }
  });
  return rows
    .map((r) => ({ type: r.type, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function dailySignups(days = 14): Promise<{ date: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.analyticsEvent.findMany({
    where: { type: "SIGNUP", createdAt: { gte: since } },
    select: { createdAt: true }
  });
  const buckets: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += 1;
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export interface EngagementSummary {
  totalEvents: number;
  assessmentsStarted: number;
  assessmentsCompleted: number;
  roadmapItemsCompleted: number;
  coachSessions: number;
  resumesUploaded: number;
  signups: number;
}

export async function getEngagementSummary(days = 30): Promise<EngagementSummary> {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: since } },
    _count: { _all: true }
  });
  const count = (type: string) => rows.find((r) => r.type === type)?._count._all ?? 0;
  return {
    totalEvents: rows.reduce((a, r) => a + r._count._all, 0),
    assessmentsStarted: count("ASSESSMENT_STARTED"),
    assessmentsCompleted: count("ASSESSMENT_COMPLETED"),
    roadmapItemsCompleted: count("ROADMAP_ITEM_COMPLETED"),
    coachSessions: count("AI_COACH_USAGE"),
    resumesUploaded: count("RESUME_UPLOAD"),
    signups: count("SIGNUP")
  };
}
