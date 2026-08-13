import { prisma } from "@/lib/db";
import { notify } from "./notifications-service";
import { trackEvent } from "./analytics-service";

export interface FacultyFilters {
  departmentId?: string;
  batchId?: string;
  targetRoleId?: string;
  skillId?: string;
  assessmentId?: string;
  minReadiness?: number;
  maxReadiness?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Faculty are scoped to their institution + department (falling back to their batch). */
export async function getFacultyScope(facultyId: string) {
  const profile = await prisma.profile.findUnique({ where: { userId: facultyId } });
  return {
    institutionId: profile?.institutionId ?? null,
    departmentId: profile?.departmentId ?? null,
    batchId: profile?.batchId ?? null
  };
}

function buildProfileWhere(scope: { institutionId: string | null; departmentId: string | null; batchId: string | null }, f: FacultyFilters) {
  const where: Record<string, unknown> = {};
  if (scope.institutionId) where.institutionId = scope.institutionId;
  if (f.departmentId) where.departmentId = f.departmentId;
  else if (f.batchId) where.batchId = f.batchId;
  else if (scope.batchId) where.batchId = scope.batchId;
  else if (scope.departmentId) where.departmentId = scope.departmentId;
  if (f.targetRoleId) where.targetRoleId = f.targetRoleId;
  return where;
}

export async function listFacultyStudents(facultyId: string, f: FacultyFilters = {}) {
  const scope = await getFacultyScope(facultyId);
  const where = buildProfileWhere(scope, f);
  const page = f.page ?? 1;
  const pageSize = Math.min(f.pageSize ?? 50, 100);

  // Students with readiness scores derived from their latest snapshot.
  const profiles = await prisma.profile.findMany({
    where: {
      ...where,
      user: { role: "STUDENT", status: "ACTIVE", name: f.search ? { contains: f.search } : undefined }
    },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      targetRole: true,
      batch: true,
      department: true
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  const ids = profiles.map((p) => p.userId);

  const [latestSnaps, gapCounts, attempts, roadmaps] = await Promise.all([
    prisma.readinessSnapshot.findMany({
      where: { userId: { in: ids } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.skillGap.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: { in: ["CRITICAL_GAP", "MAJOR_GAP"] } },
      _count: { _all: true }
    }),
    prisma.assessmentAttempt.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, status: "SUBMITTED" },
      _count: { _all: true }
    }),
    prisma.roadmap.findMany({
      where: { userId: { in: ids }, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: { userId: true, progress: true }
    })
  ]);

  const snapByUser = new Map<string, (typeof latestSnaps)[number]>();
  for (const s of latestSnaps) if (!snapByUser.has(s.userId)) snapByUser.set(s.userId, s);
  const gapCountByUser = new Map(gapCounts.map((g) => [g.userId, g._count._all]));
  const attemptCountByUser = new Map(attempts.map((a) => [a.userId, a._count._all]));
  const roadmapByUser = new Map(roadmaps.map((r) => [r.userId, r.progress]));

  let rows = profiles.map((p) => {
    const snap = snapByUser.get(p.userId);
    const readiness = snap?.overall ?? null;
    return {
      userId: p.userId,
      name: p.user.name,
      email: p.user.email,
      roleName: p.targetRole?.name ?? null,
      batchName: p.batch?.name ?? null,
      departmentName: p.department?.name ?? null,
      readiness,
      criticalGaps: gapCountByUser.get(p.userId) ?? 0,
      attempts: attemptCountByUser.get(p.userId) ?? 0,
      roadmapProgress: roadmapByUser.get(p.userId) ?? 0
    };
  });

  if (f.minReadiness !== undefined) rows = rows.filter((r) => r.readiness !== null && r.readiness >= (f.minReadiness ?? 0));
  if (f.maxReadiness !== undefined) rows = rows.filter((r) => r.readiness !== null && r.readiness <= (f.maxReadiness ?? 100));

  if (f.skillId) {
    const withSkill = await prisma.skillGap.findMany({
      where: { userId: { in: ids }, skillId: f.skillId },
      select: { userId: true }
    });
    const ok = new Set(withSkill.map((g) => g.userId));
    rows = rows.filter((r) => ok.has(r.userId));
  }

  if (f.assessmentId) {
    const took = await prisma.assessmentAttempt.findMany({
      where: { userId: { in: ids }, assessmentId: f.assessmentId },
      select: { userId: true },
      distinct: ["userId"]
    });
    const ok = new Set(took.map((a) => a.userId));
    rows = rows.filter((r) => ok.has(r.userId));
  }

  // Filter by search name/email
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }

  const total = await prisma.profile.count({ where: { ...where, user: { role: "STUDENT", status: "ACTIVE" } } });

