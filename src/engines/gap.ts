import { clamp } from "@/lib/utils";
import type { GapStatus, RoleRequirement, SkillGapResult, StudentSkillData } from "./types";

export type { GapStatus, RoleRequirement, SkillGapResult, StudentSkillData };


const ROLE_NAME = "%ROLE%";

/**
 * Classify a gap into a status bucket.
 * Rules (aligned with the product's canonical example):
 *   current >= required            -> STRONG
 *   absolute gap <= 8              -> IMPROVE
 *   relative gap <= 25% of req     -> IMPROVE
 *   relative gap <= 50% of req     -> MAJOR_GAP
 *   otherwise                      -> CRITICAL_GAP
 */
export function gapStatus(currentScore: number, requiredScore: number): GapStatus {
  if (currentScore >= requiredScore) return "STRONG";
  const gap = requiredScore - currentScore;
  if (gap <= 8) return "IMPROVE";
  const rel = gap / requiredScore;
  if (rel <= 0.25) return "IMPROVE";
  if (rel <= 0.5) return "MAJOR_GAP";
  return "CRITICAL_GAP";
}

const STATUS_LEVEL: Record<GapStatus, number> = {
  STRONG: 1,
  IMPROVE: 4,
  MAJOR_GAP: 7,
  CRITICAL_GAP: 10
};

/**
 * Priority 1-10 — how urgently the student should work on this gap.
 * Combines severity (status), gap magnitude, role weight and (optionally)
 * observed assessment performance. Priority drives roadmap ordering and the
 * "recommended next action" on the dashboard.
 */
export function computePriority(params: {
  status: GapStatus;
  gap: number;
  weight: number;
  maxWeight: number;
  assessmentScore?: number | null;
}): number {
  const { status, gap, weight, maxWeight, assessmentScore } = params;
  const statusScore = STATUS_LEVEL[status] / 10; // 0.1..1
  const gapScore = clamp(gap, 0, 100) / 100;
  const weightScore = maxWeight > 0 ? clamp(weight / maxWeight, 0, 1) : 0.5;
  let priority = statusScore * 0.5 + gapScore * 0.3 + weightScore * 0.2;
  // A failed/weak assessment on this skill raises urgency.
  if (assessmentScore !== undefined && assessmentScore !== null && assessmentScore < 50 && status !== "STRONG") {
    priority += 0.15;
  }
  return clamp(Math.round(priority * 10), 1, 10);
}

const CATEGORY_IMPACT: Record<string, string> = {
  DSA: "Data structures & algorithms are among the most frequently tested areas in coding interviews. Recruiters use DSA rounds to filter candidates early.",
  PROGRAMMING: "Core programming fluency is a baseline expectation for this role. Interviewers probe language fundamentals in almost every technical round.",
  DATABASE: "Database knowledge is tested in both technical interviews and take-home tasks. Weak SQL/DBMS skills directly reduce your candidacy.",
  FRAMEWORK: "Framework familiarity shows production-readiness. Hiring managers expect you to build with the tools the team actually uses.",
  CLOUD: "Cloud skills signal that you can deploy and operate systems, which is increasingly required even for junior roles.",
  DATA_AI: "Data/AI skills are a differentiator for analytics and ML roles — projects and case rounds rely on them.",
  CYBERSECURITY: "Security fundamentals are screened early for security roles and are a strong plus elsewhere.",
  TOOLS: "Tool fluency (Git, Docker, CI) reduces onboarding time and is checked in practical rounds.",
  SOFT: "Communication and collaboration decide the final HR round. Many candidates with strong technical skills are rejected here.",
  COMMUNICATION: "Communication is evaluated in HR and behavioral rounds. It is the single most common rejection reason after technical rounds.",
  APTITUDE: "Aptitude tests are used by most companies as the first screening filter — failing here ends the process before technical rounds.",
  OTHER: "This skill contributes to your overall profile strength for the role."
};

export function impactMessage(params: {
  skillName: string;
  category: string;
  currentScore: number;
  requiredScore: number;
  status: GapStatus;
  roleName: string;
  requirement: "REQUIRED" | "PREFERRED";
}): string {
  const { skillName, category, currentScore, requiredScore, status, roleName, requirement } = params;
  if (status === "STRONG") {
    return `${skillName} is at ${currentScore}% against a ${requiredScore}% requirement for ${roleName} — you're ahead of the bar. Keep it sharp.`;
  }
  const why = CATEGORY_IMPACT[category] ?? CATEGORY_IMPACT.OTHER;
  const need = requirement === "REQUIRED" ? "required" : "preferred";
  if (status === "CRITICAL_GAP") {
    return `${skillName} is ${need} at ${requiredScore}% for ${roleName}, and you're at ${currentScore}% — a ${requiredScore - currentScore} point shortfall. ${why} Closing this is your highest-leverage move.`;
  }
  if (status === "MAJOR_GAP") {
    return `${skillName} is ${need} at ${requiredScore}% for ${roleName}; you're at ${currentScore}%. ${why} A focused push of 2–3 weeks should close most of this gap.`;
  }
  return `${skillName} is ${need} at ${requiredScore}% for ${roleName}. You're at ${currentScore}% — a small, targeted push will take you past the bar.`;
}

/**
 * Compute gaps between a student's skill scores and a role's requirements.
 * Returns gaps sorted by priority (highest first). Strong skills are included
 * so dashboards can show the full comparison table.
 */
export function computeSkillGaps(params: {
  studentSkills: StudentSkillData[];
  requirements: RoleRequirement[];
  roleName: string;
  assessmentScores?: Record<string, number>;
}): SkillGapResult[] {
  const { studentSkills, requirements, roleName, assessmentScores } = params;
  const scoreMap = new Map(studentSkills.map((s) => [s.skillId, s]));
  const maxWeight = Math.max(1, ...requirements.map((r) => r.weight));

  const gaps: SkillGapResult[] = requirements.map((req) => {
    const current = scoreMap.get(req.skillId)?.score ?? 0;
    const status = gapStatus(current, req.minProficiency);
    const gap = req.minProficiency - current;
    const priority = computePriority({
      status,
      gap,
      weight: req.weight,
      maxWeight,
      assessmentScore: assessmentScores?.[req.skillId]
    });
    return {
      skillId: req.skillId,
      skillName: req.name,
      category: req.category,
      currentScore: current,
      requiredScore: req.minProficiency,
      gap,
      status,
      priority,
      weight: req.weight,
      requirement: req.requirement,
      impact: impactMessage({
        skillName: req.name,
        category: req.category,
        currentScore: current,
        requiredScore: req.minProficiency,
        status,
        roleName,
        requirement: req.requirement
      })
    };
  });

  return gaps.sort((a, b) => b.priority - a.priority || b.gap - a.gap);
}

export function criticalGaps<T extends { status: string }>(gaps: T[]) {
  return gaps.filter((g) => g.status === "CRITICAL_GAP" || g.status === "MAJOR_GAP");
}

export function strongestSkills<T extends { status: string }>(gaps: T[]) {
  return gaps.filter((g) => g.status === "STRONG");
}

export { ROLE_NAME };
