import { NextRequest, NextResponse } from "next/server";
import { login, AuthError } from "@/services/auth-service";
import { checkCsrf, rateLimit, clientIp } from "@/lib/security";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit(`auth:login:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }
  if (!checkCsrf(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => null);
    const session = await login(body ?? {});
    return NextResponse.json({ user: session });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("login error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
