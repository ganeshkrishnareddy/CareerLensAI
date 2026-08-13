import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { listDepartments, createDepartment, createBatch } from "@/services/admin-service";

export async function GET() {
  await requireRole("ADMIN");
  return NextResponse.json(await listDepartments());
}

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (body?.kind === "batch") {
    if (typeof body.departmentId !== "string" || typeof body.name !== "string" || !Number.isInteger(body.year)) {
      return NextResponse.json({ error: "departmentId, name and year are required" }, { status: 400 });
    }
    const batch = await createBatch(session.id, body.departmentId, body.name.trim(), body.year);
    return NextResponse.json({ batch });
  }
  if (typeof body?.name !== "string" || typeof body?.code !== "string") {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 });
  }
  const dept = await createDepartment(session.id, body.name.trim(), body.code.trim().toUpperCase());
  return NextResponse.json({ department: dept });
}
