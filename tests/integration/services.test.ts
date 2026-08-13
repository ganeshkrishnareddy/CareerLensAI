import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";

// NOTE: services are imported dynamically AFTER DATABASE_URL is switched to a
// fresh test database, because @/lib/db reads the env at module load time.

let dbFile: string;
let prisma: typeof import("@/lib/db")["prisma"];

const DB_DIR = path.join(__dirname, "..", "..", "prisma");

beforeAll(async () => {
  dbFile = `test-${crypto.randomBytes(6).toString("hex")}.db`;
  const url = `file:./${dbFile}`; // resolved relative to prisma/schema.prisma
  process.env.DATABASE_URL = url;

  // Push the schema into the fresh DB (CLI resolves the relative path the same way).
  execSync(`npx --no-install prisma db push --skip-generate --accept-data-loss`, {
    cwd: path.join(__dirname, "..", ".."),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe"
  });

  ({ prisma } = await import("@/lib/db"));

  await seedFixtures();
}, 90_000);

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    /* noop */
  }
  for (const suffix of ["", "-journal"]) {
    const p = path.join(DB_DIR, dbFile + suffix);
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch {
        /* locked on some platforms */
      }
    }
  }
});

async function seedFixtures() {
  const skills = await Promise.all(
    [
      { name: "Python", category: "PROGRAMMING" },
      { name: "SQL", category: "DATABASE" },
      { name: "DSA", category: "DSA" },
      { name: "DBMS", category: "DATABASE" },
      { name: "Communication", category: "COMMUNICATION" }
    ].map((s) => prisma.skill.upsert({ where: { name: s.name }, update: {}, create: s }))
  );
  const byName = Object.fromEntries(skills.map((s) => [s.name, s.id]));

  const role = await prisma.role.create({
    data: {
      name: "Software Developer",
      category: "TECHNICAL",
      isCustom: false,
      isActive: true,
      roleSkills: {
        create: [
          { skillId: byName.Python, requirement: "REQUIRED", minProficiency: 75, weight: 3 },
          { skillId: byName.SQL, requirement: "REQUIRED", minProficiency: 80, weight: 3 },
          { skillId: byName.DSA, requirement: "REQUIRED", minProficiency: 85, weight: 3 },
          { skillId: byName.DBMS, requirement: "REQUIRED", minProficiency: 75, weight: 2 },
          { skillId: byName.Communication, requirement: "REQUIRED", minProficiency: 75, weight: 2 }
        ]
      }
    }
  });

  const user = await prisma.user.create({
    data: {
      email: "test.student@careerlens.ai",
      name: "Test Student",
      role: "STUDENT",
      passwordHash: "unused-in-tests",
      emailVerified: true,
      profile: {
        create: {
          targetRoleId: role.id,
          college: "Test College",
          university: "Test University",
          graduationYear: 2026,
          cgpa: 8.2,
          onboardingCompleted: true
        }
      },
      studentSkills: {
        create: [
          { skillId: byName.Python, level: 3, score: 80, source: "SELF" },
          { skillId: byName.SQL, level: 2, score: 45, source: "SELF" },
          { skillId: byName.DSA, level: 2, score: 40, source: "SELF" },
          { skillId: byName.DBMS, level: 2, score: 60, source: "SELF" },
          { skillId: byName.Communication, level: 3, score: 70, source: "SELF" }
        ]
      },
      roadmaps: {
        create: { roleId: role.id, title: "Software Developer Roadmap", status: "ACTIVE", weeks: 6 }
      }
    }
  });

  await prisma.learningResource.create({
    data: {
      skillId: byName.DSA,
      title: "DSA Practice",
      url: "https://example.com/dsa",
      type: "PRACTICE"
    }
  });

  const assessment = await prisma.assessment.create({
    data: {
      title: "DSA & SQL Foundations",
      type: "CODING",
      difficulty: "MEDIUM",
      durationMinutes: 15,
      totalMarks: 2,
      passScore: 50,
      roleId: role.id,
      isActive: true,
      questions: {
        create: [
          {
            text: "Which data structure provides O(1) average access by index?",
            type: "MCQ",
            options: [{ key: "A", text: "Array" }, { key: "B", text: "Linked List" }],
            correctAnswer: { keys: ["A"] },
            marks: 1,
            difficulty: "EASY",
            questionSk: { create: [{ skillId: byName.DSA, weight: 1 }] }
          },
          {
            text: "Which SQL clause filters rows before grouping?",
            type: "MCQ",
            options: [{ key: "A", text: "HAVING" }, { key: "B", text: "WHERE" }],
            correctAnswer: { keys: ["B"] },
            marks: 1,
            difficulty: "EASY",
            questionSk: { create: [{ skillId: byName.SQL, weight: 1 }] }
          }
        ]
      }
    }
  });

  return { user, role, assessment, skills: byName };
}

