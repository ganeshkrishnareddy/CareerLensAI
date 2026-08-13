<p align="center">
  <img src="public/logo.svg" alt="CareerLens AI" width="340" />
</p>

<p align="center">
  <strong>AI-Powered Skill-Gap Analysis &amp; Placement Readiness Ecosystem</strong><br/>
  <em>Assess → Analyze → Recommend → Track → Re-assess → Placement Ready</em>
</p>

<p align="center">
  <img alt="Framework" src="https://img.shields.io/badge/Next.js%2015-000000?logo=nextdotjs&logoColor=white" />
  <img alt="Database" src="https://img.shields.io/badge/Prisma%206-SQLite%20%2F%20PostgreSQL-2D3748" />
  <img alt="Auth" src="https://img.shields.io/badge/Auth-JWT%20%2B%20httpOnly%20Cookies-6366f1" />
  <img alt="AI" src="https://img.shields.io/badge/AI-OpenAI--compatible%20%2F%20deterministic%20fallback-8b5cf6" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-50%20passing-22c55e" />
  <img alt="License" src="https://img.shields.io/badge/license-Educational%20%2F%20Demo-64748b" />
  <img alt="KAIROTHON 2026" src="https://img.shields.io/badge/KAIROTHON%202026-submission-ec4899" />
</p>

---

## Table of Contents

