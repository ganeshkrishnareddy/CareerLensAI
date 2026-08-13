import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { startAssessment, AssessmentError } from "@/services/assessment-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ assessmentId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
    const result = await startAssessment(session.id, parsed.data.assessmentId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AssessmentError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("start assessment error:", err);
    return NextResponse.json({ error: "Could not start assessment." }, { status: 500 });
  }
}
