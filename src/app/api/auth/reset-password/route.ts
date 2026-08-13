import { NextRequest, NextResponse } from "next/server";
import { updatePasswordWithResetToken } from "@/lib/auth";
import { checkCsrf, rateLimit, clientIp } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit(`auth:reset:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ token: z.string().min(10), password: z.string().min(8, "Password must be at least 8 characters") })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const result = await updatePasswordWithResetToken(parsed.data.token, parsed.data.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
