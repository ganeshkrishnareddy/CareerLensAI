import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { saveResumeFile, analyzeResumeText, ResumeError } from "@/services/resume-service";
import { checkCsrf } from "@/lib/security";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    const extractedText = String(form.get("text") ?? "");
    if (!(file instanceof File)) throw new ResumeError("No file provided");
    if (!extractedText.trim()) throw new ResumeError("Could not extract any text from this file.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveResumeFile({
      userId: session.id,
      fileName: file.name,
      fileType: file.type,
      size: file.size,
      buffer
    });

    const extraction = await analyzeResumeText(session.id, saved.id, extractedText);
    return NextResponse.json({ resumeId: saved.id, extraction });
  } catch (err) {
    if (err instanceof ResumeError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("resume upload error:", err);
    return NextResponse.json({ error: "Could not process this file." }, { status: 500 });
  }
}
