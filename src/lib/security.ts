import { NextRequest } from "next/server";
import { prisma } from "./db";

export type Role = "STUDENT" | "FACULTY" | "ADMIN";

const ALL_ROLES: Role[] = ["STUDENT", "FACULTY", "ADMIN"];

export function isRole(value: string): value is Role {
  return ALL_ROLES.includes(value as Role);
}

/** Verify the Origin/Referer of a mutation request matches this app. */
export function checkCsrf(request: NextRequest | Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // Non-browser clients (curl, tests) may omit Origin; require a matching referer instead.
    const referer = request.headers.get("referer");
    if (!referer) return false;
    try {
      const url = new URL(referer);
      return url.host === requestUrlHost(request);
    } catch {
      return false;
    }
  }
  try {
    const url = new URL(origin);
    return url.host === requestUrlHost(request);
  } catch {
    return false;
  }
}

function requestUrlHost(request: NextRequest | Request): string {
  if (request instanceof NextRequest) return request.nextUrl.host;
  const forwarded = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  return forwarded ?? host ?? "";
}

// ── Rate limiting (in-memory, per instance) ──────────────────────
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit?: number, windowMs?: number): RateLimitResult {
  const max = limit ?? Number(process.env.RATE_LIMIT_MAX ?? 20);
  const window = windowMs ?? Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + window });
    return { ok: true, remaining: max - 1, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > max) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, remaining: max - bucket.count, retryAfterSeconds: 0 };
}

export function clientIp(request: NextRequest | Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

// ── Audit logging ─────────────────────────────────────────────────
export async function logAudit(params: {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: unknown;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: (params.details as object) ?? undefined,
        ip: params.ip
      }
    });
  } catch (err) {
    console.error("audit log failed:", err);
  }
}
