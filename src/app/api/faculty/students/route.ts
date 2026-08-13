import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { listFacultyStudents } from "@/services/faculty-service";

export async function GET(req: NextRequest) {
  const session = await requireRole("FACULTY", "ADMIN");
  const sp = req.nextUrl.searchParams;
  const num = (key: string) => {
    const v = sp.get(key);
    return v === null || v === "" ? undefined : Number(v);
  };
  const data = await listFacultyStudents(session.id, {
    departmentId: sp.get("departmentId") ?? undefined,
    batchId: sp.get("batchId") ?? undefined,
    targetRoleId: sp.get("targetRoleId") ?? undefined,
    skillId: sp.get("skillId") ?? undefined,
    assessmentId: sp.get("assessmentId") ?? undefined,
    minReadiness: num("minReadiness"),
    maxReadiness: num("maxReadiness"),
    search: sp.get("search") ?? undefined,
    page: num("page"),
    pageSize: num("pageSize")
  });
  return NextResponse.json(data);
}
