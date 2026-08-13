import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/services/auth-service";

export async function POST(request: NextRequest) {
  await logout();
  return NextResponse.json({ ok: true });
}
