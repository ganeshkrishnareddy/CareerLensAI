import Link from "next/link";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, Badge, ProgressBar, EmptyState, statusBadgeColor } from "@/components/ui/ui";
import { SkillRadar, SimpleBars } from "@/components/charts";
import { CATEGORY_LABEL, CATEGORY_COLOR, LEVEL_LABELS } from "@/lib/catalog";
import { AddSkillModal, RemoveSkillButton } from "./client";
import type { StudentSkillData } from "@/engines/types";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const session = await requireRole("STUDENT");
  const [skills, studentSkills, roleSkills] = await Promise.all([
    prisma.skill.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.studentSkill.findMany({ where: { userId: session.id }, include: { skill: true }, orderBy: { score: "desc" } }),
    prisma.roleSkill.findMany({
      where: { role: { profiles: { some: { userId: session.id } } } },
      include: { skill: true }
    })
  ]);

  const data: StudentSkillData[] = studentSkills.map((s) => ({
    skillId: s.skillId,
    name: s.skill.name,
    category: s.skill.category,
    score: s.score,
    source: s.source
  }));

  const radarData = data.slice(0, 8).map((s) => ({ skill: s.name, score: s.score, required: 70 }));

  const categories = Array.from(new Set(data.map((s) => s.category)));
  const categoryAverages = categories.map((c) => ({
    label: CATEGORY_LABEL[c] ?? c,
    value: Math.round(data.filter((s) => s.category === c).reduce((a, s) => a + s.score, 0) / Math.max(1, data.filter((s) => s.category === c).length))
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Skill Profile</h1>
          <p className="mt-1 text-sm text-ink-500">Your unique skill fingerprint — scores blend self-assessment, resume extraction and assessment results.</p>
        </div>
        <AddSkillModal skills={skills} existingIds={studentSkills.map((s) => s.skillId)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Skill fingerprint" subtitle="Top skills by score" />
          <div className="mt-3">
            {radarData.length >= 3 ? <SkillRadar data={radarData} /> : (
              <EmptyState title="Add at least 3 skills" description="Add your programming languages, frameworks and more to see your fingerprint." />
            )}
          </div>
        </Card>
        <Card className="p-5">
          <CardHeader title="Category strength" subtitle="Average score per skill category" />
          <div className="mt-4">
            {categoryAverages.length > 0 ? <SimpleBars data={categoryAverages} /> : (
              <EmptyState title="No skills yet" />
            )}
          </div>
        </Card>
      </div>

      {/* Skill cards */}
      <div>
        <h2 className="mb-3 text-[15px] font-bold text-ink-900">All skills</h2>
        {studentSkills.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="Your skill profile is empty"
            description="Add skills manually, or upload your resume and let CareerLens extract them automatically."
            action={<AddSkillModal skills={skills} existingIds={[]} />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {studentSkills.map((s) => {
              const requirement = roleSkills.find((r) => r.skillId === s.skillId);
              const color = (CATEGORY_COLOR[s.skill.category] ?? "#64748b") + "22";
              return (
                <div key={s.id} className="card card-hover flex items-start gap-3 p-4">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[s.skill.category] ?? "#64748b" }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold text-ink-900">{s.skill.name}</p>
                      <span className="font-display text-sm font-bold" style={{ color: CATEGORY_COLOR[s.skill.category] ?? "#64748b" }}>
                        {s.score}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-400">{CATEGORY_LABEL[s.skill.category] ?? s.skill.category}</p>
                    <div className="mt-2"><ProgressBar value={s.score} color="brand" /></div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: color, color: CATEGORY_COLOR[s.skill.category] ?? "#64748b" }}>
                        {LEVEL_LABELS[s.level] ?? "Basic"}
                      </span>
                      {requirement && (
                        <Badge color={statusBadgeColor(requirement.minProficiency <= s.score ? "STRONG" : "IMPROVE")}>
                          Role needs {requirement.minProficiency}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <RemoveSkillButton skillId={s.skillId} skillName={s.skill.name} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
