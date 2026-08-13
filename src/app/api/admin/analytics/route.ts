import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { eventCounts, dailySignups, getEngagementSummary } from "@/services/analytics-service";

export async function GET() {
  await requireRole("ADMIN");
  const [events, signups, engagement] = await Promise.all([
    eventCounts(30),
    dailySignups(14),
    getEngagementSummary()
  ]);
  return NextResponse.json({ events, signups, engagement });
}
