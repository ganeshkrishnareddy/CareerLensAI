import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { updateAssessment, deleteAssessment } from "@/services/admin-service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: Partial<{ title: string; description: string | null; type: string; difficulty: string; durationMinutes: number; passScore: number; isActive: boolean; roleId: string | null; skillId: string | null }> = {};
  if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body?.description === "string") data.description = body.description;
  if (typeof body?.type === "string") data.type = body.type;
  if (typeof body?.difficulty === "string") data.difficulty = body.difficulty;
  if (Number.isInteger(body?.durationMinutes)) data.durationMinutes = body.durationMinutes;
  if (Number.isInteger(body?.passScore)) data.passScore = body.passScore;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
  try {
    return NextResponse.json({ assessment: await updateAssessment(session.id, id, data) });
  } catch {
    return NextResponse.json({ error: "Could not update assessment" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  try {
    await deleteAssessment(session.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete assessment" }, { status: 400 });
  }
}
