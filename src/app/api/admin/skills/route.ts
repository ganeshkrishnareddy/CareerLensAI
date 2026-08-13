import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { listSkills, createSkill } from "@/services/admin-service";

const CATEGORIES = ["PROGRAMMING", "FRAMEWORK", "DATABASE", "CLOUD", "CYBERSECURITY", "DATA_AI", "TOOLS", "SOFT", "APTITUDE", "COMMUNICATION", "DSA", "OTHER"];

export async function GET() {
  await requireRole("ADMIN");
  return NextResponse.json({ skills: await listSkills() });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Skill name is required" }, { status: 400 });
  const category = CATEGORIES.includes(body.category) ? body.category : "OTHER";
  try {
    const skill = await createSkill(session.id, { name: body.name.trim(), category, description: typeof body.description === "string" ? body.description : undefined });
    return NextResponse.json({ skill });
  } catch {
    return NextResponse.json({ error: "A skill with this name already exists" }, { status: 400 });
  }
}
