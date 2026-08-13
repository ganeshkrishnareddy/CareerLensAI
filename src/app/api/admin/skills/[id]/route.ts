import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { updateSkill, deleteSkill } from "@/services/admin-service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: { name?: string; category?: string; description?: string | null; isActive?: boolean } = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.category === "string") data.category = body.category;
  if (typeof body?.description === "string") data.description = body.description;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
  try {
    return NextResponse.json({ skill: await updateSkill(session.id, id, data) });
  } catch {
    return NextResponse.json({ error: "Could not update skill" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  try {
    await deleteSkill(session.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete skill — it may be referenced by roles or questions" }, { status: 400 });
  }
}
