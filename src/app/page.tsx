import Link from "next/link";
import {
  ArrowRight, Sparkles, Target, LineChart, GraduationCap, ShieldCheck,
  Users, Building2, Brain, Rocket, CheckCircle2, FileSearch, ClipboardList,
  BookOpen, RefreshCw, Trophy, ChevronDown, Star, MessageSquareText, BadgeCheck
} from "lucide-react";
import { FAQItem } from "@/components/landing/faq";

const WORKFLOW = [
  { icon: ClipboardList, step: "01", title: "Assess", text: "Build your complete profile — skills, projects, resume and target role." },
  { icon: Target, step: "02", title: "Analyze", text: "AI compares your skills against real role requirements to find exact gaps." },
  { icon: Brain, step: "03", title: "Recommend", text: "Get a personalized weekly roadmap with tasks, resources and assessments." },
  { icon: RefreshCw, step: "04", title: "Track", text: "Re-assess, watch readiness grow, and see recommendations update." }
];

const FEATURES = [
  { icon: FileSearch, title: "AI Resume Analysis", text: "Upload your resume — extract skills, education and projects with confidence scoring, then confirm before it updates your profile." },
  { icon: Target, title: "Skill-Gap Engine", text: "Exact gaps for your target role, prioritized by placement impact — with plain-English reasons why each skill matters." },
  { icon: LineChart, title: "Placement Readiness Score", text: "One number, seven components. Track improvement after every assessment cycle." },
  { icon: ClipboardList, title: "Assessment Studio", text: "Technical, coding, aptitude, communication and role-specific tests with instant evaluation and skill mapping." },
  { icon: BookOpen, title: "Personalized Roadmap", text: "A week-by-week preparation plan generated from your real gaps — not generic advice." },
  { icon: MessageSquareText, title: "AI Career Coach", text: "Ask questions in plain language. The coach answers from your live profile, gaps and progress." }
];

const STUDENT_BENEFITS = [
  "Know exactly which skills to improve and why",
  "Watch your readiness score move after every assessment",
  "Follow a roadmap built from your real gaps",
  "Get matched to roles that actually fit you",
  "Practice interviews with structured feedback"
];

const FACULTY_BENEFITS = [
  "See common batch-level skill deficiencies at a glance",
  "Filter students by readiness, department, batch and role",
  "Identify students who need intervention early",
  "Track roadmap completion and assessment participation",
  "Export placement-readiness reports"
];

const INSTITUTION_BENEFITS = [
  "A single data-driven view of placement readiness",
  "Measure the effectiveness of preparation programs",
  "Scale targeted interventions across batches and departments",
  "Institution-wide analytics with event tracking",
  "Role-based dashboards for every stakeholder"
];

const ROLES = ["Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Analyst", "Data Scientist", "AI/ML Engineer", "Cybersecurity Analyst", "Cloud Engineer", "DevOps Engineer", "QA Engineer", "Business Analyst", "Network Engineer", "Mobile App Developer"];

const TESTIMONIALS = [
  { name: "Aarav S.", role: "CSE 2026 · Target: Software Developer", quote: "I knew I was 'weak at DSA' but CareerLens showed me it was a 45-point critical gap for my target role — and gave me a week-by-week plan. Three months later my readiness went from 58% to 81%.", initials: "AS" },
  { name: "Prof. Ramesh I.", role: "Placement Coordinator", quote: "For the first time I can see the batch's common gaps in one dashboard. We redesigned our training weeks around the data and assessment participation jumped.", initials: "RI" },
  { name: "Priya P.", role: "IT 2027 · Target: Data Analyst", quote: "The AI coach answers with my actual numbers. 'Why is my readiness low?' pointed straight at my aptitude component, and the roadmap fixed it.", initials: "PP" }
];

