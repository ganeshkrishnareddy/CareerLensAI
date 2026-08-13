import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function FacultyStudentsPage() {
  await requireRole("FACULTY", "ADMIN");
  const [departments, batches, roles, skills, assessments] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.batch.findMany({ orderBy: { year: "desc" } }),
    prisma.role.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.assessment.findMany({ where: { isActive: true }, orderBy: { title: "asc" } })
  ]);

  return (
    <StudentsClient
      filters={{
        departments: departments.map((d) => ({ id: d.id, name: d.name })),
        batches: batches.map((b) => ({ id: b.id, name: b.name })),
        roles: roles.map((r) => ({ id: r.id, name: r.name })),
        skills: skills.map((s) => ({ id: s.id, name: s.name })),
        assessments: assessments.map((a) => ({ id: a.id, title: a.title }))
      }}
    />
  );
}
