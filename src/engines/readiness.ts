import { clamp } from "@/lib/utils";
import type { ReadinessComponents, ReadinessWeights, StudentSkillData } from "./types";

export type { ReadinessComponents, ReadinessWeights, StudentSkillData };


/** Categories that count toward the technical-skills component. */
export const TECH_CATEGORIES = [
  "PROGRAMMING",
  "FRAMEWORK",
  "DATABASE",
  "CLOUD",
  "DATA_AI",
  "CYBERSECURITY",
  "TOOLS",
  "DSA",
  "OTHER"
];

export const DEFAULT_WEIGHTS: ReadinessWeights = {
  technical: 25,
  coding: 20,
  aptitude: 10,
  communication: 15,
  interview: 10,
  projects: 10,
  resume: 10
};

export const COMPONENT_LABELS: Record<keyof ReadinessComponents, string> = {
  overall: "Overall",
  technical: "Technical Skills",
  coding: "Coding",
  aptitude: "Aptitude",
  communication: "Communication",
  interview: "Interview",
  projects: "Projects",
  resume: "Resume"
};

export function averageScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export interface ReadinessEvidence {
  skills: StudentSkillData[];
  assessmentScores: {
    coding: number | null;
    aptitude: number | null;
    communication: number | null;
    interview: number | null;
  };
  projects?: {
    count: number;
    completed: number;
    advancedCount: number;
  } | null;
  resumeUploaded: boolean;
  resumeExtractionApplied: boolean;
  profileComplete: number; // 0-100
}

const BASELINE_NO_DATA = 35;

function projectScore(p?: ReadinessEvidence["projects"]): number {
  if (!p || p.count === 0) return 25;
  return clamp(Math.round(20 + p.count * 12 + p.completed * 8 + p.advancedCount * 10), 0, 100);
}

function resumeScore(evidence: ReadinessEvidence): number {
  let score = 30; // base: profile exists
  score += evidence.profileComplete * 0.4;
  if (evidence.resumeUploaded) score += 20;
  if (evidence.resumeExtractionApplied) score += 10;
  return clamp(Math.round(score), 0, 100);
}

export function computeReadinessComponents(evidence: ReadinessEvidence): ReadinessComponents {
  const techScores = evidence.skills
    .filter((s) => TECH_CATEGORIES.includes(s.category))
    .map((s) => s.score);
  const technical = averageScores(techScores);

  const codingSkills = averageScores(
    evidence.skills
      .filter((s) => s.category === "DSA" || s.category === "PROGRAMMING")
      .map((s) => s.score)
  );
  const coding =
    codingSkills === 0 && evidence.assessmentScores.coding === null
      ? BASELINE_NO_DATA
      : averageScores(
          [codingSkills || null, evidence.assessmentScores.coding].filter(
            (v): v is number => v !== null && v > 0
          )
        );

  const commSkills = averageScores(
    evidence.skills
      .filter((s) => s.category === "COMMUNICATION" || s.category === "SOFT")
      .map((s) => s.score)
  );
  const communication =
    commSkills === 0 && evidence.assessmentScores.communication === null
      ? BASELINE_NO_DATA
      : averageScores(
          [commSkills || null, evidence.assessmentScores.communication].filter(
            (v): v is number => v !== null && v > 0
          )
        );

  const aptitude = evidence.assessmentScores.aptitude ?? BASELINE_NO_DATA;
  const interview = evidence.assessmentScores.interview ?? BASELINE_NO_DATA;
  const projects = projectScore(evidence.projects);
  const resume = resumeScore(evidence);

  return { overall: 0, technical, coding, aptitude, communication, interview, projects, resume };
}

export function computeOverallReadiness(components: ReadinessComponents, weights: ReadinessWeights): number {
  const totalWeight =
    weights.technical +
    weights.coding +
    weights.aptitude +
    weights.communication +
    weights.interview +
    weights.projects +
    weights.resume;
  if (totalWeight <= 0) return 0;
  const overall =
    (components.technical * weights.technical +
      components.coding * weights.coding +
      components.aptitude * weights.aptitude +
      components.communication * weights.communication +
      components.interview * weights.interview +
      components.projects * weights.projects +
      components.resume * weights.resume) /
    totalWeight;
  return clamp(Math.round(overall), 0, 100);
}

export function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Placement Ready", color: "emerald" };
  if (score >= 65) return { label: "Close to Ready", color: "sky" };
  if (score >= 45) return { label: "Developing", color: "amber" };
  return { label: "Needs Focus", color: "rose" };
}

export function mergeWeights(saved: Partial<ReadinessWeights> | null | undefined): ReadinessWeights {
  return { ...DEFAULT_WEIGHTS, ...(saved ?? {}) };
}
