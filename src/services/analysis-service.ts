import { prisma } from "@/lib/db";
import { computeSkillGaps, type SkillGapResult } from "@/engines/gap";
import { computeReadinessComponents, computeOverallReadiness, mergeWeights, type ReadinessComponents } from "@/engines/readiness";
import { matchRole, rankRoles, type RoleMatchResult } from "@/engines/matching";
import { generateRoadmap } from "@/engines/roadmap";
import type { RoleRequirement, StudentSkillData } from "@/engines/types";
import { safeJsonParse } from "@/lib/utils";
import { trackEvent } from "./analytics-service";
import { notify } from "./notifications-service";

export interface AnalysisResult {
  gaps: SkillGapResult[];
  readiness: ReadinessComponents;
  matches: RoleMatchResult[];
  targetRoleId: string | null;
  roleName: string | null;
  studentSkills: StudentSkillData[];
  requirements: RoleRequirement[];
  assessmentScores: { coding: number | null; aptitude: number | null; communication: number | null; interview: number | null };
}

const TECH_CAT = [
  "PROGRAMMING", "FRAMEWORK", "DATABASE", "CLOUD", "DATA_AI", "CYBERSECURITY", "TOOLS", "DSA", "OTHER"
];

async function loadAnalysisInputs(userId: string) {
  const [profile, skills, attempts, projects, resumes, extractions, certifications] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, include: { targetRole: true } }),
    prisma.studentSkill.findMany({ where: { userId }, include: { skill: true } }),
    prisma.assessmentAttempt.findMany({
      where: { userId, status: "SUBMITTED", submittedAt: { not: null } },
      include: { assessment: true },
      orderBy: { submittedAt: "desc" }
    }),
    prisma.project.findMany({ where: { userId } }),
    prisma.resume.findMany({ where: { userId }, orderBy: { uploadedAt: "desc" } }),
    prisma.resumeExtraction.findMany({ where: { resume: { userId } }, orderBy: { createdAt: "desc" } }),
    prisma.certification.findMany({ where: { userId } })
  ]);

  const resume = resumes[0];
  const extractionApplied = extractions.some((e) => e.status === "CONFIRMED");
  const profileComplete = computeProfileCompleteness(profile);

  return { profile, skills, attempts, projects, resume, extractionApplied, profileComplete, certifications };
}

