import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { checkCsrf } from "@/lib/security";
import { getSettings, saveSettings } from "@/services/admin-service";

export async function GET() {
  await requireRole("ADMIN");
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (!checkCsrf(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const patch: Record<string, unknown> = {};
  if (body?.readinessWeights && typeof body.readinessWeights === "object") patch.readinessWeights = body.readinessWeights;
  if (body?.aiEnabled !== undefined && typeof body.aiEnabled === "boolean") patch.aiEnabled = body.aiEnabled;
  if (body?.aiProvider && typeof body.aiProvider === "string") patch.aiProvider = body.aiProvider;
  if (body?.aiModel && typeof body.aiModel === "string") patch.aiModel = body.aiModel;
  if (body?.assessmentRetakeLimit !== undefined && Number.isInteger(body.assessmentRetakeLimit)) patch.assessmentRetakeLimit = body.assessmentRetakeLimit;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  await saveSettings(session.id, patch);
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
