import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logAudit } from "./audit-service";

// ── Overview ──────────────────────────────────────────────────────
export async function adminStats() {
  const [
    users,
    students,
    faculty,
    admins,
    profiles,
    roles,
    skills,
    assessments,
    questions,
    resources,
    roadmaps,
    latestSnaps
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "FACULTY" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.profile.count(),
    prisma.role.count({ where: { isActive: true } }),
    prisma.skill.count({ where: { isActive: true } }),
    prisma.assessment.count({ where: { isActive: true } }),
    prisma.question.count(),
    prisma.learningResource.count({ where: { isActive: true } }),
    prisma.roadmap.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
    prisma.readinessSnapshot.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  const snapByUser = new Map<string, (typeof latestSnaps)[number]>();
  for (const s of latestSnaps) if (!snapByUser.has(s.userId)) snapByUser.set(s.userId, s);
  const scores = [...snapByUser.values()].map((s) => s.overall);
  const averageReadiness = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
  const placementReady = [...snapByUser.values()].filter((s) => s.overall >= 75).length;
  const atRisk = [...snapByUser.values()].filter((s) => s.overall < 50).length;

  const [gapGroups, avgScores, events] = await Promise.all([
    prisma.skillGap.groupBy({
      by: ["skillId", "status"],
      where: { status: { in: ["CRITICAL_GAP", "MAJOR_GAP"] } },
      _count: { _all: true }
    }),
    latestSnaps.length
      ? prisma.readinessSnapshot.groupBy({ by: ["userId"], _avg: { overall: true } })
      : Promise.resolve([]),
    prisma.analyticsEvent.groupBy({ by: ["type"], _count: { _all: true } })
  ]);

  const skillIds = gapGroups.map((g) => g.skillId);
  const skillsById = new Map((await prisma.skill.findMany({ where: { id: { in: skillIds } } })).map((s) => [s.id, s.name]));
  const gapAgg: Record<string, { skillId: string; name: string; count: number; status: string }> = {};
  for (const g of gapGroups) {
    const entry = (gapAgg[g.skillId] ??= { skillId: g.skillId, name: skillsById.get(g.skillId) ?? "Skill", count: 0, status: g.status });
    entry.count += g._count._all;
    if (g.status === "CRITICAL_GAP") entry.status = "CRITICAL_GAP";
  }
  const topGaps = Object.values(gapAgg)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    users,
    students,
    faculty,
    admins,
    profiles,
    roles,
    skills,
    assessments,
    questions,
    resources,
    roadmaps,
    averageReadiness,
    placementReady,
    atRisk,
    topGaps,
    events: events.map((e) => ({ type: e.type, count: e._count._all })).sort((a, b) => b.count - a.count)
  };
}

// ── Users ─────────────────────────────────────────────────────────
export interface AdminUserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listAdminUsers(f: AdminUserFilters = {}) {
  const page = f.page ?? 1;
  const pageSize = Math.min(f.pageSize ?? 25, 100);
  const where = {
    ...(f.role ? { role: f.role } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.search ? { OR: [{ name: { contains: f.search } }, { email: { contains: f.search } }] } : {})
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: { include: { department: true, batch: true, targetRole: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.user.count({ where })
  ]);
  const userIds = users.map((u) => u.id);
  const snaps = await prisma.readinessSnapshot.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: "desc" } });
  const snapByUser = new Map<string, (typeof snaps)[number]>();
  for (const s of snaps) if (!snapByUser.has(s.userId)) snapByUser.set(s.userId, s);

  return {
    rows: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      department: u.profile?.department?.name ?? null,
      batch: u.profile?.batch?.name ?? null,
      targetRole: u.profile?.targetRole?.name ?? null,
      readiness: snapByUser.get(u.id)?.overall ?? null
    })),
    total,
    page,
    pageSize
  };
}

export async function updateUser(actorId: string, userId: string, patch: { role?: string; status?: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (user.role === "ADMIN" && patch.role && patch.role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) throw new Error("Cannot demote the last admin account");
  }
  const updated = await prisma.user.update({ where: { id: userId }, data: patch });
  await logAudit(actorId, "USER_UPDATE", "User", userId, { role: patch.role, status: patch.status });
  return updated;
}

// ── Departments & batches ─────────────────────────────────────────
export async function listDepartments() {
  const [departments, batches] = await Promise.all([
    prisma.department.findMany({ include: { _count: { select: { profiles: true, batches: true } } }, orderBy: { name: "asc" } }),
    prisma.batch.findMany({ include: { department: true, _count: { select: { profiles: true } } }, orderBy: [{ year: "desc" }, { name: "asc" }] })
  ]);
  return { departments, batches };
}

