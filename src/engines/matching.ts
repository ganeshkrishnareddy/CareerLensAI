import { clamp } from "@/lib/utils";
import { gapStatus } from "./gap";
import type { RoleMatchResult, RoleRequirement, StudentSkillData } from "./types";

export type { RoleMatchResult, RoleRequirement, StudentSkillData };


export interface RoleMatchInput {
  roleId: string;
  roleName: string;
  roleCategory?: string | null;
  requirements: RoleRequirement[]; // required + preferred
  studentSkills: StudentSkillData[];
}

/**
 * Fit score: weighted coverage of requirements (capped per skill at 100% of
 * requirement), with a small bonus for preferred-skill strength and penalties
 * for critical gaps. Readiness score: weighted average of the student's level
 * relative to the requirement (also capped) — i.e. "how prepared are you".
 */
export function matchRole(input: RoleMatchInput): RoleMatchResult {
  const { roleId, roleName, roleCategory, requirements, studentSkills } = input;
  const scoreMap = new Map(studentSkills.map((s) => [s.skillId, s]));
  const required = requirements.filter((r) => r.requirement === "REQUIRED");
  const preferred = requirements.filter((r) => r.requirement === "PREFERRED");
  const all = required.length > 0 ? required : requirements;

  const totalWeight = all.reduce((a, r) => a + r.weight, 0) || 1;

  let coverage = 0;
  let readiness = 0;
  const missingSkills: RoleMatchResult["missingSkills"] = [];
  const strengths: RoleMatchResult["strengths"] = [];

  for (const req of all) {
    const current = scoreMap.get(req.skillId)?.score ?? 0;
    const ratio = clamp(current / Math.max(1, req.minProficiency), 0, 1);
    coverage += req.weight * ratio;
    readiness += req.weight * Math.min(current, req.minProficiency);
    if (current < req.minProficiency) {
      missingSkills.push({
        skillId: req.skillId,
        name: req.name,
        current,
        required: req.minProficiency,
        gap: req.minProficiency - current,
        status: gapStatus(current, req.minProficiency)
      });
    } else {
      strengths.push({ skillId: req.skillId, name: req.name, score: current, required: req.minProficiency });
    }
  }

  let fitScore = (coverage / totalWeight) * 100;

  // Preferred-skill bonus
  if (preferred.length > 0) {
    const preferredLevels = preferred
      .map((r) => scoreMap.get(r.skillId)?.score ?? 0)
      .filter((s) => s >= 60);
    if (preferredLevels.length >= Math.ceil(preferred.length / 2)) fitScore += 3;
  }

  // Critical gap penalty
  const criticalCount = missingSkills.filter((m) => m.status === "CRITICAL_GAP").length;
  fitScore -= criticalCount * 3;

  fitScore = clamp(Math.round(fitScore), 0, 100);
  const readinessScore = clamp(Math.round((readiness / totalWeight)), 0, 100);

  const reasons = buildReasons(roleName, missingSkills, strengths);

  return {
    roleId,
    roleName,
    roleCategory,
    fitScore,
    readinessScore,
    missingSkills: missingSkills.sort((a, b) => b.gap - a.gap),
    strengths: strengths.sort((a, b) => b.score - a.score).slice(0, 5),
    reasons
  };
}

function buildReasons(
  roleName: string,
  missing: RoleMatchResult["missingSkills"],
  strengths: RoleMatchResult["strengths"]
): string[] {
  const reasons: string[] = [];
  if (strengths.length >= 2) {
    reasons.push(
      `Strong foundation in ${strengths.slice(0, 3).map((s) => s.name).join(", ")} — directly relevant to ${roleName}.`
    );
  } else if (strengths.length === 1) {
    reasons.push(`Solid ${strengths[0].name} skills align with ${roleName}.`);
  }
  const critical = missing.filter((m) => m.status === "CRITICAL_GAP");
  if (critical.length > 0) {
    reasons.push(
      `Blocking gaps in ${critical.slice(0, 2).map((m) => m.name).join(" and ")} — focus here to unlock this role.`
    );
  } else if (missing.length > 0) {
    reasons.push(
      `Small to medium gaps remain in ${missing.slice(0, 2).map((m) => m.name).join(", ")} — reachable within a focused 3–4 week plan.`
    );
  } else {
    reasons.push(`All core requirements for ${roleName} are currently met.`);
  }
  return reasons;
}

export function rankRoles(matches: RoleMatchResult[]): RoleMatchResult[] {
  return [...matches].sort((a, b) => b.fitScore - a.fitScore || b.readinessScore - a.readinessScore);
}
