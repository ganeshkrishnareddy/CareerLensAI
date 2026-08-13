"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell, LogOut, Menu, Sparkles, LayoutDashboard, Target, LineChart, BarChart3,
  ClipboardList, BookOpen, MessagesSquare, FileSearch, FileText, Users, Building2,
  GraduationCap, Settings
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: Record<"student" | "faculty" | "admin", NavItem[]> = {
  student: [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/skills", label: "Skill Profile", icon: Target },
    { href: "/student/gaps", label: "Skill Gaps", icon: LineChart },
    { href: "/student/readiness", label: "Readiness", icon: BarChart3 },
    { href: "/student/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/student/roadmap", label: "Roadmap", icon: BookOpen },
    { href: "/student/roles", label: "Role Matching", icon: Target },
    { href: "/student/coach", label: "AI Career Coach", icon: MessagesSquare },
    { href: "/student/interview", label: "Interview Practice", icon: FileText },
    { href: "/student/resume", label: "Resume Analysis", icon: FileSearch },
    { href: "/student/reports", label: "Reports", icon: FileText }
  ],
  faculty: [
    { href: "/faculty", label: "Dashboard", icon: LayoutDashboard },
    { href: "/faculty/students", label: "Students", icon: Users },
    { href: "/faculty/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/faculty/reports", label: "Reports", icon: FileText }
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/departments", label: "Departments & Batches", icon: Building2 },
    { href: "/admin/roles", label: "Roles & Requirements", icon: Target },
    { href: "/admin/skills", label: "Skills", icon: GraduationCap },
    { href: "/admin/assessments", label: "Assessments", icon: ClipboardList },
    { href: "/admin/resources", label: "Learning Resources", icon: BookOpen },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "Settings", icon: Settings }
  ]
};

export function AppNav({
  user,
  nav,
  unread
}: {
  user: { id: string; name: string; email: string; role: string };
  nav: "student" | "faculty" | "admin";
  unread: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    } finally {
      setLoggingOut(false);
    }
  }

  const items = NAV[nav];
  const home = items[0].href;
  const sectionLabel = nav === "student" ? "Student" : nav === "faculty" ? "Faculty" : "Admin";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-5">
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="CareerLens AI" className="h-8 w-auto" />
        </Link>
      </div>
      <p className="px-5 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-400">{sectionLabel} workspace</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== home && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                active ? "bg-brand-600 text-white shadow-sm" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5", active ? "text-white" : "text-ink-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink-200 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-bold text-white">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink-900">{user.name}</p>
            <p className="truncate text-[11px] text-ink-400">{user.email}</p>
          </div>
          <button onClick={logout} disabled={loggingOut} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-rose-600" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-ink-200 bg-white lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-pop animate-fade-in">{sidebar}</div>
        </div>
      )}

      {/* Topbar */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur lg:left-60 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-ink-700 lg:hidden">CareerLens AI</span>
          <p className="hidden text-sm text-ink-400 lg:block">
            {nav === "student" ? "Placement Readiness Workspace" : nav === "faculty" ? "Batch Analytics Workspace" : "Platform Administration"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={nav === "student" ? "/student/notifications" : nav === "faculty" ? "/faculty/students" : "/admin/analytics"}
            className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link href={nav === "student" ? "/student/profile" : nav === "faculty" ? "/faculty" : "/admin/settings"} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100" aria-label="Profile">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-[11px] font-bold text-white">
              {initials(user.name)}
            </span>
          </Link>
          <button onClick={logout} disabled={loggingOut} className="ml-1 rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:hidden" aria-label="Sign out">
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>
    </>
  );
}
