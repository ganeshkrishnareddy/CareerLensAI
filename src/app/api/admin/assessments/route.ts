import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { listAssessments, createAssessment } from "@/services/admin-service";

const TYPES = ["TECHNICAL", "CODING", "APTITUDE", "COMMUNICATION", "INTERVIEW", "ROLE_SPECIFIC", "SKILL_SPECIFIC"];

export async function GET() {
  await requireRole("ADMIN");
  return NextResponse.json({ assessments: await listAssessments() });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const assessment = await createAssessment(session.id, {
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description : undefined,
    type: TYPES.includes(body.type) ? body.type : "TECHNICAL",
    difficulty: body.difficulty ?? "MEDIUM",
    durationMinutes: Math.max(1, Number(body.durationMinutes) || 15),
    passScore: Math.max(0, Math.min(100, Number(body.passScore) || 50)),
    roleId: typeof body.roleId === "string" ? body.roleId : null,
    skillId: typeof body.skillId === "string" ? body.skillId : null
  });
  return NextResponse.json({ assessment });
}
