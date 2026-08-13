import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { applyExtraction, ResumeError } from "@/services/resume-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ resumeId: z.string().min(1), data: z.any() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
    const result = await applyExtraction(session.id, parsed.data.resumeId, parsed.data.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof ResumeError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("resume apply error:", err);
    return NextResponse.json({ error: "Could not apply extraction." }, { status: 500 });
  }
}
