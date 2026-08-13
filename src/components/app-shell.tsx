import { AppNav } from "./app-nav";

export default function AppShell({
  user,
  nav,
  unread,
  children
}: {
  user: { id: string; name: string; email: string; role: string };
  nav: "student" | "faculty" | "admin";
  unread: number;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink-50/70">
      <AppNav user={user} nav={nav} unread={unread} />
      <div className="pt-14 lg:pl-60">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-ink-400 sm:px-6 lg:px-8">
          CareerLens AI · Assess → Analyze → Recommend → Track
        </footer>
      </div>
    </div>
  );
}
