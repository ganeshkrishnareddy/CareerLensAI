import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppShell from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN");
  const unread = await prisma.notification.count({ where: { userId: session.id, read: false } });
  return (
    <AppShell user={session} nav="admin" unread={unread}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </AppShell>
  );
}
