import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listQuestions } from "@/services/admin-service";
import { QuestionsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [assessment, questions, skills] = await Promise.all([
    prisma.assessment.findUnique({ where: { id }, include: { role: true, skill: true, _count: { select: { questions: true, attempts: true } } } }),
    listQuestions(id),
    prisma.skill.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);
  if (!assessment) notFound();

  const questionsForClient = questions.map((q) => ({
    ...q,
    options: (q.options as { key: string; text: string }[] | null),
    correctAnswer: (q.correctAnswer as { keys?: string[] } | null)
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/assessments" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> All assessments
      </Link>
      <QuestionsClient assessment={assessment} initialQuestions={questionsForClient} skills={skills} />
    </div>
  );
}