export async function createDepartment(actorId: string, name: string, code: string) {
  const created = await prisma.department.create({ data: { institutionId: (await prisma.institution.findFirst())?.id ?? "demo-institution", name, code } });
  await logAudit(actorId, "DEPARTMENT_CREATE", "Department", created.id, { name, code });
  return created;
}

export async function createBatch(actorId: string, departmentId: string, name: string, year: number) {
  const created = await prisma.batch.create({ data: { departmentId, name, year } });
  await logAudit(actorId, "BATCH_CREATE", "Batch", created.id, { departmentId, name, year });
  return created;
}

export async function deleteDepartment(actorId: string, id: string) {
  await prisma.department.delete({ where: { id } });
  await logAudit(actorId, "DEPARTMENT_DELETE", "Department", id);
}

export async function deleteBatch(actorId: string, id: string) {
  await prisma.batch.delete({ where: { id } });
  await logAudit(actorId, "BATCH_DELETE", "Batch", id);
}

// ── Roles & requirements ──────────────────────────────────────────
export async function listRolesWithSkills() {
  return prisma.role.findMany({
    include: { roleSkills: { include: { skill: true } }, _count: { select: { profiles: true, assessments: true } } },
    orderBy: { name: "asc" }
  });
}

export async function createRole(actorId: string, data: { name: string; description?: string; category?: string }) {
  const created = await prisma.role.create({ data });
  await logAudit(actorId, "ROLE_CREATE", "Role", created.id, { name: data.name });
  return created;
}

export async function updateRole(actorId: string, id: string, data: { name?: string; description?: string | null; category?: string | null; isActive?: boolean }) {
  const updated = await prisma.role.update({ where: { id }, data });
  await logAudit(actorId, "ROLE_UPDATE", "Role", id, data);
  return updated;
}

export async function deleteRole(actorId: string, id: string) {
  await prisma.role.delete({ where: { id } });
  await logAudit(actorId, "ROLE_DELETE", "Role", id);
}

export async function setRoleSkill(actorId: string, roleId: string, skillId: string, requirement: "REQUIRED" | "PREFERRED", minProficiency: number, weight: number) {
  const upserted = await prisma.roleSkill.upsert({
    where: { roleId_skillId: { roleId, skillId } },
    create: { roleId, skillId, requirement, minProficiency, weight },
    update: { requirement, minProficiency, weight }
  });
  await logAudit(actorId, "ROLE_SKILL_SET", "RoleSkill", upserted.id, { roleId, skillId, requirement, minProficiency, weight });
  return upserted;
}

export async function removeRoleSkill(actorId: string, roleId: string, skillId: string) {
  await prisma.roleSkill.deleteMany({ where: { roleId, skillId } });
  await logAudit(actorId, "ROLE_SKILL_REMOVE", "RoleSkill", `${roleId}:${skillId}`);
}

// ── Skills ────────────────────────────────────────────────────────
export async function listSkills() {
  return prisma.skill.findMany({ include: { _count: { select: { roleSkills: true, studentSkills: true, questionSkills: true } } }, orderBy: { category: "asc" } });
}

export async function createSkill(actorId: string, data: { name: string; category: string; description?: string }) {
  const created = await prisma.skill.create({ data });
  await logAudit(actorId, "SKILL_CREATE", "Skill", created.id, { name: data.name, category: data.category });
  return created;
}

export async function updateSkill(actorId: string, id: string, data: { name?: string; category?: string; description?: string | null; isActive?: boolean }) {
  const updated = await prisma.skill.update({ where: { id }, data });
  await logAudit(actorId, "SKILL_UPDATE", "Skill", id, data);
  return updated;
}

export async function deleteSkill(actorId: string, id: string) {
  await prisma.skill.delete({ where: { id } });
  await logAudit(actorId, "SKILL_DELETE", "Skill", id);
}

