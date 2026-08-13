import { describe, expect, it } from "vitest";
import { computeReadinessComponents, computeOverallReadiness, readinessLabel, DEFAULT_WEIGHTS, averageScores } from "@/engines/readiness";
import type { StudentSkillData } from "@/engines/types";

describe("readiness engine", () => {
  const skills: StudentSkillData[] = [
    { skillId: "1", name: "Python", category: "PROGRAMMING", score: 80 },
    { skillId: "2", name: "DSA", category: "DSA", score: 40 },
    { skillId: "3", name: "SQL", category: "DATABASE", score: 70 },
    { skillId: "4", name: "Communication", category: "COMMUNICATION", score: 75 }
  ];

  it("computes technical as the average of technical categories", () => {
    const c = computeReadinessComponents({
      skills,
      assessmentScores: { coding: null, aptitude: null, communication: null, interview: null },
      resumeUploaded: true,
      resumeExtractionApplied: false,
      profileComplete: 70
    });
    // technical = avg(80, 40, 70) = 63
    expect(c.technical).toBe(63);
  });

  it("uses assessment scores when there is no coding skill data", () => {
    const c = computeReadinessComponents({
      skills: [],
      assessmentScores: { coding: 88, aptitude: 60, communication: null, interview: 55 },
      resumeUploaded: false,
      resumeExtractionApplied: false,
      profileComplete: 50
    });
    expect(c.coding).toBe(88);
    expect(c.aptitude).toBe(60);
    expect(c.interview).toBe(55);
  });

  it("keeps a non-zero baseline when nothing is measured", () => {
    const c = computeReadinessComponents({
      skills: [],
      assessmentScores: { coding: null, aptitude: null, communication: null, interview: null },
      resumeUploaded: false,
      resumeExtractionApplied: false,
      profileComplete: 0
    });
    expect(c.coding).toBeGreaterThan(0);
    expect(c.interview).toBeGreaterThan(0);
  });

  it("rewards completed projects", () => {
    const base = computeReadinessComponents({
      skills: [],
      assessmentScores: { coding: 50, aptitude: 50, communication: 50, interview: 50 },
      projects: { count: 0, completed: 0, advancedCount: 0 },
      resumeUploaded: false,
      resumeExtractionApplied: false,
      profileComplete: 60
    });
    const withProjects = computeReadinessComponents({
      skills: [],
      assessmentScores: { coding: 50, aptitude: 50, communication: 50, interview: 50 },
      projects: { count: 3, completed: 2, advancedCount: 1 },
      resumeUploaded: false,
      resumeExtractionApplied: false,
      profileComplete: 60
    });
    expect(withProjects.projects).toBeGreaterThan(base.projects);
  });

  it("rewards a complete profile and uploaded resume", () => {
    const bare = computeReadinessComponents({
      skills: [],
      assessmentScores: { coding: 50, aptitude: 50, communication: 50, interview: 50 },
      resumeUploaded: false,
      resumeExtractionApplied: false,
      profileComplete: 20
    });
    const complete = computeReadinessComponents({
      skills: [],
      assessmentScores: { coding: 50, aptitude: 50, communication: 50, interview: 50 },
      resumeUploaded: true,
      resumeExtractionApplied: true,
      profileComplete: 100
    });
    expect(complete.resume).toBeGreaterThan(bare.resume);
  });

  it("computes a weighted overall within 0..100", () => {
    const c = computeReadinessComponents({
      skills,
      assessmentScores: { coding: 60, aptitude: 55, communication: 70, interview: 50 },
      projects: { count: 2, completed: 1, advancedCount: 0 },
      resumeUploaded: true,
      resumeExtractionApplied: false,
      profileComplete: 80
    });
    const overall = computeOverallReadiness(c, DEFAULT_WEIGHTS);
    expect(overall).toBeGreaterThanOrEqual(0);
    expect(overall).toBeLessThanOrEqual(100);
  });

  it("normalizes weights that do not sum to 100", () => {
    const c = computeReadinessComponents({
      skills: [],
      assessmentScores: { coding: 50, aptitude: 50, communication: 50, interview: 50 },
      resumeUploaded: false,
      resumeExtractionApplied: false,
      profileComplete: 0
    });
    const customWeights = { ...DEFAULT_WEIGHTS, technical: 10, coding: 10 };
    const overall = computeOverallReadiness(c, customWeights);
    expect(overall).toBeGreaterThanOrEqual(0);
    expect(overall).toBeLessThanOrEqual(100);
  });

  it("returns sensible labels", () => {
    expect(readinessLabel(82).label).toBe("Placement Ready");
    expect(readinessLabel(30).label).toBe("Needs Focus");
  });

  it("averages numbers correctly", () => {
    expect(averageScores([50, 60, 70])).toBe(60);
    expect(averageScores([])).toBe(0);
  });
});
