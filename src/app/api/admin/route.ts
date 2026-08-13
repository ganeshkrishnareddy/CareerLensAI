import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { adminStats } from "@/services/admin-service";

export async function GET() {
  const session = await requireRole("ADMIN");
  const stats = await adminStats();
  return NextResponse.json(stats);
}
