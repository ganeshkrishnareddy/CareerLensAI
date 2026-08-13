import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { ensureRoadmap, RoadmapError } from "@/services/roadmap-service";
import { checkCsrf } from "@/lib/security";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const roadmap = await ensureRoadmap(session.id, 6);
    return NextResponse.json({ roadmap });
  } catch (err) {
    if (err instanceof RoadmapError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("roadmap generate error:", err);
    return NextResponse.json({ error: "Could not generate roadmap." }, { status: 500 });
  }
}
