import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireRole("STUDENT");
  const [profile, roles, skills, departments, batches] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true } }),
    prisma.role.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.batch.findMany({ orderBy: { name: "desc" } })
  ]);

  if (profile?.onboardingCompleted) {
    redirect("/student");
  }

  return (
    <div className="min-h-screen bg-ink-50/70 py-8">
      <OnboardingWizard
        initialProfile={profile}
        roles={roles.map((r) => ({ id: r.id, name: r.name, description: r.description, category: r.category }))}
        skills={skills.map((s) => ({ id: s.id, name: s.name, category: s.category }))}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
        batches={batches.map((b) => ({ id: b.id, name: b.name, departmentId: b.departmentId }))}
      />
    </div>
  );
}
