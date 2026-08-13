"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Input, Label } from "@/components/ui/ui";

const DEMO_PASSWORD = "CareerLens@2026";
const DEMO_ACCOUNTS = [
  { label: "Student", email: "student@careerlens.ai" },
  { label: "Faculty", email: "faculty@careerlens.ai" },
  { label: "Admin", email: "admin@careerlens.ai" }
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/login") && nextParam !== "/" ? nextParam : null;
  // Demo-first UX: credentials auto-fill on load; chips swap the active account.
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api<{ user: { role: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      toast.success("Welcome back!");
      const home = user.role === "ADMIN" ? "/admin" : user.role === "FACULTY" ? "/faculty" : "/student";
      router.push(next ?? home);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Sign in to continue your placement journey.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        New to CareerLens?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
      <div className="mt-8 rounded-xl border border-ink-200 bg-white p-4 text-xs text-ink-500">
        <p className="font-semibold text-ink-700">One-click demo login — pick a role</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const active = email === acc.email;
            return (
              <button
                key={acc.label}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className={`rounded-lg border px-2.5 py-1.5 font-medium transition-colors ${
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-700"
                }`}
              >
                {acc.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-ink-400">
          Username &amp; password auto-fill — just press <b>Sign in</b>.
        </p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
