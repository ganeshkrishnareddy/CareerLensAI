import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppShell from "@/components/app-shell";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("FACULTY", "ADMIN");
  const unread = await prisma.notification.count({ where: { userId: session.id, read: false } });

  return (
    <AppShell user={{ id: session.id, name: session.name, email: session.email, role: session.role }} nav="faculty" unread={unread}>
      {children}
    </AppShell>
  );
}
