import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getFacultyStudentDetail } from "@/services/faculty-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const session = await requireRole("FACULTY", "ADMIN");
  const { studentId } = await params;
  const data = await getFacultyStudentDetail(session.id, studentId);
  if (!data) return NextResponse.json({ error: "Student not found or not in your scope" }, { status: 404 });
  return NextResponse.json(data);
}
