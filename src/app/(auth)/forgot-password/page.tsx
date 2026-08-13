"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Input, Label } from "@/components/ui/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ ok: boolean; devLink?: string | null }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setSent(true);
      setDevLink(res.devLink ?? null);
      toast.success("Reset link sent");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <>
        <h1 className="text-2xl font-bold text-ink-900">Check your email</h1>
        <p className="mt-2 text-sm text-ink-500">
          If an account exists for <span className="font-medium text-ink-800">{email}</span>, a password reset
          link has been sent. The link expires in 30 minutes.
        </p>
        {devLink && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <p className="font-semibold">Development mode</p>
            <p className="mt-1 break-all">No email provider configured. Reset link:</p>
            <a href={devLink} className="mt-1 block break-all font-medium text-amber-700 underline">{devLink}</a>
          </div>
        )}
        <Link href="/login" className="mt-6 block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-ink-900">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-500">Enter your account email and we'll send you a reset link.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">Back to sign in</Link>
      </p>
    </>
  );
}
