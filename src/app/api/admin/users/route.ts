import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { listAdminUsers, updateUser } from "@/services/admin-service";

export async function GET(req: NextRequest) {
  const session = await requireRole("ADMIN");
  const sp = req.nextUrl.searchParams;
  const result = await listAdminUsers({
    search: sp.get("search") ?? undefined,
    role: sp.get("role") ?? undefined,
    status: sp.get("status") ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    pageSize: sp.get("pageSize") ? Number(sp.get("pageSize")) : undefined
  });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const patch: { role?: string; status?: string } = {};
  if (typeof body?.role === "string" && ["STUDENT", "FACULTY", "ADMIN"].includes(body.role)) patch.role = body.role;
  if (typeof body?.status === "string" && ["ACTIVE", "DISABLED", "PENDING"].includes(body.status)) patch.status = body.status;
  if (!userId || Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  try {
    const updated = await updateUser(session.id, userId, patch);
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update user" }, { status: 400 });
  }
}
