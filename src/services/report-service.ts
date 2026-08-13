import { prisma } from "@/lib/db";
import { computeReadinessComponents, computeOverallReadiness, mergeWeights } from "@/engines/readiness";
import { computeSkillGaps } from "@/engines/gap";
import { safeJsonParse } from "@/lib/utils";
import { assessmentScoresFromAttempts, computeProfileCompleteness } from "./analysis-service";

export async function buildStudentReport(userId: string) {
  const [user, profile, skills, gaps, attempts, snapshots, roadmap, roleMatches, projects, certifications, resume] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.profile.findUnique({ where: { userId }, include: { targetRole: true, department: true, batch: true, institution: true } }),
      prisma.studentSkill.findMany({ where: { userId }, include: { skill: true }, orderBy: { score: "desc" } }),
      prisma.skillGap.findMany({ where: { userId }, include: { skill: true, role: true }, orderBy: { priority: "desc" } }),
      prisma.assessmentAttempt.findMany({ where: { userId, status: "SUBMITTED" }, include: { assessment: true }, orderBy: { submittedAt: "desc" } }),
      prisma.readinessSnapshot.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 20 }),
      prisma.roadmap.findFirst({ where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } }, include: { items: true, role: true } }),
      prisma.roleMatch.findMany({ where: { userId }, include: { role: true }, orderBy: { fitScore: "desc" }, take: 6 }),
      prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.certification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.resume.findFirst({ where: { userId }, orderBy: { uploadedAt: "desc" } })
    ]);

  const studentSkills = skills.map((s) => ({
    skillId: s.skillId,
    name: s.skill.name,
    category: s.skill.category,
    score: s.score
  }));
  const assessmentScores = assessmentScoresFromAttempts(attempts);
  const latestSnapshot = snapshots[snapshots.length - 1];

  const evidence = {
    skills: studentSkills,
    assessmentScores,
    projects: projects.length ? { count: projects.length, completed: projects.filter((p) => p.status === "COMPLETED").length, advancedCount: projects.filter((p) => p.difficulty === "ADVANCED").length } : null,
    resumeUploaded: Boolean(resume),
    resumeExtractionApplied: false,
    profileComplete: computeProfileCompleteness(profile)
  };
  const components = computeReadinessComponents(evidence);
  const settings = await prisma.platformSetting.findUnique({ where: { key: "readiness_weights" } });
  const weights = mergeWeights(safeJsonParse(settings?.value, {}));
  components.overall = computeOverallReadiness(components, weights);

  const improvement =
    snapshots.length >= 2
      ? latestSnapshot!.overall - snapshots[0].overall
      : snapshots.length === 1
        ? latestSnapshot!.overall - 0
        : 0;

  return {
    user,
    profile,
    skills,
    gaps,
    attempts,
    snapshots,
    readiness: components,
    improvement,
    roadmap,
    roleMatches,
    projects,
    certifications,
    resume,
    assessmentScores
  };
}
