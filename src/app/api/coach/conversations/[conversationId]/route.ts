import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { conversationHistory } from "@/services/coach-service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await requireSession();
  const { conversationId } = await params;
  const conversation = await conversationHistory(session.id, conversationId);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  return NextResponse.json({ conversation });
}
