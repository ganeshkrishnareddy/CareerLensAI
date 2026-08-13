import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { submitAssessment, AssessmentError, type SubmitAnswer } from "@/services/assessment-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { attemptId } = await params;
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ answers: z.array(z.object({ questionId: z.string(), answer: z.unknown() })) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid answers payload" }, { status: 400 });
    const result = await submitAssessment(session.id, attemptId, parsed.data.answers as SubmitAnswer[]);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AssessmentError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("submit assessment error:", err);
    return NextResponse.json({ error: "Could not submit assessment." }, { status: 500 });
  }
}
