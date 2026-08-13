import Link from "next/link";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listFacultyStudents } from "@/services/faculty-service";
import { Card, CardHeader, PageHeader } from "@/components/ui/ui";

export const dynamic = "force-dynamic";

export default async function FacultyReportsPage() {
  const session = await requireRole("FACULTY", "ADMIN");
  const { rows } = await listFacultyStudents(session.id, { pageSize: 100 });

  return (
    <div className="space-y-6">
      <PageHeader title="Student reports" subtitle="Generate and download placement readiness reports for students in your scope." />

      <Card>
        <CardHeader title="Available reports" subtitle={`${rows.length} student report${rows.length === 1 ? "" : "s"}`} />
        <div className="p-5">
          {rows.length === 0 && <p className="text-sm text-ink-400">No students in scope yet.</p>}
          <div className="grid gap-2.5 md:grid-cols-2">
            {rows.map((s) => (
              <Link key={s.userId} href={`/faculty/reports/${s.userId}`} className="flex items-center justify-between rounded-xl border border-ink-200 px-4 py-3 transition-colors hover:border-brand-400 hover:bg-brand-50/40">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{s.name}</p>
                  <p className="text-xs text-ink-400">{s.roleName ?? "No target role"} · {s.readiness !== null ? `${s.readiness}% ready` : "no snapshot"}</p>
                </div>
                <span className="rounded-lg bg-ink-100 p-2 text-ink-500"><FileText className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