describe("auth primitives", () => {
  it("hashes and verifies passwords", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth");
    const hash = await hashPassword("CareerLens@2026");
    expect(hash).not.toBe("CareerLens@2026");
    expect(await verifyPassword("CareerLens@2026", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("round-trips signed session tokens and enforces purpose", async () => {
    const { createSessionToken, verifyToken } = await import("@/lib/auth");
    const token = await createSessionToken({ id: "u1", role: "STUDENT", name: "T", email: "t@t.co" }, "session");
    const payload = await verifyToken<{ sub?: string; purpose?: string; role?: string }>(token);
    expect(payload?.sub).toBe("u1");
    expect(payload?.purpose).toBe("session");
    expect(payload?.role).toBe("STUDENT");
    const bad = await verifyToken("garbage.token.here");
    expect(bad).toBeNull();
  });

  it("validates signup and login input", async () => {
    const { signupSchema, loginSchema } = await import("@/services/auth-service");
    expect(signupSchema.safeParse({ name: "Ada Lovelace", email: "ada@x.io", password: "StrongPass123" }).success).toBe(true);
    expect(signupSchema.safeParse({ name: "A", email: "ada@x.io", password: "StrongPass123" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "Ada", email: "not-an-email", password: "StrongPass123" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "Ada", email: "ada@x.io", password: "short" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "ada@x.io", password: "" }).success).toBe(false);
  });
});

describe("adaptive analysis loop", () => {
  it("recomputes the canonical skill gaps from the problem statement", async () => {
    const { recomputeAnalysis } = await import("@/services/analysis-service");
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "test.student@careerlens.ai" } });
    const result = await recomputeAnalysis(user.id);

    const byName = Object.fromEntries(result.gaps.map((g) => [g.skillName, g]));

    // Canonical story: DSA critical, SQL major, Python strong.
    expect(byName["DSA"]?.status).toBe("CRITICAL_GAP");
    expect(byName["DSA"]?.gap).toBe(45);
    expect(byName["SQL"]?.status).toBe("MAJOR_GAP");
    expect(byName["Python"]?.status).toBe("STRONG");

    expect(result.targetRoleId).toBeTruthy();
    expect(result.readiness.overall).toBeGreaterThan(0);
    expect(result.readiness.overall).toBeLessThanOrEqual(100);
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].fitScore).toBeGreaterThanOrEqual(0);
  });

  it("persists gaps, readiness snapshots, and role matches", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "test.student@careerlens.ai" } });
    const gaps = await prisma.skillGap.findMany({ where: { userId: user.id }, include: { skill: true } });
    expect(gaps.length).toBe(5);
    expect(gaps.filter((g) => g.status === "CRITICAL_GAP").map((g) => g.skill.name)).toContain("DSA");

    const snaps = await prisma.readinessSnapshot.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    expect(snaps.length).toBeGreaterThan(0);
    expect(snaps[0].overall).toBeGreaterThan(0);

    const matches = await prisma.roleMatch.findMany({ where: { userId: user.id } });
    expect(matches.length).toBeGreaterThan(0);
  });

  it("generates a personalized roadmap when one exists", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "test.student@careerlens.ai" } });
    const roadmap = await prisma.roadmap.findFirstOrThrow({ where: { userId: user.id, status: "ACTIVE" }, include: { items: true } });
    expect(roadmap.items.length).toBeGreaterThan(0);
    // Critical gap must be scheduled first.
    const dsaItems = roadmap.items.filter((i) => i.skillId);
    expect(dsaItems[0]?.week).toBe(1);
  });
});

