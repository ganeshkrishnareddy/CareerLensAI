import Link from "next/link";
import { BellRing, CheckCheck, Trophy, BookOpen, Target, GraduationCap, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, EmptyState } from "@/components/ui/ui";
import { timeAgo } from "@/lib/utils";
import { MarkAllRead } from "./client";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  ROADMAP: { icon: BookOpen, color: "bg-violet-50 text-violet-600" },
  ASSESSMENT: { icon: GraduationCap, color: "bg-brand-50 text-brand-600" },
  SKILL: { icon: Target, color: "bg-emerald-50 text-emerald-600" },
  MILESTONE: { icon: Trophy, color: "bg-amber-50 text-amber-600" },
  INTERVENTION: { icon: MessageSquare, color: "bg-rose-50 text-rose-600" },
  SYSTEM: { icon: BellRing, color: "bg-ink-100 text-ink-600" }
};

export default async function NotificationsPage() {
  const session = await requireRole("STUDENT");
  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 60
  });
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<BellRing className="h-8 w-8" />} title="No notifications yet" description="Roadmap items, assessment results and milestones will show up here." />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
            const Icon = meta.icon;
            const body = (
              <div className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${n.read ? "border-ink-200 bg-white" : "border-brand-200 bg-brand-50/40"}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-ink-900">{n.title}</p>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link}>{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
