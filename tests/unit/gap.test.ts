import { describe, expect, it } from "vitest";
import { gapStatus, computeSkillGaps, computePriority, criticalGaps, strongestSkills } from "@/engines/gap";
import type { RoleRequirement, StudentSkillData } from "@/engines/types";

describe("gapStatus", () => {
  it("marks skills at or above the requirement as STRONG", () => {
    expect(gapStatus(80, 75)).toBe("STRONG");
    expect(gapStatus(75, 75)).toBe("STRONG");
  });

  it("marks small gaps as IMPROVE", () => {
    expect(gapStatus(70, 75)).toBe("IMPROVE");
    expect(gapStatus(60, 75)).toBe("IMPROVE"); // 15/75 = 20% relative → IMPROVE
  });

  it("marks medium gaps as MAJOR_GAP", () => {
    expect(gapStatus(45, 80)).toBe("MAJOR_GAP"); // 35/80 ≈ 44% → MAJOR
  });

  it("marks large gaps as CRITICAL_GAP", () => {
    expect(gapStatus(40, 85)).toBe("CRITICAL_GAP"); // 45/85 ≈ 53% → CRITICAL
  });
});

describe("computeSkillGaps (canonical example from the problem statement)", () => {
  // Software Developer: Python 75, SQL 80, DSA 85, DBMS 75, Communication 75
  const requirements: RoleRequirement[] = [
    { skillId: "py", name: "Python", category: "PROGRAMMING", requirement: "REQUIRED", minProficiency: 75, weight: 3 },
    { skillId: "sql", name: "SQL", category: "DATABASE", requirement: "REQUIRED", minProficiency: 80, weight: 3 },
    { skillId: "dsa", name: "DSA", category: "DSA", requirement: "REQUIRED", minProficiency: 85, weight: 3 },
    { skillId: "dbms", name: "DBMS", category: "DATABASE", requirement: "REQUIRED", minProficiency: 75, weight: 2 },
    { skillId: "comm", name: "Communication", category: "COMMUNICATION", requirement: "REQUIRED", minProficiency: 75, weight: 2 }
  ];

  const student: StudentSkillData[] = [
    { skillId: "py", name: "Python", category: "PROGRAMMING", score: 80 },
    { skillId: "sql", name: "SQL", category: "DATABASE", score: 45 },
    { skillId: "dsa", name: "DSA", category: "DSA", score: 40 },
    { skillId: "dbms", name: "DBMS", category: "DATABASE", score: 60 },
    { skillId: "comm", name: "Communication", category: "COMMUNICATION", score: 70 }
  ];

  const gaps = computeSkillGaps({ studentSkills: student, requirements, roleName: "Software Developer" });

  it("produces a gap per requirement", () => {
    expect(gaps).toHaveLength(5);
  });

  it("computes correct scores, gaps and statuses", () => {
    const byId = Object.fromEntries(gaps.map((g) => [g.skillId, g]));
    expect(byId.py.status).toBe("STRONG");
    expect(byId.py.currentScore).toBe(80);
    expect(byId.py.requiredScore).toBe(75);
    expect(byId.py.gap).toBe(-5);

    expect(byId.sql.status).toBe("MAJOR_GAP");
    expect(byId.sql.gap).toBe(35);
    expect(byId.sql.currentScore).toBe(45);

    expect(byId.dsa.status).toBe("CRITICAL_GAP");
    expect(byId.dsa.gap).toBe(45);
    expect(byId.dsa.currentScore).toBe(40);

    expect(byId.dbms.status).toBe("IMPROVE");
    expect(byId.dbms.gap).toBe(15);

    expect(byId.comm.status).toBe("IMPROVE");
    expect(byId.comm.gap).toBe(5);
  });

  it("prioritizes critical gaps first", () => {
    expect(gaps[0].skillId).toBe("dsa");
    expect(gaps[0].priority).toBeGreaterThan(gaps[1].priority);
  });

  it("explains why the skill matters", () => {
    const dsa = gaps.find((g) => g.skillId === "dsa")!;
    expect(dsa.impact).toContain("Data structures & algorithms");
    expect(dsa.impact).toContain("Software Developer");
    expect(dsa.impact).toContain("highest-leverage");
  });

  it("sorts gaps by priority then gap size", () => {
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i - 1].priority).toBeGreaterThanOrEqual(gaps[i].priority);
    }
  });

  it("returns the right helpers", () => {
    const critical = criticalGaps(gaps);
    expect(critical.map((g) => g.skillId)).toContain("dsa");
    expect(critical.map((g) => g.skillId)).toContain("sql");
    expect(strongestSkills(gaps).map((g) => g.skillId)).toEqual(["py"]);
  });
});

describe("computePriority", () => {
  it("raises priority for a failed assessment on the skill", () => {
    const base = computePriority({ status: "MAJOR_GAP", gap: 35, weight: 3, maxWeight: 3 });
    const boosted = computePriority({ status: "MAJOR_GAP", gap: 35, weight: 3, maxWeight: 3, assessmentScore: 30 });
    expect(boosted).toBeGreaterThan(base);
  });

  it("stays within 1..10", () => {
    expect(computePriority({ status: "CRITICAL_GAP", gap: 95, weight: 5, maxWeight: 5, assessmentScore: 0 })).toBeLessThanOrEqual(10);
    expect(computePriority({ status: "STRONG", gap: -50, weight: 1, maxWeight: 5 })).toBeGreaterThanOrEqual(1);
  });
});
