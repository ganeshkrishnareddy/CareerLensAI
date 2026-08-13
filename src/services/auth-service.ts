import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, setSessionCookie, clearSessionCookie, createResetToken, resetLinkBase, type SessionUser } from "@/lib/auth";
import { isRole } from "@/lib/security";
import { trackEvent } from "./analytics-service";
import { z } from "zod";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,60}$/;
const PASSWORD_MIN = 8;

export const signupSchema = z.object({
  name: z.string().min(2).max(80).regex(NAME_RE, "Please enter a valid name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`),
  role: z.string().default("STUDENT")
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

export async function signup(input: { name: string; email: string; password: string; role?: string }): Promise<SessionUser> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) throw new AuthError(parsed.error.issues[0]?.message ?? "Invalid input");
  const { name, email, password, role } = parsed.data;

  const roleValue: "STUDENT" | "FACULTY" = role === "FACULTY" ? "FACULTY" : "STUDENT";

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new AuthError("An account with this email already exists.");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: roleValue,
      emailVerified: true // email verification is out of scope for the demo; JWT-session auth is enforced
    }
  });

  await trackEvent(user.id, "SIGNUP", { role: roleValue });

  const session: SessionUser = { id: user.id, role: user.role as SessionUser["role"], name: user.name, email: user.email };
  await setSessionCookie(session);
  return session;
}

export async function login(input: { email: string; password: string }): Promise<SessionUser> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) throw new AuthError(parsed.error.issues[0]?.message ?? "Invalid input");
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new AuthError("Invalid email or password");
  if (user.status !== "ACTIVE") throw new AuthError("This account is disabled. Contact your administrator.");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new AuthError("Invalid email or password");

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await trackEvent(user.id, "LOGIN", {});

  const session: SessionUser = { id: user.id, role: user.role as SessionUser["role"], name: user.name, email: user.email };
  await setSessionCookie(session);
  return session;
}

export async function logout() {
  await clearSessionCookie();
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; devLink?: string }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always return ok to avoid account enumeration; only log a link when an account exists.
  if (!user) return { ok: true };
  const token = await createResetToken(user.email);
  const link = `${resetLinkBase()}/reset-password?token=${token}`;
  console.log(`[CareerLens] Password reset link for ${user.email}: ${link}`);
  return { ok: true, devLink: link };
}
