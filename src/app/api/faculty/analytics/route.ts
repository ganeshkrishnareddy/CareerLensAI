import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getFacultyAnalytics } from "@/services/faculty-service";

export async function GET(req: NextRequest) {
  const session = await requireRole("FACULTY", "ADMIN");
  const sp = req.nextUrl.searchParams;
  const data = await getFacultyAnalytics(session.id, {
    departmentId: sp.get("departmentId") ?? undefined,
    batchId: sp.get("batchId") ?? undefined,
    targetRoleId: sp.get("targetRoleId") ?? undefined
  });
  return NextResponse.json(data);
}
