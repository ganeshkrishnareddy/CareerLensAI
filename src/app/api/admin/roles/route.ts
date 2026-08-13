import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { listRolesWithSkills, createRole } from "@/services/admin-service";

export async function GET() {
  await requireRole("ADMIN");
  return NextResponse.json({ roles: await listRolesWithSkills() });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Role name is required" }, { status: 400 });
  try {
    const role = await createRole(session.id, {
      name: body.name.trim(),
      description: typeof body.description === "string" ? body.description : undefined,
      category: typeof body.category === "string" ? body.category : undefined
    });
    return NextResponse.json({ role });
  } catch {
    return NextResponse.json({ error: "A role with this name already exists" }, { status: 400 });
  }
}