- [Product Overview](#-product-overview)
- [Key Capabilities](#-key-capabilities)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Demo Accounts](#-demo-accounts)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [Future Roadmap](#-future-roadmap)
- [License](#-license)

---

## 👋 Product Overview

CareerLens AI is a **production-grade, full-stack SaaS platform** that turns a
student's scattered preparation data — skills, assessments, resume, projects —
into a single, intelligent placement-readiness loop. It is not a UI prototype:
it ships with real authentication, a persistent database, role-based
dashboards, deterministic analysis engines, an adaptive learning loop, and an
AI Career Coach that works **with or without external API keys**.

Built for **KAIROTHON 2026**, the platform serves three audiences:

| Audience        | What they get                                                          |
|-----------------|------------------------------------------------------------------------|
| **Students**    | A clear answer to *"what should I learn next, and why?"* — with a personalized plan that updates itself |
| **Faculty**     | Batch-level visibility into readiness, common gaps, and who needs intervention |
| **Institutions**| Data-driven analytics to measure and scale preparation programs        |

---

## ✨ Key Capabilities

### Students
- **Onboarding wizard** — profile, target role, self-assessed skills, projects
- **Skill Fingerprint** — a living snapshot of every skill, blending
  self-reported, assessment, and resume-derived scores
- **Skill-Gap Engine** — per-role gap analysis with `STRONG / IMPROVE /
  MAJOR_GAP / CRITICAL_GAP` statuses, a 1–10 priority, and plain-English
  placement-impact explanations for every gap
- **Placement Readiness Score** — a weighted composite of technical, coding,
  aptitude, communication, interview, projects, and resume components
- **Assessment Studio** — timed technical, coding, aptitude, communication,
  and role-specific tests with instant auto-evaluation, per-skill mapping,
  and **retake support**
- **Personalized Roadmap** — a week-by-week plan generated from your *real*
  gaps, with tasks, resources, time estimates, and linked assessments
- **AI Career Coach** — ask questions in plain language; answers cite your
  live scores, gaps, and progress
- **Role Matching** — ranked fit scores against the full role catalog, with
  exact missing skills per role
- **Resume Analysis** — upload PDF/DOCX and extract skills with confidence
  scoring before they update your profile
- **Interview Prep** — real interview questions with reveal-answer mode
- **Reports** — printable placement-readiness report

### Faculty & Coordinators
- **Dashboard** — batch-level readiness, at-risk students, top gaps
- **Student roster** — searchable, filterable by readiness / department /
  batch / role
- **Intervention view** — drill into one student's gaps, roadmap, and
  history, and leave private coaching notes
- **Batch analytics** — readiness distributions, common gaps, role-wise and
  department-wise readiness
- **Reports** — generate a placement-readiness report for any student

### Administrators
- **Users** — manage roles and account status
- **Departments & batches** — institution structure
- **Roles & requirements** — the skill requirements that drive the gap engine
- **Skills, assessments & questions** — full CRUD question banks
- **Learning resources** — the content roadmaps link to
- **Analytics** — platform-wide engagement and readiness overview
- **Settings** — tune readiness weights live
- **Audit log** — every admin mutation is recorded

---

## 🔁 How It Works

The product is built around one adaptive loop:

```
Student self-reports skills (onboarding / fingerprint)
        │
        ▼
┌─ Skill-Gap Engine ──► gaps + priorities + impact
│         │
│         ▼
│   Placement Readiness Score  ◄── assessments, projects, resume
│         │
│         ▼
│   Role Matching (fit scores across the catalog)
│         │
│         ▼
│   Personalized roadmap (tasks + resources + assessments)
│         │
│         ▼
│   Student completes tasks / takes assessments
│         │
└─────────┴──► scores blend into the skill profile → re-compute → loop
```

Every assessment submission, roadmap task toggle, resume apply, and profile
update triggers `recomputeAnalysis()`, which persists fresh `SkillGap`,
`ReadinessSnapshot`, and `RoleMatch` rows — so dashboards and faculty trend
data are never stale.

---

## 🧱 Tech Stack

| Layer      | Choice                                                            |
|------------|-------------------------------------------------------------------|
| Framework  | Next.js 15 (App Router, React 19, TypeScript)                     |
| Database   | Prisma 6 — SQLite (dev) / PostgreSQL (production)                 |
| Auth       | JWT (jose) in httpOnly cookies · bcrypt · CSRF check · rate limits|
| Styling    | Tailwind CSS v4                                                   |
| Charts     | Recharts                                                          |
| Validation | Zod                                                               |
| AI         | OpenAI-compatible chat API with deterministic fallback            |
| Testing    | Vitest (unit + integration) · Playwright (E2E)                    |
| Resume     | pdfjs-dist + mammoth (client-side extraction)                     |
| Deploy     | Vercel · Docker · Node (PM2 / systemd)                            |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18.18+** (20 LTS recommended)
- **npm** 9+

### 1. Install & configure

```bash
npm install
cp .env.example .env        # defaults work out of the box (SQLite)
```

### 2. Set up the database

```bash
npm run db:setup            # pushes the schema and seeds demo data
```

### 3. Run the app

```bash
npm run dev                 # http://localhost:3001
```

> Port note: the dev server runs on **3001** by default to avoid conflicts
> with other local apps. Change it in `package.json` if needed.

---

## 👤 Demo Accounts

The login page **auto-fills** credentials — pick a role and press **Sign in**.

| Role    | Email                 | Password          |
|---------|-----------------------|-------------------|
| Student | `student@careerlens.ai` | `CareerLens@2026` |
| Faculty | `faculty@careerlens.ai` | `CareerLens@2026` |
| Admin   | `admin@careerlens.ai`   | `CareerLens@2026` |

The seed creates **24+ realistic students** across departments and batches
with varied readiness levels, plus question banks, learning resources, role
requirements, coach conversations, and notifications — every dashboard is
alive on first login.

---

## 📁 Project Structure

```
src/
├─ engines/          Pure, testable logic (gap, readiness, matching, roadmap)
├─ services/         Database-touching business logic (analysis, assessment, coach, …)
├─ lib/              Prisma client, auth/JWT, security, catalog, utils, AI
├─ app/api/          49 REST endpoints (auth, student, faculty, admin)
└─ app/              Pages: landing, auth, onboarding, student/*, faculty/*, admin/*
prisma/
├─ schema.prisma     35 models
└─ seed.ts           24+ demo students + question banks + resources
tests/
├─ unit/             Engine + validation tests
└─ integration/      Full adaptive loop against a fresh test DB
```

### Design notes

- **The analysis engines are pure functions** — no I/O — so the math is
  fully unit-testable.
- **The integration suite is self-contained** — it creates a random throwaway
  SQLite database, pushes the schema, seeds fixtures, runs the real service
  layer end to end, and deletes itself. It never touches your dev data.
- **AI is optional** — without `AI_API_KEY`, the coach and resume insights
  fall back to a deterministic engine, keeping the product fully functional
  with zero external dependencies.

---

## 🧪 Testing

```bash
npm test                    # 50 unit + integration tests
npm run typecheck           # tsc --noEmit
npm run test:e2e            # Playwright (requires a running dev server)
```

| Suite        | Covers                                                    |
|--------------|-----------------------------------------------------------|
| Unit         | Gap engine, readiness math, role matching, roadmap generation, validation |
| Integration  | Auth primitives, password reset flow, the full adaptive loop (analysis → gaps → readiness → roadmap), assessment scoring + skill mapping + retakes |

---

## ☁️ Deployment

### Option A — Vercel + PostgreSQL (recommended)

1. Create a PostgreSQL database (e.g. [Neon](https://neon.tech) or
   [Supabase](https://supabase.com)).
2. Import `github.com/ganeshkrishnareddy/CareerLensAI` into Vercel.
3. Set the environment variables from [.env.example](.env.example) —
   at minimum `DATABASE_URL` (Postgres) and `AUTH_SECRET`.
4. Push the schema and seed the production database once (run locally, with
   `DATABASE_URL` pointing at the Postgres URL):
   ```bash
   DATABASE_URL="postgresql://…" npm run db:prod
   ```
5. Deploy. `vercel.json` and the `build` script handle the rest
   (`prisma generate` runs automatically before `next build`).

> **If the app loads but sign-in returns “Something went wrong. Please try
> again.”** the database is not configured on Vercel. Set `DATABASE_URL` to a
> Postgres URL (SQLite cannot persist on serverless) and `AUTH_SECRET`, then
> run step 4 and redeploy. The exact error is logged server-side as
> `login error: …` in Vercel → Runtime Logs.

### Option B — Docker (single container)

```bash
docker compose up --build
# → http://localhost:3001
```

The entrypoint applies the schema on first boot and stores the SQLite
database on a persistent volume.

### Option C — Node server (PM2 / systemd)

```bash
npm run build
NODE_ENV=production npm run start -- -p 3001
```

### Production checklist

- [ ] Set a strong `AUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Use **PostgreSQL**, not SQLite, for production traffic
- [ ] Set `NEXT_PUBLIC_APP_URL` to the deployed origin
- [ ] Add `AI_API_KEY` if you want LLM-powered coach answers
- [ ] (Optional) Replace the console-logged password-reset links with a real
      email provider

---

## 🔐 Environment Variables

| Variable               | Required | Default                              | Description                                  |
|------------------------|----------|--------------------------------------|----------------------------------------------|
| `NEXT_PUBLIC_APP_URL`  | prod     | `http://localhost:3001`              | Public app origin (used for reset links/OG)  |
| `DATABASE_URL`         | yes      | SQLite `file:./careerlens.db`        | Database connection string                   |
| `AUTH_SECRET`          | prod     | dev fallback                         | 32+ char secret signing session JWTs         |
| `SESSION_TTL_SECONDS`  | no       | `604800` (7 days)                    | Session lifetime                             |
| `AI_API_KEY`           | no       | —                                    | OpenAI-compatible key (coach/resume AI)      |
| `AI_BASE_URL`          | no       | `https://api.openai.com/v1`          | Compatible endpoint (OpenRouter, Groq, …)    |
| `AI_MODEL`             | no       | `gpt-4o-mini`                        | Model name                                   |
| `RESUME_UPLOAD_DIR`    | no       | `./uploads`                          | Resume file storage                          |
| `MAX_UPLOAD_BYTES`     | no       | `5242880` (5 MB)                     | Max resume upload size                       |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | no | `20` / `60000`        | Auth endpoint rate limiting                  |

---

## 🔐 Security

- Passwords hashed with **bcrypt** (cost 10)
- Sessions: **httpOnly, SameSite=Lax** JWT cookies, verified server-side
- **CSRF origin/referer check** on every mutation endpoint
- **Rate limiting** on auth endpoints (per IP)
- Role-guarded pages **and** API routes (`requireRole`)
- Admin mutations written to the **audit log**
- Secrets never committed — `.env` is gitignored; `.env.example` documents
  every variable

---

## 🗺️ Future Roadmap

- [ ] Real email delivery for password resets and notifications
- [ ] LLM-powered resume parsing and gap explanations (with graceful fallback)
- [ ] Gamified streak and milestone system
- [ ] Company-specific mock interview rounds
- [ ] Multi-institution SSO (OIDC / SAML)
- [ ] Weekly cohort reports delivered to coordinators

---

## 🤝 Contributing

This is a KAIROTHON 2026 submission, but contributions are welcome. Open an
issue or pull request on [GitHub](https://github.com/ganeshkrishnareddy/CareerLensAI).

---

## 📄 License

Released for educational and demo use as part of KAIROTHON 2026.

---

<p align="center">
  <strong>Know your gap. Build your skill. Get placement-ready.</strong><br/>
  © 2026 CareerLens AI · KAIROTHON 2026
</p>
