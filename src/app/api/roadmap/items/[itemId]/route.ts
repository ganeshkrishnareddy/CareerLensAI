import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateItemStatus, RoadmapError } from "@/services/roadmap-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { itemId } = await params;
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const item = await updateItemStatus(session.id, itemId, parsed.data.status);
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof RoadmapError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("roadmap item update error:", err);
    return NextResponse.json({ error: "Could not update item." }, { status: 500 });
  }
}
