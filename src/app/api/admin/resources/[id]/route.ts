import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { updateResource, deleteResource } from "@/services/admin-service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: Partial<{ title: string; url: string; type: string; difficulty: string; description: string | null; skillId: string | null; isActive: boolean }> = {};
  if (typeof body?.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body?.url === "string" && body.url.trim()) data.url = body.url.trim();
  if (typeof body?.type === "string") data.type = body.type;
  if (typeof body?.difficulty === "string") data.difficulty = body.difficulty;
  if (typeof body?.description === "string") data.description = body.description;
  if (typeof body?.skillId === "string" || body?.skillId === null) data.skillId = body.skillId;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
  try {
    return NextResponse.json({ resource: await updateResource(session.id, id, data) });
  } catch {
    return NextResponse.json({ error: "Could not update resource" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  try {
    await deleteResource(session.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete resource" }, { status: 400 });
  }
}
