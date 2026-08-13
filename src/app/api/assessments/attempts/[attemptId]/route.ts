import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getAttemptResult, AssessmentError } from "@/services/assessment-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const session = await requireSession();
  const { attemptId } = await params;
  try {
    const result = await getAttemptResult(attemptId, session.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AssessmentError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("attempt result error:", err);
    return NextResponse.json({ error: "Could not load result." }, { status: 500 });
  }
}
