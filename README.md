# CareerLens AI

**AI-Powered Skill-Gap Analysis & Placement Readiness Ecosystem**

CareerLens AI takes a student through the full placement-readiness loop —
**ASSESS → ANALYZE → RECOMMEND → TRACK → RE-ASSESS → PLACEMENT READY** — and
gives faculty and administrators institution-wide visibility.

Built for **KAIROTHON 2026** as a production-grade, full-stack SaaS product
(not a UI prototype): real authentication, a persistent database, role-based
dashboards, deterministic skill-gap engines, an adaptive learning loop, and an
AI Career Coach with a deterministic fallback so the app works with **zero
external API keys**.

---

## ✨ Features

### Students
- **Onboarding wizard** — profile, target role, self-assessed skills, projects
- **Skill Fingerprint** — a living snapshot of every skill with self-reported,
  assessment, and resume-derived scores
- **Skill-Gap Engine** — per-role gap analysis with `STRONG / IMPROVE /
  MAJOR_GAP / CRITICAL_GAP` statuses, priority (1–10), and placement impact
  explanations
- **Placement Readiness Score** — weighted composite of technical, coding,
  aptitude, communication, interview, projects, and resume components
- **Assessments** — timed coding/aptitude/communication assessments with
  auto-evaluation, per-skill mapping, and retake support
- **Personalized Roadmap** — 6-week adaptive plan generated from your gaps;
  check off tasks and the analysis re-computes itself
- **AI Career Coach** — chat about careers, gaps, and interview prep
- **Role Matching** — ranked fit scores against the full role catalog
- **Resume Analysis** — upload PDF/DOCX, extract skills, and fold them into
  your fingerprint
- **Interview Prep** — real interview questions with reveal-answer mode
- **Reports** — printable placement-readiness report (PDF/print)

### Faculty
- **Dashboard** — batch-level readiness, at-risk students, top gaps
- **Students** — filterable roster with search and readiness sort
- **Intervention view** — drill into one student's gaps, roadmap, and history,
  and leave private coaching notes
- **Batch Analytics** — readiness distribution, common gaps, assessment stats
- **Reports** — generate a report for any student

### Admin
- **Users** — manage roles, disable accounts
- **Departments & Batches** — institution structure
- **Roles & Requirements** — the skill requirements that drive the gap engine
- **Skills, Assessments & Questions** — full CRUD question banks
- **Learning Resources** — content the roadmap links to
- **Analytics** — platform-wide engagement and readiness overview
- **Settings** — tune readiness weights live
- **Audit log** — every admin mutation is recorded

---

## 🧱 Tech Stack

| Layer      | Choice                                              |
|------------|-----------------------------------------------------|
| Framework  | Next.js 15 (App Router, React 19, TypeScript)       |
| Database   | Prisma 6 + SQLite (dev) / PostgreSQL (production)   |
| Auth       | JWT (jose) in httpOnly cookies, bcrypt, CSRF check, rate limiting |
| Styling    | Tailwind CSS v4                                      |
| Charts     | Recharts                                             |
| Validation | Zod                                                  |
| AI         | OpenAI-compatible chat API with deterministic fallback |
| Tests      | Vitest (unit + integration), Playwright (E2E)        |
| Resume     | pdfjs-dist + mammoth (client-side extraction)        |

---

## 🚀 Quick Start

```bash
npm install
cp .env.example .env        # defaults work out of the box (SQLite)

npm run db:setup            # push schema + seed demo data
npm run dev                 # http://localhost:3001
```

### Demo accounts

| Role    | Email                 | Password          |
|---------|-----------------------|-------------------|
| Student | `student@careerlens.ai` | `CareerLens@2026` |
| Faculty | `faculty@careerlens.ai` | `CareerLens@2026` |
| Admin   | `admin@careerlens.ai`   | `CareerLens@2026` |

The seed creates **24+ realistic students** across departments and batches
with varied readiness, plus assessments, questions, resources, role
requirements, conversations, and notifications — so every dashboard is alive
on first login.

---

## 🔁 The Adaptive Loop

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
│   Role Matching (fit scores across catalog)
│         │
│         ▼
│   Personalized 6-week Roadmap (tasks + resources)
│         │
│         ▼
│   Student completes tasks / takes assessments
│         │
└─────────┴──► scores blend into skill profile → re-compute gaps → loop
```

Every `submitAssessment`, roadmap task toggle, resume apply, and profile
update triggers `recomputeAnalysis()`, which persists new `SkillGap`,
`ReadinessSnapshot`, and `RoleMatch` rows — giving faculty trend data for
free.

---

## 📁 Architecture

```
src/
├─ engines/          Pure, testable logic (gap, readiness, matching, roadmap)
├─ services/         DB-touching business logic (analysis, assessment, coach, …)
├─ lib/              Prisma client, auth/JWT, security, catalog, utils, AI
├─ app/api/          49 REST endpoints (auth, student, faculty, admin)
└─ app/              Pages: landing, auth, onboarding, student/*, faculty/*, admin/*
prisma/
├─ schema.prisma     35 models
└─ seed.ts           24+ demo students + question banks + resources
tests/
├─ unit/             engine + validation tests
└─ integration/      full adaptive loop against a fresh test DB
```

The analysis engines are **pure functions** — no I/O — so the math is fully
unit-tested, while the integration suite spins up a throwaway SQLite DB and
exercises the real service layer end to end.

---

## 🧪 Testing

```bash
npm test                    # 50 unit + integration tests
npm run typecheck           # tsc --noEmit
npm run test:e2e            # Playwright (requires dev server)
```

The integration suite is self-contained: it creates a random test database,
pushes the schema, seeds fixtures, and deletes itself afterwards — it never
touches your dev data.

---

## ☁️ Deployment

### Option A — Docker (single container, SQLite volume)

```bash
docker compose up --build
# → http://localhost:3001
```

### Option B — Vercel + PostgreSQL (recommended for production)

1. Create a Postgres database (Supabase/Neon).
2. Import this repo into Vercel.
3. Set the env vars from `.env.example` (`DATABASE_URL` → Postgres,
   `AUTH_SECRET` → 32+ char random string).
4. Run `npx prisma db push && npx prisma db seed` locally against the prod
   DB (or in a one-off build step) — then deploy.

### Option C — Node server (PM2 / systemd)

```bash
npm run build
NODE_ENV=production npm run start -- -p 3001
```

### Important production notes

- **Set `AUTH_SECRET`** — sessions are signed JWTs; a leaked secret lets
  anyone forge a session.
- **Use PostgreSQL** — SQLite is perfect for demo/dev; Postgres handles
  concurrent faculty/admin traffic.
- **AI keys are optional** — without `AI_API_KEY` the coach and resume
  insights fall back to a deterministic engine, so the product is fully
  functional offline.
- **Reset links** are logged to the server console in dev (no email
  provider required for the demo).

---

## 🔐 Security

- Passwords hashed with **bcrypt** (cost 10)
- Sessions: httpOnly, SameSite=Lax JWT cookies, server-verified
- **CSRF origin/referer check** on every mutation endpoint
- **Rate limiting** on auth endpoints (per IP)
- Role-guarded pages *and* API routes (`requireRole`)
- Admin mutations write to the **audit log**
- `.env` never committed; `.env.example` documents every variable

---

## 📜 License

Built for KAIROTHON 2026. Educational/demo use.
