import { jwtVerify } from "jose";

// Edge-runtime-safe session helpers. Middleware imports this module instead of
// ./auth, which pulls in Prisma/bcrypt and breaks the Edge bundle.

export const SESSION_COOKIE = "cl_session";
export const RESET_COOKIE = "cl_reset_token";

export function sessionSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "insecure-dev-secret-change-me");
}

export interface SessionJwtPayload {
  sub?: string;
  role?: "STUDENT" | "FACULTY" | "ADMIN";
  purpose?: "session" | "password-reset";
}

/** Verify a signed JWT and return its payload, or null when invalid/expired. */
export async function verifyJwt<T = SessionJwtPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    return payload as unknown as T;
  } catch {
    return null;
  }
}
