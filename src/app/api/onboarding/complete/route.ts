import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { completeOnboarding } from "@/services/profile-service";
import { checkCsrf } from "@/lib/security";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const profile = await completeOnboarding(session.id);
  return NextResponse.json({ ok: true, profile });
}
