import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { upsertSkill, removeSkill, ProfileError } from "@/services/profile-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ skillId: z.string().min(1), level: z.number().int().min(0).max(5) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "skillId and level (0-5) are required" }, { status: 400 });
    const skill = await upsertSkill(session.id, parsed.data.skillId, parsed.data.level);
    return NextResponse.json({ skill });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("skill update error:", err);
    return NextResponse.json({ error: "Could not update skill." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const skillId = request.nextUrl.searchParams.get("skillId");
  if (!skillId) return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  await removeSkill(session.id, skillId);
  return NextResponse.json({ ok: true });
}
