import { requireRole } from "@/lib/auth";
import { listRolesWithSkills } from "@/services/admin-service";
import { prisma } from "@/lib/db";
import { RolesClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireRole("ADMIN");
  const [roles, skills] = await Promise.all([
    listRolesWithSkills(),
    prisma.skill.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);
  return <RolesClient initialRoles={roles} skills={skills} />;
}
