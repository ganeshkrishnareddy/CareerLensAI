import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createCertification, deleteCertification, ProfileError } from "@/services/profile-service";
import { checkCsrf } from "@/lib/security";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const certifications = await prisma.certification.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ certifications });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const certification = await createCertification(session.id, body ?? {});
    return NextResponse.json({ certification });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("certification create error:", err);
    return NextResponse.json({ error: "Could not save certification." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  try {
    await deleteCertification(session.id, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not delete certification." }, { status: 500 });
  }
}
