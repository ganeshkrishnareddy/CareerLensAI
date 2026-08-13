import { describe, expect, it } from "vitest";
import { matchRole, rankRoles } from "@/engines/matching";
import type { RoleRequirement, StudentSkillData } from "@/engines/types";

const req = (id: string, name: string, category: string, min: number, weight: number, requirement: "REQUIRED" | "PREFERRED" = "REQUIRED"): RoleRequirement => ({
  skillId: id,
  name,
  category,
  requirement,
  minProficiency: min,
  weight
});

const student = (id: string, name: string, category: string, score: number): StudentSkillData => ({
  skillId: id,
  name,
  category,
  score
});

describe("matchRole", () => {
  const swDevRequirements: RoleRequirement[] = [
    req("py", "Python", "PROGRAMMING", 75, 3),
    req("sql", "SQL", "DATABASE", 80, 3),
    req("dsa", "DSA", "DSA", 85, 3),
    req("dbms", "DBMS", "DATABASE", 75, 2),
    req("comm", "Communication", "COMMUNICATION", 75, 2)
  ];

  it("gives a high fit for a student who meets requirements", () => {
    const result = matchRole({
      roleId: "swd",
      roleName: "Software Developer",
      requirements: swDevRequirements,
      studentSkills: [
        student("py", "Python", "PROGRAMMING", 90),
        student("sql", "SQL", "DATABASE", 85),
        student("dsa", "DSA", "DSA", 90),
        student("dbms", "DBMS", "DATABASE", 80),
        student("comm", "Communication", "COMMUNICATION", 80)
      ]
    });
    expect(result.fitScore).toBeGreaterThanOrEqual(75);
    expect(result.strengths.length).toBe(5);
    expect(result.missingSkills.length).toBe(0);
  });

  it("gives a low fit when critical skills are missing", () => {
    const result = matchRole({
      roleId: "swd",
      roleName: "Software Developer",
      requirements: swDevRequirements,
      studentSkills: [
        student("py", "Python", "PROGRAMMING", 70),
        student("sql", "SQL", "DATABASE", 30),
        student("dsa", "DSA", "DSA", 20),
        student("dbms", "DBMS", "DATABASE", 60),
        student("comm", "Communication", "COMMUNICATION", 70)
      ]
    });
    // Two CRITICAL_GAPs (SQL 62%, DSA 76% short) drag the weighted fit to 56.
    expect(result.fitScore).toBeLessThan(60);
    expect(result.missingSkills.filter((m) => m.status === "CRITICAL_GAP").length).toBe(2);
    expect(result.reasons.some((r) => r.toLowerCase().includes("blocking"))).toBe(true);
  });

  it("lists missing skills with correct gaps", () => {
    const result = matchRole({
      roleId: "swd",
      roleName: "Software Developer",
      requirements: swDevRequirements,
      studentSkills: [
        student("py", "Python", "PROGRAMMING", 90),
        student("sql", "SQL", "DATABASE", 45),
        student("dsa", "DSA", "DSA", 40),
        student("dbms", "DBMS", "DATABASE", 90),
        student("comm", "Communication", "COMMUNICATION", 90)
      ]
    });
    const sql = result.missingSkills.find((m) => m.skillId === "sql");
    expect(sql?.gap).toBe(35);
    const dsa = result.missingSkills.find((m) => m.skillId === "dsa");
    expect(dsa?.gap).toBe(45);
  });

  it("prefers roles with matching preferred skills", () => {
    const withPreferred: RoleRequirement[] = [
      req("py", "Python", "PROGRAMMING", 75, 3),
      req("ml", "ML", "DATA_AI", 70, 2, "PREFERRED")
    ];
    const strong = matchRole({
      roleId: "ml1",
      roleName: "ML Engineer",
      requirements: withPreferred,
      studentSkills: [student("py", "Python", "PROGRAMMING", 70), student("ml", "ML", "DATA_AI", 80)]
    });
    const weak = matchRole({
      roleId: "ml2",
      roleName: "ML Engineer",
      requirements: withPreferred,
      studentSkills: [student("py", "Python", "PROGRAMMING", 70), student("ml", "ML", "DATA_AI", 20)]
    });
    // Both sit at 93% coverage; the preferred-skill bonus (3 pts) breaks the tie.
    expect(strong.fitScore).toBe(96);
    expect(weak.fitScore).toBe(93);
  });
});

describe("rankRoles", () => {
  it("sorts by fit score descending", () => {
    const low = matchRole({
      roleId: "a",
      roleName: "Role A",
      requirements: [req("x", "X", "OTHER", 80, 1)],
      studentSkills: [student("x", "X", "OTHER", 20)]
    });
    const high = matchRole({
      roleId: "b",
      roleName: "Role B",
      requirements: [req("y", "Y", "OTHER", 80, 1)],
      studentSkills: [student("y", "Y", "OTHER", 90)]
    });
    const ranked = rankRoles([low, high]);
    expect(ranked[0].roleId).toBe("b");
  });
});
