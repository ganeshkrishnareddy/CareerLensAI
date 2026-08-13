import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { listResources, createResource } from "@/services/admin-service";

export async function GET() {
  await requireRole("ADMIN");
  return NextResponse.json({ resources: await listResources() });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (typeof body?.title !== "string" || !body.title.trim() || typeof body?.url !== "string" || !body.url.trim()) {
    return NextResponse.json({ error: "title and url are required" }, { status: 400 });
  }
  const resource = await createResource(session.id, {
    title: body.title.trim(),
    url: body.url.trim(),
    type: body.type ?? "ARTICLE",
    difficulty: body.difficulty ?? "MEDIUM",
    description: typeof body.description === "string" ? body.description : undefined,
    skillId: typeof body.skillId === "string" ? body.skillId : null
  });
  return NextResponse.json({ resource });
}