export function computeProfileCompleteness(profile: {
  phone?: string | null; college?: string | null; university?: string | null;
  graduationYear?: number | null; cgpa?: number | null; location?: string | null;
  targetRoleId?: string | null; batchId?: string | null; departmentId?: string | null;
} | null): number {
  if (!profile) return 0;
  const fields = [profile.phone, profile.college, profile.university, profile.graduationYear, profile.cgpa, profile.location, profile.targetRoleId, profile.batchId, profile.departmentId];
  const filled = fields.filter((f) => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

export function assessmentScoresFromAttempts(attempts: {
  assessment: { type: string };
  score: number | null;
}[]): { coding: number | null; aptitude: number | null; communication: number | null; interview: number | null } {
  const latest = (type: string) => {
    const match = attempts.find((a) => a.assessment.type === type && a.score !== null);
    return match?.score ?? null;
  };
  return {
    coding: latest("CODING") ?? latest("TECHNICAL"),
    aptitude: latest("APTITUDE"),
    communication: latest("COMMUNICATION"),
    interview: latest("INTERVIEW")
  };
}

/** Full recompute: skill gaps, readiness snapshot, role matches, roadmap. */
export async function recomputeAnalysis(userId: string, opts: { refreshRoadmap?: boolean } = {}): Promise<AnalysisResult> {
  const { profile, skills, attempts, projects, resume, extractionApplied, profileComplete, certifications } = await loadAnalysisInputs(userId);

  const studentSkills: StudentSkillData[] = skills.map((s) => ({
    skillId: s.skillId,
    name: s.skill.name,
    category: s.skill.category,
    score: s.score,
    source: s.source
  }));

  const roleId = profile?.targetRoleId ?? null;
  const roleName = profile?.targetRole?.name ?? null;

  let requirements: RoleRequirement[] = [];
  if (roleId) {
    const roleSkills = await prisma.roleSkill.findMany({
      where: { roleId },
      include: { skill: true }
    });
    requirements = roleSkills.map((rs) => ({
      skillId: rs.skillId,
      name: rs.skill.name,
      category: rs.skill.category,
      requirement: rs.requirement as "REQUIRED" | "PREFERRED",
      minProficiency: rs.minProficiency,
      weight: rs.weight
    }));
  }

  const assessmentScores = assessmentScoresFromAttempts(attempts);

  const scoreRecord: Record<string, number> = {};
  for (const [k, v] of Object.entries(assessmentScores)) {
    if (v !== null) scoreRecord[k] = v;
  }

  const gaps = roleId
    ? computeSkillGaps({ studentSkills, requirements, roleName: roleName ?? "your target role", assessmentScores: scoreRecord })
    : [];

  // Readiness
  const evidence = {
    skills: studentSkills,
    assessmentScores,
    projects: projects.length
      ? {
          count: projects.length,
          completed: projects.filter((p) => p.status === "COMPLETED").length,
          advancedCount: projects.filter((p) => p.difficulty === "ADVANCED").length
        }
      : null,
    resumeUploaded: Boolean(resume),
    resumeExtractionApplied: extractionApplied,
    profileComplete
  };
  const components = computeReadinessComponents(evidence);
  const settings = await prisma.platformSetting.findUnique({ where: { key: "readiness_weights" } });
  const weights = mergeWeights(safeJsonParse<Partial<typeof components>>(settings?.value, {}));
  components.overall = computeOverallReadiness(components, weights);

  // Persist readiness snapshot
  await prisma.readinessSnapshot.create({
    data: {
      userId,
      overall: components.overall,
      technical: components.technical,
      coding: components.coding,
      aptitude: components.aptitude,
      communication: components.communication,
      interview: components.interview,
      projects: components.projects,
      resume: components.resume,
      roleId
    }
  });

  // Persist skill gaps
  if (roleId) {
    await prisma.skillGap.deleteMany({ where: { userId, roleId } });
    if (gaps.length > 0) {
      await prisma.skillGap.createMany({
        data: gaps.map((g) => ({
          userId,
          roleId,
          skillId: g.skillId,
          currentScore: g.currentScore,
          requiredScore: g.requiredScore,
          gap: g.gap,
          status: g.status,
          priority: g.priority,
          impact: g.impact
        }))
      });
    }
  }

  // Role matches across all active roles
  const matches = await recomputeRoleMatches(userId);

  // Roadmap refresh
  if (opts.refreshRoadmap !== false && roleId) {
    await refreshRoadmap(userId, roleId, gaps, roleName ?? "your target role");
  }

  return {
    gaps,
    readiness: components,
    matches,
    targetRoleId: roleId,
    roleName,
    studentSkills,
    requirements,
    assessmentScores
  };
}

export async function recomputeRoleMatches(userId: string): Promise<RoleMatchResult[]> {
  const [skills, activeRoles] = await Promise.all([
    prisma.studentSkill.findMany({ where: { userId }, include: { skill: true } }),
    prisma.role.findMany({ where: { isActive: true, isCustom: false }, include: { roleSkills: { include: { skill: true } } } })
  ]);
  const studentSkills: StudentSkillData[] = skills.map((s) => ({
    skillId: s.skillId,
    name: s.skill.name,
    category: s.skill.category,
    score: s.score
  }));

  const results = activeRoles
    .filter((r) => r.roleSkills.length > 0)
    .map((r) =>
      matchRole({
        roleId: r.id,
        roleName: r.name,
        roleCategory: r.category,
        requirements: r.roleSkills.map((rs) => ({
          skillId: rs.skillId,
          name: rs.skill.name,
          category: rs.skill.category,
          requirement: rs.requirement as "REQUIRED" | "PREFERRED",
          minProficiency: rs.minProficiency,
          weight: rs.weight
        })),
        studentSkills
      })
    );

  const ranked = rankRoles(results);

  await prisma.roleMatch.deleteMany({ where: { userId } });
  if (ranked.length > 0) {
    await prisma.roleMatch.createMany({
      data: ranked.map((m) => ({
        userId,
        roleId: m.roleId,
        fitScore: m.fitScore,
        readinessScore: m.readinessScore,
        missingSkills: m.missingSkills,
        strengths: m.strengths,
        reasons: m.reasons
      }))
    });
  }

  return ranked;
}

export async function refreshRoadmap(userId: string, roleId: string | null, gaps: SkillGapResult[], roleName: string) {
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
    include: { items: true }
  });
  if (!roadmap) return;

  const [resources, assessments] = await Promise.all([
    prisma.learningResource.findMany({ where: { isActive: true } }),
    prisma.assessment.findMany({ where: { isActive: true }, select: { id: true, title: true, type: true, skillId: true } })
  ]);

  const resourcesBySkill: Record<string, { title: string; url: string }[]> = {};
  const resourcesByCategory: Record<string, { title: string; url: string }[]> = {};
  for (const r of resources) {
    const entry = { title: r.title, url: r.url };
    if (r.skillId) (resourcesBySkill[r.skillId] ??= []).push(entry);
    else (resourcesByCategory[r.type] ??= []).push(entry);
  }

  const assessmentsBySkill: Record<string, { id: string; title: string }[]> = {};
  const assessmentsByType: Record<string, { id: string; title: string }[]> = {};
  for (const a of assessments) {
    const entry = { id: a.id, title: a.title };
    if (a.skillId) (assessmentsBySkill[a.skillId] ??= []).push(entry);
    (assessmentsByType[a.type] ??= []).push(entry);
  }

  const plan = generateRoadmap({
    gaps,
    roleName,
    weeks: roadmap.weeks,
    startDate: new Date(),
    resourcesBySkill,
    resourcesByCategory,
    assessmentsBySkill,
    assessmentsByType
  });

  const completedMap = new Map(
    roadmap.items
      .filter((i) => i.status === "COMPLETED" || i.status === "SKIPPED")
      .map((i) => [`${i.skillId}:${i.week}`, i.status])
  );

  await prisma.roadmapItem.deleteMany({ where: { roadmapId: roadmap.id } });

  let order = 0;
  for (const item of plan.items) {
    const prevStatus = item.skillId ? completedMap.get(`${item.skillId}:${item.week}`) : undefined;
    await prisma.roadmapItem.create({
      data: {
        roadmapId: roadmap.id,
        skillId: item.skillId ?? null,
        week: item.week,
        title: item.title,
        objective: item.objective,
        tasks: item.tasks,
        estimatedMinutes: item.estimatedMinutes,
        difficulty: item.difficulty,
        resourceUrl: item.resourceUrl ?? null,
        resourceTitle: item.resourceTitle ?? null,
        assessmentId: item.assessmentId ?? null,
        order: order++,
        status: (prevStatus as "COMPLETED" | "SKIPPED") ?? "PENDING",
        completedAt: prevStatus === "COMPLETED" ? new Date() : null,
        dueDate: new Date(Date.now() + (item.week - 1) * 7 * 86400000 + 6 * 86400000)
      }
    });
  }

  await updateRoadmapProgress(roadmap.id);
}

