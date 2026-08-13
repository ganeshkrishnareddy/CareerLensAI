import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { buildStudentReport } from "@/services/report-service";
import { getFacultyStudentDetail } from "@/services/faculty-service";
import { ReportView } from "@/components/report-view";

export const dynamic = "force-dynamic";

export default async function FacultyReportPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const session = await requireRole("FACULTY", "ADMIN");
  const detail = await getFacultyStudentDetail(session.id, studentId);
  if (!detail) notFound();

  const report = await buildStudentReport(studentId);

  return (
    <div className="space-y-4">
      <Link href="/faculty/reports" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 no-print">
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </Link>
      <ReportView report={report} title={`${detail.profile.user.name} — Placement Readiness Report`} />
    </div>
  );
}
