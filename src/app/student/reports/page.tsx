import { requireRole } from "@/lib/auth";
import { buildStudentReport } from "@/services/report-service";
import { ReportView } from "@/components/report-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await requireRole("STUDENT");
  const report = await buildStudentReport(session.id);

  return <ReportView report={report} />;
}
