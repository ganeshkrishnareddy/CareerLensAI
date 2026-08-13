import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppShell from "@/components/app-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("STUDENT");
  const [profile, unread] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.id } }),
    prisma.notification.count({ where: { userId: session.id, read: false } })
  ]);

  const isDashboard = true;
  void isDashboard;
  if (profile && !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <AppShell user={{ id: session.id, name: session.name, email: session.email, role: session.role }} nav="student" unread={unread}>
      {children}
    </AppShell>
  );
}
