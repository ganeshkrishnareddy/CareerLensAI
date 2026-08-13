import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { markAllRead } from "@/services/notifications-service";
import { checkCsrf } from "@/lib/security";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId: session.id, read: false } })
  ]);
  return NextResponse.json({ notifications, unread });
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  await markAllRead(session.id);
  return NextResponse.json({ ok: true });
}
