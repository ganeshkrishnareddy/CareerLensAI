import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { recomputeRoleMatches } from "@/services/analysis-service";

export async function GET() {
  const session = await requireSession();
  const matches = await recomputeRoleMatches(session.id);
  return NextResponse.json({ matches });
}
