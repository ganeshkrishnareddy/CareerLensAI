import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyJwt } from "./lib/jwt";

type Role = "STUDENT" | "FACULTY" | "ADMIN";

interface Payload {
  sub?: string;
  role?: Role;
  purpose?: string;
}

const roleHome: Record<Role, string> = {
  STUDENT: "/student",
  FACULTY: "/faculty",
  ADMIN: "/admin"
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/student") ||
    pathname.startsWith("/faculty") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/api/");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyJwt<Payload>(token) : null;

  // API routes: let handlers decide (they re-verify + enforce roles server-side).
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const authed = Boolean(session?.sub && session.purpose === "session");

  if (!isProtected) {
    // Signed-in users skip auth pages.
    if (authed && (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname.startsWith("/reset-password"))) {
      const home = session?.role ? roleHome[session.role] : "/student";
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // Role-based section guard
  const role = session!.role;
  if (!role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (pathname.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }
  if (pathname.startsWith("/faculty") && role !== "FACULTY" && role !== "ADMIN") {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }
  if (pathname.startsWith("/onboarding") && role !== "STUDENT") {
    return NextResponse.redirect(new URL(roleHome[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"]
};
