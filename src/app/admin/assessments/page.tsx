import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listAssessments } from "@/services/admin-service";
import { prisma } from "@/lib/db";
import { AssessmentsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminAssessmentsPage() {
  await requireRole("ADMIN");
  const [assessments, roles, skills] = await Promise.all([
    listAssessments(),
    prisma.role.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);
  return <AssessmentsClient initial={assessments} roles={roles} skills={skills} />;
}
