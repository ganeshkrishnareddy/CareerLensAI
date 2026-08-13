import Link from "next/link";
import { Users, GraduationCap, ClipboardList, BookOpen, AlertTriangle, TrendingUp, Layers, FileQuestion, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { adminStats } from "@/services/admin-service";
import { Card, CardHeader, StatCard, Badge, ProgressBar, statusBadgeColor } from "@/components/ui/ui";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireRole("ADMIN");
  const stats = await adminStats();

  const readinessColor = stats.averageReadiness === null ? "brand" : stats.averageReadiness >= 70 ? "emerald" : stats.averageReadiness >= 50 ? "amber" : "rose";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Platform Overview</h1>
          <p className="mt-1 text-sm text-ink-500">Institution-wide health, engagement and the gaps that matter most.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Users" value={stats.users} icon={<Users className="h-5 w-5" />} accent="brand" sub={`${stats.students} students · ${stats.faculty} faculty`} />
        <StatCard label="Avg readiness" value={stats.averageReadiness !== null ? `${stats.averageReadiness}%` : "—"} icon={<TrendingUp className="h-5 w-5" />} accent={readinessColor} sub={`${stats.placementReady} ready · ${stats.atRisk} at risk`} />
        <StatCard label="Active roles" value={stats.roles} icon={<GraduationCap className="h-5 w-5" />} accent="violet" sub="in the requirement engine" />
        <StatCard label="Skills" value={stats.skills} icon={<Layers className="h-5 w-5" />} accent="sky" sub="in the skill catalog" />
        <StatCard label="Assessments" value={stats.assessments} icon={<ClipboardList className="h-5 w-5" />} accent="emerald" sub={`${stats.questions} questions`} />
        <StatCard label="Resources" value={stats.resources} icon={<BookOpen className="h-5 w-5" />} accent="amber" sub="learning resources" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top institutional gaps */}
        <Card>
          <CardHeader title="Top institutional skill gaps" subtitle="Across all students with a target role" />
          <div className="space-y-3 p-5">
            {stats.topGaps.length === 0 && <p className="text-sm text-ink-400">No critical or major gaps detected — excellent.</p>}
            {stats.topGaps.map((g) => (
              <div key={g.skillId} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  {g.status === "CRITICAL_GAP" ? <AlertTriangle className="h-4 w-4 text-rose-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{g.name}</p>
                    <p className="text-xs text-ink-400">{g.count} student{g.count === 1 ? "" : "s"} need intervention</p>
                  </div>
                </div>
                <Badge color={statusBadgeColor(g.status)}>{g.status === "CRITICAL_GAP" ? "Critical" : "Major"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Engagement events */}
        <Card>
          <CardHeader title="Engagement events" subtitle="Meaningful actions tracked across the platform" />
          <div className="space-y-2.5 p-5">
            {stats.events.slice(0, 10).map((e) => (
              <div key={e.type} className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-ink-700">{e.type.replace(/_/g, " ").toLowerCase()}</span>
                <span className="font-display font-bold text-ink-900">{e.count}</span>
              </div>
            ))}
            {stats.events.length === 0 && <p className="text-sm text-ink-400">No events tracked yet — activity will appear here.</p>}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/admin/users", label: "Manage users", desc: "Roles, statuses and access", icon: Users },
          { href: "/admin/roles", label: "Role requirements", desc: "Tune required skills & weights", icon: FileQuestion },
          { href: "/admin/assessments", label: "Assessment bank", desc: "Create assessments & questions", icon: ClipboardList }
        ].map((a) => (
          <Link key={a.href} href={a.href} className="group rounded-2xl border border-ink-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-pop">
            <a.icon className="h-5 w-5 text-brand-600" />
            <p className="mt-3 text-sm font-bold text-ink-900">{a.label}</p>
            <p className="mt-1 text-xs text-ink-500">{a.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
              Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
