import Link from "next/link";
import { Award, FolderGit2, UserCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge, EmptyState, statusBadgeColor } from "@/components/ui/ui";
import { formatDate } from "@/lib/utils";
import { ProfileForm, ProjectForm, CertificationForm, DeleteButton } from "./client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireRole("STUDENT");
  const [profile, projects, certifications, departments, batches, roles] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true, department: true, batch: true } }),
    prisma.project.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } }),
    prisma.certification.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.batch.findMany({ orderBy: { name: "desc" } }),
    prisma.role.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  const batchesForDept = batches.filter((b) => !profile?.departmentId || b.departmentId === profile.departmentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">My Profile</h1>
        <p className="mt-1 text-sm text-ink-500">Keep your profile complete — it feeds your readiness score and role matching.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
            <UserCircle className="h-4.5 w-4.5 text-brand-600" /> Personal details
          </h2>
          <ProfileForm
            profile={profile}
            departments={departments}
            batches={batchesForDept}
            roles={roles}
          />
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
                <FolderGit2 className="h-4.5 w-4.5 text-brand-600" /> Projects
              </h2>
              <ProjectForm />
            </div>
            {projects.length === 0 ? (
              <p className="mt-4 text-sm text-ink-400">No projects yet. Add the projects that show off your skills.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {projects.map((p) => (
                  <div key={p.id} className="rounded-xl border border-ink-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-ink-900">{p.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-500">{p.description}</p>
                      </div>
                      <DeleteButton kind="project" id={p.id} label="project" />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Badge color={statusBadgeColor(p.status)}>{p.status.replace(/_/g, " ")}</Badge>
                      {p.difficulty && <Badge color="slate">{p.difficulty}</Badge>}
                      {Array.isArray(p.technologies) && (p.technologies as string[]).map((t) => (
                        <span key={t} className="rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">{t}</span>
                      ))}
                      {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-brand-600 hover:underline">GitHub</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
                <Award className="h-4.5 w-4.5 text-brand-600" /> Certifications
              </h2>
              <CertificationForm />
            </div>
            {certifications.length === 0 ? (
              <p className="mt-4 text-sm text-ink-400">No certifications yet. Certifications strengthen your resume component.</p>
            ) : (
              <div className="mt-4 space-y-2.5">
                {certifications.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-ink-800">{c.name}</p>
                      <p className="text-[11px] text-ink-400">{c.issuer ?? "—"}{c.date ? ` · ${formatDate(c.date)}` : ""}</p>
                    </div>
                    <DeleteButton kind="certification" id={c.id} label="certification" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="border-brand-200 bg-brand-50/40 p-5">
        <p className="text-sm text-ink-700">
          💡 <b>Tip:</b> Your profile completeness ({Math.round(([profile?.phone, profile?.college, profile?.university, profile?.graduationYear, profile?.cgpa, profile?.location, profile?.targetRoleId, profile?.departmentId, profile?.batchId].filter(Boolean).length / 9) * 100)}%) feeds your Resume readiness component.{" "}
          <Link href="/student/resume" className="font-semibold text-brand-600 hover:underline">Upload your resume</Link> to boost it further.
        </p>
      </Card>
    </div>
  );
}
