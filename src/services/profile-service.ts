import { prisma } from "@/lib/db";
import { z } from "zod";
import { levelToScore } from "@/lib/catalog";
import { trackEvent } from "./analytics-service";
import { notify } from "./notifications-service";
import { recomputeAnalysis } from "./analysis-service";

export class ProfileError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const profileSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  college: z.string().max(120).optional().nullable(),
  university: z.string().max(120).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  graduationYear: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
  cgpa: z.coerce.number().min(0).max(10).optional().nullable(),
  location: z.string().max(80).optional().nullable(),
  bio: z.string().max(500).optional().nullable()
});

export async function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) throw new ProfileError(parsed.error.issues[0]?.message ?? "Invalid profile data");
  const data = parsed.data;

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data
  });
  return profile;
}

export async function setTargetRole(userId: string, roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new ProfileError("Role not found", 404);
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, targetRoleId: roleId },
    update: { targetRoleId: roleId }
  });
  await trackEvent(userId, "ROLE_SELECTED", { roleId, roleName: role.name });
  await recomputeAnalysis(userId, { refreshRoadmap: false });
  return role;
}

/** Add or update a student skill with a self-reported level. */
export async function upsertSkill(userId: string, skillId: string, level: number) {
  if (level < 0 || level > 5) throw new ProfileError("Proficiency level must be 0–5");
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new ProfileError("Skill not found", 404);
  const score = levelToScore(level);
  const existing = await prisma.studentSkill.findUnique({ where: { userId_skillId: { userId, skillId } } });
  await prisma.studentSkill.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: { userId, skillId, level, score, source: "SELF" },
    update: { level, score, source: existing?.source === "SELF" ? "SELF" : existing?.source }
  });
  if (!existing) {
    await prisma.skillScore.create({ data: { userId, skillId, score, source: "SELF" } });
  }
  return skill;
}

export async function removeSkill(userId: string, skillId: string) {
  await prisma.studentSkill.deleteMany({ where: { userId, skillId } });
}

export const projectSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional().nullable(),
  technologies: z.array(z.string()).max(20).optional().nullable(),
  role: z.string().max(80).optional().nullable(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional().nullable(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).default("IN_PROGRESS"),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  demoUrl: z.string().url().optional().nullable().or(z.literal(""))
});

export async function createProject(userId: string, input: z.infer<typeof projectSchema>) {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) throw new ProfileError(parsed.error.issues[0]?.message ?? "Invalid project data");
  return prisma.project.create({
    data: {
      userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      technologies: (parsed.data.technologies as object) ?? undefined,
      role: parsed.data.role ?? null,
      difficulty: parsed.data.difficulty ?? null,
      status: parsed.data.status,
      githubUrl: parsed.data.githubUrl || null,
      demoUrl: parsed.data.demoUrl || null
    }
  });
}

export async function updateProject(userId: string, projectId: string, input: z.infer<typeof projectSchema>) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== userId) throw new ProfileError("Project not found", 404);
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) throw new ProfileError(parsed.error.issues[0]?.message ?? "Invalid project data");
  return prisma.project.update({
    where: { id: projectId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      technologies: (parsed.data.technologies as object) ?? undefined,
      role: parsed.data.role ?? null,
      difficulty: parsed.data.difficulty ?? null,
      status: parsed.data.status,
      githubUrl: parsed.data.githubUrl || null,
      demoUrl: parsed.data.demoUrl || null
    }
  });
}

export async function deleteProject(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== userId) throw new ProfileError("Project not found", 404);
  await prisma.project.delete({ where: { id: projectId } });
}

export const certificationSchema = z.object({
  name: z.string().min(2).max(140),
  issuer: z.string().max(120).optional().nullable(),
  date: z.coerce.date().optional().nullable(),
  credentialUrl: z.string().url().optional().nullable().or(z.literal(""))
});

export async function createCertification(userId: string, input: z.infer<typeof certificationSchema>) {
  const parsed = certificationSchema.safeParse(input);
  if (!parsed.success) throw new ProfileError(parsed.error.issues[0]?.message ?? "Invalid certification data");
  return prisma.certification.create({
    data: {
      userId,
      name: parsed.data.name,
      issuer: parsed.data.issuer ?? null,
      date: parsed.data.date ?? null,
      credentialUrl: parsed.data.credentialUrl || null
    }
  });
}

export async function deleteCertification(userId: string, certificationId: string) {
  const cert = await prisma.certification.findUnique({ where: { id: certificationId } });
  if (!cert || cert.userId !== userId) throw new ProfileError("Certification not found", 404);
  await prisma.certification.delete({ where: { id: certificationId } });
}

export async function getOnboardingState(userId: string) {
  const [profile, skills, projects, certifications, role] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.studentSkill.count({ where: { userId } }),
    prisma.project.count({ where: { userId } }),
    prisma.certification.count({ where: { userId } }),
    prisma.role.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);
  return { profile, skillCount: skills, projectCount: projects, certificationCount: certifications, roles: role };
}

export async function completeOnboarding(userId: string) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, onboardingCompleted: true },
    update: { onboardingCompleted: true, onboardingStep: 7 }
  });
  await trackEvent(userId, "PROFILE_COMPLETION", {});
  await notify({
    userId,
    type: "SYSTEM",
    title: "Profile complete 🎉",
    message: "Your profile is set up. Take an assessment to power your skill-gap analysis.",
    link: "/student/assessments"
  });
  return profile;
}
