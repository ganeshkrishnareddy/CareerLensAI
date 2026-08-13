import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { coachReply, CoachError, listConversations } from "@/services/coach-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ message: z.string().min(1).max(2000), conversationId: z.string().nullable().optional() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Message is required" }, { status: 400 });
    const result = await coachReply(session.id, parsed.data.conversationId ?? null, parsed.data.message);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof CoachError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("coach error:", err);
    return NextResponse.json({ error: "The coach hit an error. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await requireSession();
  const conversations = await listConversations(session.id);
  return NextResponse.json({ conversations });
}