export async function updateRoadmapProgress(roadmapId: string) {
  const roadmap = await prisma.roadmap.findUnique({ where: { id: roadmapId }, include: { items: true } });
  if (!roadmap || roadmap.items.length === 0) return;
  const completed = roadmap.items.filter((i) => i.status === "COMPLETED").length;
  const progress = Math.round((completed / roadmap.items.length) * 100);
  await prisma.roadmap.update({
    where: { id: roadmapId },
    data: { progress, status: progress === 100 ? "COMPLETED" : "ACTIVE" }
  });
}

/** Raise a skill score from an assessment and record history. Returns improvement amount. */
export async function applySkillScoreUpdate(params: {
  userId: string;
  skillId: string;
  newScore: number;
  source: string;
}): Promise<{ oldScore: number; newScore: number; improved: boolean }> {
  const { userId, skillId, newScore, source } = params;
  const existing = await prisma.studentSkill.findUnique({ where: { userId_skillId: { userId, skillId } } });
  const oldScore = existing?.score ?? 0;
  const blended = Math.round(oldScore * 0.6 + newScore * 0.4);
  const finalScore = Math.max(0, Math.min(100, blended));

  await prisma.studentSkill.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: { userId, skillId, level: existing?.level ?? 3, score: finalScore, source },
    update: { score: finalScore, source }
  });
  await prisma.skillScore.create({
    data: { userId, skillId, score: finalScore, source }
  });

  const improved = finalScore > oldScore;
  if (improved && oldScore > 0) {
    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    await notify({
      userId,
      type: "SKILL",
      title: "Skill improved",
      message: `Your ${skill?.name ?? "skill"} score moved from ${oldScore}% to ${finalScore}%. Keep going!`,
      link: "/student/skills"
    });
    await trackEvent(userId, "SKILL_IMPROVEMENT", { skillId, from: oldScore, to: finalScore });
  }

  return { oldScore, newScore: finalScore, improved };
}

export { TECH_CAT };
