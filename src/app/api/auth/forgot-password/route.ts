import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/services/auth-service";
import { checkCsrf, rateLimit, clientIp } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit(`auth:forgot:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });

  const result = await requestPasswordReset(parsed.data.email);
  return NextResponse.json({ ok: result.ok, devLink: result.devLink ?? null });
}
