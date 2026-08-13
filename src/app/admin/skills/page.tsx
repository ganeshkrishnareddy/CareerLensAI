import { requireRole } from "@/lib/auth";
import { listSkills } from "@/services/admin-service";
import { SkillsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  await requireRole("ADMIN");
  const skills = await listSkills();
  return <SkillsClient initial={skills} />;
}
