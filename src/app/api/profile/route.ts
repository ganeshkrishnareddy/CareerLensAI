import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateProfile, ProfileError } from "@/services/profile-service";
import { checkCsrf } from "@/lib/security";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const profile = await prisma.profile.findUnique({
    where: { userId: session.id },
    include: { targetRole: true, department: true, batch: true, institution: true }
  });
  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const profile = await updateProfile(session.id, body ?? {});
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("profile update error:", err);
    return NextResponse.json({ error: "Could not save profile." }, { status: 500 });
  }
}
