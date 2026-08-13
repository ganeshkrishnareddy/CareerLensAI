import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getRoadmapWithItems } from "@/services/roadmap-service";

export async function GET() {
  const session = await requireSession();
  const roadmap = await getRoadmapWithItems(session.id);
  return NextResponse.json({ roadmap });
}