  return { rows, total, page, pageSize, scope };
}

export interface BatchAnalytics {
  totalStudents: number;
  averageReadiness: number | null;
  placementReady: number;
  atRisk: number;
  averageScores: { technical: number | null; coding: number | null; aptitude: number | null; communication: number | null; interview: number | null; projects: number | null; resume: number | null };
  commonGaps: { skillId: string; name: string; count: number; status: string }[];
  roleWise: { roleId: string | null; name: string; count: number; averageReadiness: number | null }[];
  roadmapCompletion: number | null;
  assessmentParticipation: number | null;
  departmentWise: { departmentId: string | null; name: string; count: number; averageReadiness: number | null }[];
  recentImprovements: { userId: string; name: string; from: number; to: number; delta: number }[];
}

export async function getFacultyAnalytics(facultyId: string, f: FacultyFilters = {}): Promise<BatchAnalytics> {
  const scope = await getFacultyScope(facultyId);
  const where = buildProfileWhere(scope, f);

  const profiles = await prisma.profile.findMany({
    where: { ...where, user: { role: "STUDENT", status: "ACTIVE" } },
    select: {
      userId: true,
      targetRole: true,
      department: true,
      user: { select: { id: true, name: true } }
    }
  });
  const ids = profiles.map((p) => p.userId);

  const latestSnaps = await prisma.readinessSnapshot.findMany({
    where: { userId: { in: ids } },
    orderBy: { createdAt: "desc" }
  });
  const snapByUser = new Map<string, (typeof latestSnaps)[number]>();
  for (const s of latestSnaps) if (!snapByUser.has(s.userId)) snapByUser.set(s.userId, s);

  const readinessScores = latestSnaps.map((s) => s.overall).filter((v): v is number => v !== null);
  const averageReadiness = readinessScores.length ? Math.round((readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length) * 10) / 10 : null;
  const placementReady = latestSnaps.filter((s) => s.overall >= 75).length;
  const atRisk = latestSnaps.filter((s) => s.overall < 50).length;

  const avg = (key: keyof (typeof latestSnaps)[number]) => {
    const vals = latestSnaps.map((s) => s[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };

  // Common gaps across the batch
  const gapGroups = await prisma.skillGap.groupBy({
    by: ["skillId", "status"],    where: { userId: { in: ids }, status: { in: ["CRITICAL_GAP", "MAJOR_GAP"] } },
    _count: { _all: true }
  });
  const skills = await prisma.skill.findMany({ where: { id: { in: gapGroups.map((g) => g.skillId) } } });
  const skillName = new Map(skills.map((s) => [s.id, s.name]));
  const gapAgg: Record<string, { skillId: string; name: string; count: number; status: string }> = {};
  for (const g of gapGroups) {
    const entry = (gapAgg[g.skillId] ??= { skillId: g.skillId, name: skillName.get(g.skillId) ?? "Skill", count: 0, status: g.status });
    entry.count += g._count._all;
    if (g.status === "CRITICAL_GAP") entry.status = "CRITICAL_GAP";
  }
  const commonGaps = Object.values(gapAgg)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((g) => ({ ...g, status: g.status === "CRITICAL_GAP" ? "CRITICAL" : "MAJOR" }));

  // Role-wise readiness
  const roleWise = profiles.reduce<Record<string, { roleId: string | null; name: string; count: number; readiness: number[] }>>((acc, p) => {
    const key = p.targetRole?.id ?? "none";
    const entry = (acc[key] ??= { roleId: p.targetRole?.id ?? null, name: p.targetRole?.name ?? "No role", count: 0, readiness: [] });
    entry.count += 1;
    const snap = snapByUser.get(p.userId);
    if (snap) entry.readiness.push(snap.overall);
    return acc;
  }, {});
  const roleWiseOut = Object.values(roleWise).map((r) => ({
    roleId: r.roleId,
    name: r.name,
    count: r.count,
    averageReadiness: r.readiness.length ? Math.round((r.readiness.reduce((a, b) => a + b, 0) / r.readiness.length) * 10) / 10 : null
  })).sort((a, b) => b.count - a.count);

  // Department-wise
  const depWise = profiles.reduce<Record<string, { departmentId: string | null; name: string; count: number; readiness: number[] }>>((acc, p) => {
    const key = p.department?.id ?? "none";
    const entry = (acc[key] ??= { departmentId: p.department?.id ?? null, name: p.department?.name ?? "No department", count: 0, readiness: [] });
    entry.count += 1;
    const snap = snapByUser.get(p.userId);
    if (snap) entry.readiness.push(snap.overall);
    return acc;
  }, {});
  const departmentWise = Object.values(depWise).map((d) => ({
    departmentId: d.departmentId,
    name: d.name,
    count: d.count,
    averageReadiness: d.readiness.length ? Math.round((d.readiness.reduce((a, b) => a + b, 0) / d.readiness.length) * 10) / 10 : null
  })).sort((a, b) => b.count - a.count);

  // Roadmap + assessment participation
  const [roadmaps, attemptCount] = await Promise.all([
    prisma.roadmap.findMany({ where: { userId: { in: ids }, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { progress: true } }),
    prisma.assessmentAttempt.count({ where: { userId: { in: ids }, status: "SUBMITTED" } })
  ]);
  const roadmapCompletion = roadmaps.length ? Math.round((roadmaps.reduce((a, r) => a + r.progress, 0) / roadmaps.length) * 10) / 10 : null;
  const assessmentParticipation = ids.length ? Math.round((attemptCount / ids.length) * 100) : null;

  // Most improved students
  const snapsAsc = await prisma.readinessSnapshot.findMany({ where: { userId: { in: ids } }, orderBy: { createdAt: "asc" } });
  const firstByUser = new Map<string, (typeof snapsAsc)[number]>();
  for (const s of snapsAsc) if (!firstByUser.has(s.userId)) firstByUser.set(s.userId, s);
  const recentImprovements = profiles
    .map((p) => {
      const latest = snapByUser.get(p.userId);
      const first = firstByUser.get(p.userId);
      if (!latest || !first) return null;
      const delta = latest.overall - first.overall;
      return { userId: p.userId, name: p.user.name, from: first.overall, to: latest.overall, delta };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null && x.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  return {
    totalStudents: ids.length,
    averageReadiness,
    placementReady,
    atRisk,
    averageScores: {
      technical: avg("technical"),
      coding: avg("coding"),
      aptitude: avg("aptitude"),
      communication: avg("communication"),
      interview: avg("interview"),
      projects: avg("projects"),
      resume: avg("resume")
    },
    commonGaps,
    roleWise: roleWiseOut,
    roadmapCompletion,
    assessmentParticipation,
    departmentWise,
    recentImprovements
  };
}

export async function getFacultyStudentDetail(facultyId: string, studentId: string) {
  const scope = await getFacultyScope(facultyId);
  const profile = await prisma.profile.findUnique({
    where: { userId: studentId },
    include: {
      user: true,
      targetRole: true,
      department: true,
      batch: true,
      institution: true
    }
  });
  if (!profile || profile.user.role !== "STUDENT") return null;
  if (scope.institutionId && profile.institutionId !== scope.institutionId) return null;
  if (scope.departmentId && profile.departmentId && profile.departmentId !== scope.departmentId) return null;

  const [skills, gaps, attempts, snapshots, roadmap, projects, notes, certifications] = await Promise.all([
    prisma.studentSkill.findMany({ where: { userId: studentId }, include: { skill: true }, orderBy: { score: "desc" } }),
    prisma.skillGap.findMany({ where: { userId: studentId }, include: { skill: true, role: true }, orderBy: { priority: "desc" } }),
    prisma.assessmentAttempt.findMany({ where: { userId: studentId, status: "SUBMITTED" }, include: { assessment: true }, orderBy: { submittedAt: "desc" }, take: 12 }),
    prisma.readinessSnapshot.findMany({ where: { userId: studentId }, orderBy: { createdAt: "asc" }, take: 30 }),
    prisma.roadmap.findFirst({ where: { userId: studentId, status: { in: ["ACTIVE", "COMPLETED"] } }, include: { items: { orderBy: { week: "asc" } } } }),
    prisma.project.findMany({ where: { userId: studentId }, orderBy: { createdAt: "desc" } }),
    prisma.facultyNote.findMany({ where: { studentId }, include: { faculty: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.certification.findMany({ where: { userId: studentId } })
  ]);

  const latest = snapshots[snapshots.length - 1];
  const first = snapshots[0];
  const trend = snapshots.map((s) => ({ date: s.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), overall: s.overall }));

  return {
    profile,
    skills,
    gaps,
    attempts,
    snapshots,
    latest,
    first,
    trend,
    improvement: latest && first ? latest.overall - first.overall : 0,
    roadmap,
    projects,
    notes,
    certifications
  };
}

export async function addFacultyNote(facultyId: string, studentId: string, note: string) {
  const detail = await getFacultyStudentDetail(facultyId, studentId);
  if (!detail) return null;

  const created = await prisma.facultyNote.create({
    data: { facultyId, studentId, content: note }
  });

  await notify({
    userId: studentId,
    type: "INTERVENTION",
    title: "Faculty note added",
    message: "A faculty member added an intervention note to your profile.",
    link: "/student"
  });
  await trackEvent(facultyId, "FACULTY_NOTE", { studentId });

  return created;
}
