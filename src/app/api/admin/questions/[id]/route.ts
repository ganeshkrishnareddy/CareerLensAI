import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { updateQuestion, deleteQuestion } from "@/services/admin-service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const data: Partial<{ text: string; type: string; options: unknown; correctAnswer: unknown; marks: number; difficulty: string; explanation: string | null; skillIds?: string[] }> = {};
  if (typeof body?.text === "string" && body.text.trim()) data.text = body.text.trim();
  if (typeof body?.type === "string") data.type = body.type;
  if (body?.options !== undefined) data.options = body.options;
  if (body?.correctAnswer !== undefined) data.correctAnswer = body.correctAnswer;
  if (Number.isInteger(body?.marks)) data.marks = body.marks;
  if (typeof body?.difficulty === "string") data.difficulty = body.difficulty;
  if (typeof body?.explanation === "string") data.explanation = body.explanation;
  if (Array.isArray(body?.skillIds)) data.skillIds = body.skillIds.filter((s: unknown) => typeof s === "string");
  try {
    return NextResponse.json({ question: await updateQuestion(session.id, id, data) });
  } catch {
    return NextResponse.json({ error: "Could not update question" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  try {
    await deleteQuestion(session.id, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete question" }, { status: 400 });
  }
}
