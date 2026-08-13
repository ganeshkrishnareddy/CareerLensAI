import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import { appUrl } from "./utils";
import type { Role } from "./security";

export const SESSION_COOKIE = "cl_session";
export const RESET_COOKIE = "cl_reset_token";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "insecure-dev-secret-change-me");

export function sessionTtlSeconds(): number {
  const ttl = Number(process.env.SESSION_TTL_SECONDS ?? 604800);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 604800;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

export interface SessionPayload extends SessionUser {
  purpose?: "session" | "password-reset";
  sub?: string;
}

export async function createSessionToken(user: SessionUser, purpose: "session" | "password-reset" = "session"): Promise<string> {
  const ttl = purpose === "session" ? sessionTtlSeconds() : 30 * 60; // reset tokens live 30 min
  return new SignJWT({ sub: user.id, role: user.role, name: user.name, email: user.email, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(secret());
}

export async function verifyToken<T = SessionPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds()
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.purpose !== "session" || !payload.sub) return null;
  return {
    id: payload.sub,
    role: payload.role as Role,
    name: payload.name,
    email: payload.email
  };
}

/** Get session or redirect to login. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login?next=" + encodeURIComponent("/"));
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role)) {
    redirect(roleHome(session.role));
  }
  return session;
}

export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "FACULTY":
      return "/faculty";
    default:
      return "/student";
  }
}

// ── Password reset ────────────────────────────────────────────────
export function resetLinkBase(): string {
  return appUrl();
}

export async function createResetToken(email: string): Promise<string> {
  return new SignJWT({ sub: email, purpose: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 30 * 60)
    .sign(secret());
}

export async function updatePasswordWithResetToken(token: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const payload = await verifyToken<{ sub?: string; purpose?: string }>(token);
  if (!payload || payload.purpose !== "password-reset" || !payload.sub) {
    return { ok: false, error: "This reset link is invalid or has expired. Please request a new one." };
  }
  const email = payload.sub.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "Account not found." };
  if (newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { ok: true };
}

/** Demo credential helper used by seed + docs only. */
export const DEMO_CREDENTIALS = {
  student: { email: "student@careerlens.ai", password: "CareerLens@2026" },
  faculty: { email: "faculty@careerlens.ai", password: "CareerLens@2026" },
  admin: { email: "admin@careerlens.ai", password: "CareerLens@2026" }
} as const;
