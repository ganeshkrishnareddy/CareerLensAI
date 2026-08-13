import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { addFacultyNote } from "@/services/faculty-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const session = await requireRole("FACULTY", "ADMIN");
  const { studentId } = await params;
  const body = await req.json().catch(() => null);
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!note) return NextResponse.json({ error: "Note is required" }, { status: 400 });
  if (note.length > 2000) return NextResponse.json({ error: "Note is too long" }, { status: 400 });

  const created = await addFacultyNote(session.id, studentId, note);
  if (!created) return NextResponse.json({ error: "Student not found or not in your scope" }, { status: 404 });
  return NextResponse.json({ note: created });
}
