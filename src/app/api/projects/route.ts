import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createProject, updateProject, deleteProject, ProfileError } from "@/services/profile-service";
import { checkCsrf } from "@/lib/security";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const projects = await prisma.project.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const project = await createProject(session.id, body ?? {});
    return NextResponse.json({ project });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("project create error:", err);
    return NextResponse.json({ error: "Could not save project." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const projectId = request.nextUrl.searchParams.get("id");
    if (!projectId) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const project = await updateProject(session.id, projectId, body ?? {});
    return NextResponse.json({ project });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not update project." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const projectId = request.nextUrl.searchParams.get("id");
  if (!projectId) return NextResponse.json({ error: "id is required" }, { status: 400 });
  try {
    await deleteProject(session.id, projectId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: "Could not delete project." }, { status: 500 });
  }
}
