import { prisma } from "@/lib/db";
import { generateRoadmap } from "@/engines/roadmap";
import { computeSkillGaps } from "@/engines/gap";
import type { SkillGapResult, StudentSkillData, RoleRequirement } from "@/engines/types";
import { updateRoadmapProgress } from "./analysis-service";
import { trackEvent } from "./analytics-service";
import { notify } from "./notifications-service";

export class RoadmapError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Create a roadmap for the student (based on current gaps + role). */
export async function ensureRoadmap(userId: string, weeks = 6) {
  const existing = await prisma.roadmap.findFirst({
    where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
    include: { items: true }
  });
  if (existing) return existing;

  const profile = await prisma.profile.findUnique({ where: { userId }, include: { targetRole: true } });
  const roleId = profile?.targetRoleId ?? null;
  if (!roleId) throw new RoadmapError("Select a target role before generating your roadmap.");

  const [studentSkills, roleSkills, resources, assessments] = await Promise.all([
    prisma.studentSkill.findMany({ where: { userId }, include: { skill: true } }),
    prisma.roleSkill.findMany({ where: { roleId }, include: { skill: true } }),
    prisma.learningResource.findMany({ where: { isActive: true } }),
    prisma.assessment.findMany({ where: { isActive: true }, select: { id: true, title: true, type: true, skillId: true } })
  ]);

  const skillData: StudentSkillData[] = studentSkills.map((s) => ({
    skillId: s.skillId,
    name: s.skill.name,
    category: s.skill.category,
    score: s.score
  }));
  const requirements: RoleRequirement[] = roleSkills.map((rs) => ({
    skillId: rs.skillId,
    name: rs.skill.name,
    category: rs.skill.category,
    requirement: rs.requirement as "REQUIRED" | "PREFERRED",
    minProficiency: rs.minProficiency,
    weight: rs.weight
  }));

  const gaps = computeSkillGaps({
    studentSkills: skillData,
    requirements,
    roleName: profile?.targetRole?.name ?? "your target role"
  });

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
    roleName: profile?.targetRole?.name ?? "your target role",
    weeks,
    startDate: new Date(),
    resourcesBySkill,
    resourcesByCategory,
    assessmentsBySkill,
    assessmentsByType
  });

  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      roleId,
      title: plan.title,
      weeks,
      status: "ACTIVE"
    }
  });

  let order = 0;
  for (const item of plan.items) {
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
        status: "PENDING",
        dueDate: new Date(Date.now() + (item.week - 1) * 7 * 86400000 + 6 * 86400000)
      }
    });
  }

  await notify({
    userId,
    type: "ROADMAP",
    title: "Your personalized roadmap is ready",
    message: `A ${weeks}-week plan for ${plan.title} has been generated from your current skill gaps. Start Week 1 today.`,
    link: "/student/roadmap"
  });

  return roadmap;
}

export async function getRoadmapWithItems(userId: string) {
  return prisma.roadmap.findFirst({
    where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
    include: {
      items: {
        include: { skill: true, assessment: true },
        orderBy: { order: "asc" }
      },
      role: true
    },
    orderBy: { updatedAt: "desc" }
  });
}

export async function updateItemStatus(userId: string, itemId: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED") {
  const item = await prisma.roadmapItem.findUnique({ where: { id: itemId }, include: { roadmap: true } });
  if (!item) throw new RoadmapError("Roadmap item not found", 404);
  if (item.roadmap.userId !== userId) throw new RoadmapError("Not authorized", 403);

  await prisma.roadmapItem.update({
    where: { id: itemId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : status === "PENDING" ? null : item.completedAt
    }
  });

  await updateRoadmapProgress(item.roadmapId);

  if (status === "COMPLETED") {
    await trackEvent(userId, "ROADMAP_ITEM_COMPLETED", { itemId, skillId: item.skillId, week: item.week });
    await prisma.progress.create({
      data: { userId, roadmapItemId: itemId, type: "ROADMAP_ITEM", status: "COMPLETED", points: 10 }
    });

    const roadmap = await prisma.roadmap.findUnique({ where: { id: item.roadmapId }, include: { items: true } });
    const completed = roadmap?.items.filter((i) => i.status === "COMPLETED").length ?? 0;
    const total = roadmap?.items.length ?? 1;
    const pct = Math.round((completed / total) * 100);
    if ([25, 50, 75, 100].includes(pct)) {
      await notify({
        userId,
        type: "MILESTONE",
        title: `Roadmap milestone: ${pct}%`,
        message: `You've completed ${pct}% of your roadmap. ${pct === 100 ? "Excellent — time to re-assess and update your readiness!" : "Keep the momentum going."}`,
        link: "/student/roadmap"
      });
    }
  }

  return item;
}

export async function markWeekComplete(userId: string, week: number) {
  const roadmap = await getRoadmapWithItems(userId);
  if (!roadmap) throw new RoadmapError("No active roadmap");
  const items = roadmap.items.filter((i) => i.week === week && i.status !== "COMPLETED" && i.status !== "SKIPPED");
  for (const item of items) {
    await updateItemStatus(userId, item.id, "COMPLETED");
  }
  return items.length;
}
