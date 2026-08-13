import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { updateRole, deleteRole } from "@/services/admin-service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: { name?: string; description?: string | null; category?: string | null; isActive?: boolean } = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.description === "string") data.description = body.description;
  if (typeof body?.category === "string") data.category = body.category;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
  try {
    return NextResponse.json({ role: await updateRole(session.id, id, data) });
  } catch {
    return NextResponse.json({ error: "Could not update role" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  try {
    await deleteRole(session.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete role — it may be referenced by students or assessments" }, { status: 400 });
  }
}