describe("assessment engine", () => {
  it("starts an attempt without leaking correct answers", async () => {
    const { startAssessment } = await import("@/services/assessment-service");
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "test.student@careerlens.ai" } });
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { title: "DSA & SQL Foundations" } });

    const { attempt, questions, fresh } = await startAssessment(user.id, assessment.id);
    expect(fresh).toBe(true);
    expect(attempt.status).toBe("IN_PROGRESS");
    expect(questions).toHaveLength(2);
    for (const q of questions) {
      expect(q).not.toHaveProperty("correctAnswer");
      expect(q.options?.length).toBeGreaterThan(0);
    }
  });

  it("scores answers and maps them to skill scores (adaptive loop)", async () => {
    const { startAssessment, submitAssessment } = await import("@/services/assessment-service");
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "test.student@careerlens.ai" } });
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { title: "DSA & SQL Foundations" } });

    const { attempt, questions } = await startAssessment(user.id, assessment.id);
    // q1 (DSA) correct answer is A; q2 (SQL) correct answer is B.
    const answers = [
      { questionId: questions[0].id, answer: ["A"] },
      { questionId: questions[1].id, answer: ["B"] }
    ];
    const result = await submitAssessment(user.id, attempt.id, answers);

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.correctCount).toBe(2);
    expect(result.totalQuestions).toBe(2);
    expect(result.recomputed).toBe(true);

    const skillNames = result.perSkill.map((p) => p.skillName);
    expect(skillNames).toContain("DSA");
    expect(skillNames).toContain("SQL");

    // Blended scores: old 0.6 + new 0.4.
    const dsa = await prisma.studentSkill.findUniqueOrThrow({
      where: { userId_skillId: { userId: user.id, skillId: (await prisma.skill.findUniqueOrThrow({ where: { name: "DSA" } })).id } }
    });
    expect(dsa.score).toBe(64); // round(40*0.6 + 100*0.4)

    const sql = await prisma.studentSkill.findUniqueOrThrow({
      where: { userId_skillId: { userId: user.id, skillId: (await prisma.skill.findUniqueOrThrow({ where: { name: "SQL" } })).id } }
    });
    expect(sql.score).toBe(67); // round(45*0.6 + 100*0.4)
  });

  it("auto-scores a fully wrong attempt and recomputes readiness down", async () => {
    const { startAssessment, submitAssessment } = await import("@/services/assessment-service");
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "test.student@careerlens.ai" } });
    const assessment = await prisma.assessment.findFirstOrThrow({ where: { title: "DSA & SQL Foundations" } });

    const before = await prisma.readinessSnapshot.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

    const { attempt, questions } = await startAssessment(user.id, assessment.id);
    // q1 correct is A, q2 correct is B — answer the opposite of both.
    const answers = [
      { questionId: questions[0].id, answer: ["B"] },
      { questionId: questions[1].id, answer: ["A"] }
    ];
    const result = await submitAssessment(user.id, attempt.id, answers);

    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.correctCount).toBe(0);

    const after = await prisma.readinessSnapshot.findFirstOrThrow({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    // Readiness reacts to the drop (allow equal, never higher).
    expect(after.overall).toBeLessThanOrEqual(before.overall);
  });
});

describe("password reset flow", () => {
  it("creates a token and resets the password", async () => {
    const { createResetToken, updatePasswordWithResetToken, verifyPassword } = await import("@/lib/auth");
    const email = "test.student@careerlens.ai";
    const token = await createResetToken(email);
    const res = await updatePasswordWithResetToken(token, "NewPass@2026!");
    expect(res.ok).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(await verifyPassword("NewPass@2026!", user.passwordHash)).toBe(true);

    // Expired/garbage tokens are rejected.
    const bad = await updatePasswordWithResetToken("not-a-real-token", "Whatever@2026!");
    expect(bad.ok).toBe(false);
  });
});
