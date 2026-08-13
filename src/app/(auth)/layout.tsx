import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-50 lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="gradient-hero relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo-white.svg" alt="CareerLens AI" className="h-10 w-auto" />
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Know your gap.<br />
            Build your skill.<br />
            <span className="text-gradient">Get placement-ready.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            One intelligent ecosystem turns your profile, skills and assessments into a
            personalized placement preparation plan.
          </p>
          <div className="mt-8 space-y-3">
            {[
              ["ASSESS", "Build your complete skill profile"],
              ["ANALYZE", "Compare with target-role requirements"],
              ["RECOMMEND", "Get a personalized weekly roadmap"],
              ["TRACK", "Re-assess and watch readiness grow"]
            ].map(([step, text]) => (
              <div key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                <span className="rounded-md bg-white/10 px-2 py-1 font-display text-[11px] font-bold tracking-wider text-brand-200">{step}</span>
                <span className="text-[13px] text-slate-200">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} CareerLens AI · KAIROTHON 2026</p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center justify-center lg:hidden">
            <img src="/logo.svg" alt="CareerLens AI" className="h-9 w-auto" />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
