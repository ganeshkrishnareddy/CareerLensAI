import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { setRoleSkill, removeRoleSkill } from "@/services/admin-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id: roleId } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.skillId !== "string" || (body.requirement !== "REQUIRED" && body.requirement !== "PREFERRED")) {
    return NextResponse.json({ error: "skillId and requirement (REQUIRED|PREFERRED) are required" }, { status: 400 });
  }
  const minProficiency = Math.max(0, Math.min(100, Number(body.minProficiency) || 50));
  const weight = Math.max(0.1, Number(body.weight) || 1);
  const row = await setRoleSkill(session.id, roleId, body.skillId, body.requirement, minProficiency, weight);
  return NextResponse.json({ roleSkill: row });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id: roleId } = await params;
  const skillId = req.nextUrl.searchParams.get("skillId");
  if (!skillId) return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  await removeRoleSkill(session.id, roleId, skillId);
  return NextResponse.json({ ok: true });
}
