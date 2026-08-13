import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { createQuestion } from "@/services/admin-service";

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.assessmentId !== "string" || typeof body?.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "assessmentId and question text are required" }, { status: 400 });
  }
  const question = await createQuestion(session.id, {
    assessmentId: body.assessmentId,
    text: body.text.trim(),
    type: body.type ?? "MCQ",
    options: body.options,
    correctAnswer: body.correctAnswer,
    marks: Math.max(1, Number(body.marks) || 1),
    difficulty: body.difficulty ?? "MEDIUM",
    explanation: typeof body.explanation === "string" ? body.explanation : undefined,
    skillIds: Array.isArray(body.skillIds) ? body.skillIds.filter((s: unknown) => typeof s === "string") : []
  });
  return NextResponse.json({ question });
}
