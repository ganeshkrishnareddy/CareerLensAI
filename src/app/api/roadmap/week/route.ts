import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { markWeekComplete, RoadmapError } from "@/services/roadmap-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ week: z.number().int().min(1) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "week is required" }, { status: 400 });
    const count = await markWeekComplete(session.id, parsed.data.week);
    return NextResponse.json({ completed: count });
  } catch (err) {
    if (err instanceof RoadmapError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("week complete error:", err);
    return NextResponse.json({ error: "Could not complete week." }, { status: 500 });
  }
}
