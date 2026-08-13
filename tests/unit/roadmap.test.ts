import { describe, expect, it } from "vitest";
import { generateRoadmap } from "@/engines/roadmap";
import type { SkillGapResult } from "@/engines/types";

const gap = (skillId: string, name: string, category: string, status: SkillGapResult["status"], current: number, required: number, priority: number): SkillGapResult => ({
  skillId,
  skillName: name,
  category,
  currentScore: current,
  requiredScore: required,
  gap: required - current,
  status,
  priority,
  weight: 3,
  requirement: "REQUIRED",
  impact: `${name} matters for the role.`
});

describe("generateRoadmap", () => {
  const gaps: SkillGapResult[] = [
    gap("dsa", "DSA", "DSA", "CRITICAL_GAP", 40, 85, 10),
    gap("sql", "SQL", "DATABASE", "MAJOR_GAP", 45, 80, 9),
    gap("comm", "Communication", "COMMUNICATION", "IMPROVE", 70, 75, 6)
  ];

  it("generates a weekly plan covering the top gaps", () => {
    const plan = generateRoadmap({
      gaps,
      roleName: "Software Developer",
      weeks: 6,
      startDate: new Date("2026-01-05")
    });
    expect(plan.weeks).toBe(6);
    expect(plan.items.length).toBeGreaterThanOrEqual(5);
    expect(plan.items[0].skillName).toBe("DSA");
  });

  it("gives critical gaps more weeks than minor gaps", () => {
    const plan = generateRoadmap({
      gaps,
      roleName: "Software Developer",
      weeks: 6,
      startDate: new Date("2026-01-05")
    });
    const dsaWeeks = plan.items.filter((i) => i.skillName === "DSA").length;
    const commWeeks = plan.items.filter((i) => i.skillName === "Communication").length;
    expect(dsaWeeks).toBeGreaterThan(commWeeks);
  });

  it("attaches resources and assessments when provided", () => {
    const plan = generateRoadmap({
      gaps,
      roleName: "Software Developer",
      weeks: 4,
      startDate: new Date("2026-01-05"),
      resourcesByCategory: { DATABASE: [{ title: "SQL course", url: "https://sql.example.com" }] },
      assessmentsByType: { TECHNICAL: [{ id: "a1", title: "DSA test" }] }
    });
    const first = plan.items[0];
    expect(first.resourceTitle).toBeTruthy();
    expect(first.assessmentId).toBe("a1");
  });

  it("assigns due dates week by week", () => {
    const plan = generateRoadmap({
      gaps,
      roleName: "Software Developer",
      weeks: 3,
      startDate: new Date("2026-01-05")
    });
    expect(plan.items[0].week).toBe(1);
    expect(plan.items[1].week).toBe(2);
    expect(plan.items[2].week).toBe(3);
  });

  it("handles an empty gap list gracefully", () => {
    const plan = generateRoadmap({
      gaps: [],
      roleName: "Software Developer",
      weeks: 2,
      startDate: new Date("2026-01-05")
    });
    expect(plan.items.length).toBeGreaterThanOrEqual(1);
  });
});