const FAQS = [
  { q: "How does CareerLens calculate my skill gaps?", a: "We compare your skill scores (from your self-reported profile, resume extraction and assessment results) against the requirements of your target role. Each gap is classified as Strong, Improve, Major or Critical, then prioritized by gap size, role weight and placement impact." },
  { q: "What is the Placement Readiness Score?", a: "A 0–100 composite of seven components: Technical Skills, Coding, Aptitude, Communication, Interview, Projects and Resume. Weights are configurable by your institution. The score is snapshotted after every analysis so you can see improvement over time." },
  { q: "Is the AI Career Coach powered by a real AI model?", a: "Yes — when an AI provider is configured, the coach answers from your live profile using an LLM. Without a provider, a deterministic engine generates the same categories of answers from your real data, so the product never breaks." },
  { q: "Do assessments really update my skill profile?", a: "Every question is mapped to one or more skills. When you submit, your performance on those skills is blended into your skill scores, and gaps, readiness, role matches and your roadmap are all recomputed automatically." },
  { q: "Can faculty see individual student data?", a: "Faculty see students in their assigned departments/batches. Each student view includes readiness, gaps, assessment history, roadmap progress and a place for faculty notes. Students can never see another student's data." },
  { q: "What does it cost to run?", a: "The application runs on free tiers: Vercel/Netlify for hosting, Supabase/Neon Postgres for the database, and an optional AI API key (the app works fully without it)." }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Workflow />
      <Problem />
      <Solution />
      <CoreIntelligence />
      <Features />
      <RoleMatching />
      <Coach />
      <Benefits />
      <Testimonials />
      <Faq />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/85 backdrop-blur-md no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="CareerLens AI" className="h-9 w-auto" />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-600 md:flex">
          <a href="#workflow" className="hover:text-ink-900">How it works</a>
          <a href="#intelligence" className="hover:text-ink-900">Core intelligence</a>
          <a href="#features" className="hover:text-ink-900">Features</a>
          <a href="#benefits" className="hover:text-ink-900">Benefits</a>
          <a href="#faq" className="hover:text-ink-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100">Sign in</Link>
          <Link href="/signup" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700">Get Started</Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="gradient-hero relative overflow-hidden text-white">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-brand-100 backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              KAIROTHON 2026 · AI / EDUCATION
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Know your gap.<br />
              Build your skill.<br />
              <span className="text-gradient">Get placement-ready.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-300 sm:text-base">
              CareerLens AI is an AI-powered skill-gap analysis and placement readiness ecosystem.
              One connected loop — <span className="font-semibold text-white">Assess → Analyze → Recommend → Track</span> —
              turns scattered student data into targeted placement preparation.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="#workflow" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10">
                Explore CareerLens
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-400">
              {["Skill-gap analysis", "Personalized roadmaps", "AI career coach", "Batch analytics"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
                </span>
              ))}
            </div>
          </div>
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const gaps = [
    { skill: "Python", current: 80, required: 75, status: "Strong", color: "bg-emerald-400" },
    { skill: "SQL", current: 45, required: 80, status: "Major Gap", color: "bg-amber-400" },
    { skill: "DSA", current: 40, required: 85, status: "Critical", color: "bg-rose-400" },
    { skill: "DBMS", current: 60, required: 75, status: "Improve", color: "bg-sky-400" },
    { skill: "Communication", current: 70, required: 75, status: "Improve", color: "bg-sky-400" }
  ];
  return (
    <div className="relative">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-pop backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Skill-Gap Analysis</p>
            <p className="text-xs text-slate-400">Target: Software Developer</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 px-3.5 py-2 text-center">
            <p className="font-display text-xl font-bold leading-none text-white">78%</p>
            <p className="mt-0.5 text-[10px] font-medium text-brand-100">Ready</p>
          </div>
        </div>
        <div className="mt-5 space-y-3.5">
          {gaps.map((g) => (
            <div key={g.skill}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{g.skill}</span>
                <span className="text-slate-400">{g.current}% / {g.required}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-violet-400" style={{ width: `${g.current}%` }} />
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${g.status === "Strong" ? "bg-emerald-500/20 text-emerald-300" : g.status === "Critical" ? "bg-rose-500/20 text-rose-300" : g.status === "Major Gap" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"}`}>
                  {g.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200">
          <span className="font-semibold">AI insight:</span> Closing the DSA gap (+45 pts) has the highest placement impact — your roadmap starts there.
        </div>
      </div>
      <div className="absolute -left-6 -top-5 hidden rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-pop backdrop-blur sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">AI Career Coach</p>
        <p className="mt-1 text-xs text-slate-200">“What should I learn next?”</p>
        <p className="mt-1 text-xs font-medium text-brand-300">→ Start with DSA — your #1 priority gap.</p>
      </div>
    </div>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading kicker="The Loop" title="One connected ecosystem" subtitle="CareerLens doesn't stop at identifying a gap — it converts every gap into a personalized action plan and re-assesses progress." />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WORKFLOW.map((w, i) => (
          <div key={w.step} className="card card-hover relative p-6">
            <span className="absolute right-5 top-5 font-display text-4xl font-bold text-ink-100">{w.step}</span>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <w.icon className="h-5.5 w-5.5" />
            </div>
            <h3 className="mt-4 text-[15px] font-bold text-ink-900">{w.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{w.text}</p>
            {i < WORKFLOW.length - 1 && (
              <ArrowRight className="absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-ink-300 lg:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="bg-ink-50/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="The Problem" title="Students prepare hard — but often without knowing what to improve first" dark />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, title: "Generic preparation", text: "The same resources and plans are used for completely different target roles." },
            { icon: Target, title: "Unknown skill gaps", text: "Students don't know which skills are weak — or which ones matter most for their goal." },
            { icon: FileSearch, title: "Scattered data", text: "Resume, coding, aptitude and communication results stay disconnected across tools." },
            { icon: Users, title: "Limited faculty insight", text: "Coordinators lack a clear batch-level view of deficiencies to design interventions." }
          ].map((p) => (
            <div key={p.title} className="card p-6">
              <p.icon className="h-6 w-6 text-rose-500" />
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading kicker="The Solution" title="What CareerLens tells each student" subtitle="A single system that tells every student what to learn, why it matters, and what to do next." />
      <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: Target, title: "Exact gaps, explained", text: "Current vs required scores for every skill in your target role — with a plain-English 'why this matters for placement' for each." },
            { icon: Brain, title: "Prioritized recommendations", text: "Gaps ranked by size, role weight and placement impact. Your dashboard always points at the single most valuable next action." },
            { icon: BookOpen, title: "A plan you can follow", text: "Weekly roadmap items with objectives, tasks, resources, time estimates and linked assessments." },
            { icon: RefreshCw, title: "A loop that updates itself", text: "Re-assess → skill scores update → gaps, readiness, role matches and roadmap all recompute. No stale advice." }
          ].map((s) => (
            <div key={s.title} className="flex gap-4 rounded-2xl border border-ink-200/80 bg-white p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-ink-900">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-ink-950 p-6 text-white">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-brand-400" />
            <p className="text-sm font-semibold">The adaptive learning loop</p>
          </div>
          <div className="mt-5 space-y-2.5 text-sm">
            {["Student data (profile · resume · assessments)", "Assessment → analyze performance → detect weak areas", "Generate personalized recommendations", "Practice & learn on a weekly roadmap", "Re-assess → updated skill profile", "Updated placement readiness → better role match"].map((step, i) => (
              <div key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 font-display text-xs font-bold text-brand-300">{i + 1}</span>
                <span className="text-[13px] text-slate-200">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreIntelligence() {
  const rows = [
    { skill: "Python", current: "80%", required: "75%", gap: "—", status: "Strong", dot: "bg-emerald-500", text: "text-emerald-600" },
    { skill: "SQL", current: "45%", required: "80%", gap: "35%", status: "Major Gap", dot: "bg-amber-500", text: "text-amber-600" },
    { skill: "DSA", current: "40%", required: "85%", gap: "45%", status: "Critical Gap", dot: "bg-rose-500", text: "text-rose-600" },
    { skill: "DBMS", current: "60%", required: "75%", gap: "15%", status: "Improve", dot: "bg-sky-500", text: "text-sky-600" },
    { skill: "Communication", current: "70%", required: "75%", gap: "5%", status: "Improve", dot: "bg-sky-500", text: "text-sky-600" }
  ];
  const components = [
    ["Technical Skills", "82%", "bg-brand-500"],
    ["Coding", "76%", "bg-violet-500"],
    ["Aptitude", "68%", "bg-amber-500"],
    ["Communication", "80%", "bg-sky-500"],
    ["Interview", "60%", "bg-rose-500"]
  ];
  return (
    <section id="intelligence" className="bg-ink-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Core Intelligence" title="From skill profile to placement readiness" subtitle="The exact comparison engine behind every dashboard." dark />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Skill vs. requirement — Software Developer</p>
              <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300">live engine</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Skill</th>
                    <th className="py-2.5 pr-4 font-semibold">Current</th>
                    <th className="py-2.5 pr-4 font-semibold">Required</th>
                    <th className="py-2.5 pr-4 font-semibold">Gap</th>
                    <th className="py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.skill} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{r.skill}</td>
                      <td className="py-3 pr-4 text-slate-300">{r.current}</td>
                      <td className="py-3 pr-4 text-slate-300">{r.required}</td>
                      <td className={`py-3 pr-4 font-semibold ${r.gap === "—" ? "text-slate-500" : "text-rose-300"}`}>{r.gap}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${r.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} /> {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 rounded-xl bg-brand-500/10 p-3 text-xs leading-relaxed text-brand-100">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />
              AI identifies what to improve first — then turns it into action.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Placement Readiness</p>
              <p className="mt-2 font-display text-6xl font-bold text-gradient">78%</p>
              <p className="mt-1 text-xs text-slate-400">Overall</p>
            </div>
            <div className="flex-1 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              {components.map(([name, value, color]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-300">{name}</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading kicker="Platform" title="Everything you need to get placement-ready" subtitle="A complete AI placement preparation suite for students, faculty and institutions." />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card card-hover p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-[15px] font-bold text-ink-900">{f.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoleMatching() {
  return (
    <section className="bg-ink-50/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Role Matching" title="Which roles fit you best — and why" subtitle="Every role is scored against your real skill profile, with the exact missing skills for each." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            { role: "Software Developer", fit: 82, missing: "DSA · SQL", strong: "Python · Problem Solving", color: "from-brand-500 to-violet-500" },
            { role: "Data Analyst", fit: 76, missing: "Statistics · Visualization", strong: "SQL · Excel", color: "from-sky-500 to-cyan-500" },
            { role: "Cybersecurity Analyst", fit: 71, missing: "Network Security", strong: "Linux · Python", color: "from-amber-500 to-orange-500" }
          ].map((m) => (
            <div key={m.role} className="card card-hover p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} text-white`}>
                  <Target className="h-5 w-5" />
                </div>
                <span className="font-display text-2xl font-bold text-ink-900">{m.fit}%</span>
              </div>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">{m.role}</h3>
              <div className="mt-3 space-y-1.5 text-xs">
                <p className="text-ink-500"><span className="font-semibold text-emerald-600">Strengths:</span> {m.strong}</p>
                <p className="text-ink-500"><span className="font-semibold text-rose-600">Missing:</span> {m.missing}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Coach() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading kicker="AI Career Coach" title="Ask. Get answers from your real profile." subtitle="The coach reads your live skill scores, gaps, readiness and roadmap — then answers with specifics, not generic advice." align="left" />
          <div className="mt-6 space-y-3">
            {["“What should I learn next?” — answered from your #1 priority gap", "“Why is my readiness score low?” — the weakest component, explained", "“How can I improve DSA?” — a focused plan with your real numbers", "“Give me interview questions.” — tailored to your target role"].map((q) => (
              <div key={q} className="flex items-start gap-2.5 text-[13px] text-ink-600">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                {q}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2.5 border-b border-ink-100 pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">Career Coach</p>
              <p className="text-[11px] text-emerald-600">● Online · using your live profile</p>
            </div>
          </div>
          <div className="space-y-3 py-4">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-100 px-3.5 py-2.5 text-[13px] text-ink-800">Why is my readiness score low?</div>
            <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
              Your overall readiness is 64%. The weakest component is <b>Aptitude at 53%</b>. Coding is close behind at 53%, dragged down by the DSA gap (40% vs 85% needed). Start with your roadmap's DSA module, then take the DSA Fundamentals Test — I'll update your numbers as soon as you do. 🎯
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-ink-100 pt-3">
            <div className="flex-1 rounded-xl border border-ink-300 px-3.5 py-2 text-[13px] text-ink-400">Ask your career question…</div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><ArrowRight className="h-4 w-4" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section id="benefits" className="bg-ink-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="For Everyone" title="Built for students, faculty and institutions" dark />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {[
            { icon: GraduationCap, title: "Students", items: STUDENT_BENEFITS, accent: "text-sky-400" },
            { icon: Users, title: "Faculty & Coordinators", items: FACULTY_BENEFITS, accent: "text-emerald-400" },
            { icon: Building2, title: "Institutions", items: INSTITUTION_BENEFITS, accent: "text-amber-400" }
          ].map((b) => (
            <div key={b.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <b.icon className={`h-6 w-6 ${b.accent}`} />
                <h3 className="text-[16px] font-bold">{b.title}</h3>
              </div>
              <ul className="mt-5 space-y-2.5">
                {b.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading kicker="Impact" title="The transformation is visible" subtitle="Skill gap → targeted practice → re-assessment → placement ready." />
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="card card-hover p-6">
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-600">“{t.quote}”</p>
            <div className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-bold text-white">{t.initials}</div>
              <div>
                <p className="text-[13px] font-semibold text-ink-900">{t.name}</p>
                <p className="text-[11px] text-ink-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-2xl bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 p-8 text-center text-white sm:p-10">
        <Rocket className="mx-auto h-8 w-8" />
        <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">From skill gap to placement ready</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/85">Your AI career coach for a better tomorrow. Join the students, faculty and institutions already closing their gaps with data.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-lg hover:bg-ink-50">Get Started Free</Link>
          <Link href="/login" className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20">Sign in</Link>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionHeading kicker="FAQ" title="Frequently asked questions" />
      <div className="mt-10 space-y-3">
        {FAQS.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50/60 py-12 no-print">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs text-center md:text-left">
            <Link href="/" className="flex items-center justify-center md:justify-start">
              <img src="/logo.svg" alt="CareerLens AI" className="h-9 w-auto" />
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-500">AI-based skill-gap analysis & placement readiness ecosystem. Know your gap. Build your skill. Get placement-ready.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            {[
              { title: "Product", links: [["How it works", "#workflow"], ["Core intelligence", "#intelligence"], ["Features", "#features"], ["Role matching", "#benefits"]] },
              { title: "For", links: [["Students", "#benefits"], ["Faculty", "#benefits"], ["Institutions", "#benefits"], ["AI Coach", "#faq"]] },
              { title: "Company", links: [["Get Started", "/signup"], ["Sign in", "/login"], ["FAQ", "#faq"]] }
            ].map((col) => (
              <div key={col.title}>
                <p className="font-semibold text-ink-900">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={label}><a href={href} className="text-ink-500 hover:text-brand-600">{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-ink-200 pt-6 text-xs text-ink-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} CareerLens AI · KAIROTHON 2026</p>
          <p className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-brand-500" /> Assess → Analyze → Recommend → Track</p>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({ kicker, title, subtitle, dark, align = "center" }: { kicker: string; title: string; subtitle?: string; dark?: boolean; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? "text-brand-400" : "text-brand-600"}`}>{kicker}</p>
      <h2 className={`mt-2 font-display text-3xl font-bold sm:text-[2.1rem] sm:leading-tight ${dark ? "text-white" : "text-ink-900"}`}>{title}</h2>
      {subtitle && <p className={`mt-3 text-[15px] leading-relaxed ${dark ? "text-slate-400" : "text-ink-500"}`}>{subtitle}</p>}
    </div>
  );
}
