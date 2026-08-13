import { requireRole } from "@/lib/auth";
import { listResources } from "@/services/admin-service";
import { prisma } from "@/lib/db";
import { ResourcesClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  await requireRole("ADMIN");
  const [resources, skills] = await Promise.all([
    listResources(),
    prisma.skill.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);
  return <ResourcesClient initial={resources} skills={skills} />;
}