// ── Assessments & questions ───────────────────────────────────────
export async function listAssessments() {
  return prisma.assessment.findMany({
    include: { role: true, skill: true, _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function createAssessment(actorId: string, data: {
  title: string; description?: string; type: string; difficulty?: string;
  durationMinutes?: number; passScore?: number; roleId?: string | null; skillId?: string | null;
}) {
  const created = await prisma.assessment.create({ data: { ...data, totalMarks: 10 } });
  await logAudit(actorId, "ASSESSMENT_CREATE", "Assessment", created.id, { title: data.title });
  return created;
}

export async function updateAssessment(actorId: string, id: string, data: Partial<{
  title: string; description: string | null; type: string; difficulty: string;
  durationMinutes: number; passScore: number; isActive: boolean; roleId: string | null; skillId: string | null;
}>) {
  const updated = await prisma.assessment.update({ where: { id }, data });
  await logAudit(actorId, "ASSESSMENT_UPDATE", "Assessment", id, data);
  return updated;
}

export async function deleteAssessment(actorId: string, id: string) {
  await prisma.assessment.delete({ where: { id } });
  await logAudit(actorId, "ASSESSMENT_DELETE", "Assessment", id);
}

export async function listQuestions(assessmentId: string) {
  return prisma.question.findMany({
    where: { assessmentId },
    include: { questionSk: { include: { skill: true } } },
    orderBy: { createdAt: "asc" }
  });
}

export async function createQuestion(actorId: string, data: {
  assessmentId: string; text: string; type: string; options?: unknown;
  correctAnswer?: unknown; marks?: number; difficulty?: string; explanation?: string; skillIds?: string[];
}) {
  const { skillIds, ...rest } = data;
  const created = await prisma.question.create({
    data: {
      ...rest,
      options: data.options == null ? undefined : (data.options as Prisma.InputJsonValue),
      correctAnswer: data.correctAnswer == null ? undefined : (data.correctAnswer as Prisma.InputJsonValue),
      questionSk: skillIds?.length
        ? { create: skillIds.map((skillId) => ({ skillId })) }
        : undefined
    }
  });
  await logAudit(actorId, "QUESTION_CREATE", "Question", created.id, { assessmentId: data.assessmentId });
  return created;
}

export async function updateQuestion(actorId: string, id: string, data: Partial<{
  text: string; type: string; options: unknown; correctAnswer: unknown;
  marks: number; difficulty: string; explanation: string | null; skillIds?: string[];
}>) {
  const { skillIds, ...rest } = data;
  const update: Prisma.QuestionUpdateInput = {};
  if (rest.text !== undefined) update.text = rest.text;
  if (rest.type !== undefined) update.type = rest.type;
  if (rest.marks !== undefined) update.marks = rest.marks;
  if (rest.difficulty !== undefined) update.difficulty = rest.difficulty;
  if (rest.explanation !== undefined) update.explanation = rest.explanation;
  if (rest.options !== undefined) update.options = rest.options === null ? Prisma.JsonNull : (rest.options as Prisma.InputJsonValue);
  if (rest.correctAnswer !== undefined) update.correctAnswer = rest.correctAnswer === null ? Prisma.JsonNull : (rest.correctAnswer as Prisma.InputJsonValue);
  const updated = await prisma.question.update({
    where: { id },
    data: update
  });
  if (skillIds) {
    await prisma.questionSkill.deleteMany({ where: { questionId: id } });
    if (skillIds.length) {
      await prisma.questionSkill.createMany({ data: skillIds.map((skillId) => ({ questionId: id, skillId })) });
    }
  }
  await logAudit(actorId, "QUESTION_UPDATE", "Question", id, { text: data.text });
  return updated;
}

export async function deleteQuestion(actorId: string, id: string) {
  await prisma.question.delete({ where: { id } });
  await logAudit(actorId, "QUESTION_DELETE", "Question", id);
}

// ── Learning resources ────────────────────────────────────────────
export async function listResources() {
  return prisma.learningResource.findMany({ include: { skill: true }, orderBy: { createdAt: "desc" } });
}

export async function createResource(actorId: string, data: { title: string; url: string; type?: string; difficulty?: string; description?: string; skillId?: string | null }) {
  const created = await prisma.learningResource.create({ data });
  await logAudit(actorId, "RESOURCE_CREATE", "LearningResource", created.id, { title: data.title });
  return created;
}

export async function updateResource(actorId: string, id: string, data: Partial<{ title: string; url: string; type: string; difficulty: string; description: string | null; skillId: string | null; isActive: boolean }>) {
  const updated = await prisma.learningResource.update({ where: { id }, data });
  await logAudit(actorId, "RESOURCE_UPDATE", "LearningResource", id);
  return updated;
}

export async function deleteResource(actorId: string, id: string) {
  await prisma.learningResource.delete({ where: { id } });
  await logAudit(actorId, "RESOURCE_DELETE", "LearningResource", id);
}

// ── Settings ──────────────────────────────────────────────────────
export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.platformSetting.findMany();
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function saveSettings(actorId: string, patch: Record<string, unknown>) {
  for (const [key, value] of Object.entries(patch)) {
    await prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object }
    });
  }
  await logAudit(actorId, "SETTINGS_UPDATE", "PlatformSetting", null, { keys: Object.keys(patch) });
}
