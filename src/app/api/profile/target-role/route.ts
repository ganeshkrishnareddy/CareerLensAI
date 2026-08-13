import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { setTargetRole, ProfileError } from "@/services/profile-service";
import { checkCsrf } from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!checkCsrf(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null);
    const parsed = z.object({ roleId: z.string().min(1) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Role is required" }, { status: 400 });
    const role = await setTargetRole(session.id, parsed.data.roleId);
    return NextResponse.json({ role });
  } catch (err) {
    if (err instanceof ProfileError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("target role error:", err);
    return NextResponse.json({ error: "Could not set target role." }, { status: 500 });
  }
}
