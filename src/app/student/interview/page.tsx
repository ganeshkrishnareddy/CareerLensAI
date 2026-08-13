import { FileText, Lightbulb } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge, EmptyState, statusBadgeColor } from "@/components/ui/ui";
import { InterviewPractice } from "./client";
import { safeJsonParse } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InterviewPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.profile.findUnique({ where: { userId: session.id }, include: { targetRole: true } });
  const [questions, opportunities] = await Promise.all([
    prisma.interviewQuestion.findMany({
      where: { OR: [{ role: { name: profile?.targetRole?.name ?? "__none__" } }, { roleId: null }] },
      include: { role: true, skill: true }
    }),
    prisma.opportunity.findMany({
      where: { isActive: true, OR: [{ roleId: profile?.targetRoleId ?? "__none__" }, { roleId: null }] },
      include: { role: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Interview Practice</h1>
        <p className="mt-1 text-sm text-ink-500">
          {profile?.targetRole ? `Question bank for ${profile.targetRole.name} and general roles.` : "Practice questions for common roles and competencies."}
        </p>
      </div>

      <InterviewPractice
        questions={questions.map((q) => ({
          id: q.id,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          sampleAnswer: q.sampleAnswer,
          role: q.role?.name,
          skill: q.skill?.name,
          tips: safeJsonParse<string[]>(q.tips, [])
        }))}
      />

      {/* Opportunities */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-ink-900">
          <Lightbulb className="h-4.5 w-4.5 text-amber-500" /> Recommended opportunities
        </h2>
        {opportunities.length === 0 ? (
          <EmptyState icon={<FileText className="h-8 w-8" />} title="No opportunities right now" description="New campus drives are added by your institution." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((o) => (
              <Card key={o.id} hover className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-bold text-ink-900">{o.title}</p>
                    <p className="text-[12px] text-ink-500">{o.company} · {o.location ?? "—"}</p>
                  </div>
                  {o.role && <Badge color="brand">{o.role.name}</Badge>}
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-500">{o.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
                  <span className="text-xs font-semibold text-emerald-600">{o.salaryRange ?? "—"}</span>
                  {o.url && (
                    <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                      View →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
