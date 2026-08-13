import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

// ── Button ────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-ink-100 text-ink-800 hover:bg-ink-200",
  outline: "border border-ink-300 bg-white text-ink-700 hover:bg-ink-50",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  dark: "bg-ink-900 text-white hover:bg-ink-800"
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9.5 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  href?: string;
}

export function Button({ variant = "primary", size = "md", loading, href, className, children, disabled, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors btn-focus disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    buttonVariants[variant],
    buttonSizes[size],
    className
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────
export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={cn("card", hover && "card-hover", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, className }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 p-5 pb-0", className)}>
      <div>
        <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────
type BadgeColor = "emerald" | "sky" | "amber" | "rose" | "violet" | "slate" | "brand" | "indigo";
const badgeColors: Record<BadgeColor, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
  slate: "bg-ink-100 text-ink-600 ring-ink-500/20"
};

export function Badge({ color = "slate", className, children }: { color?: BadgeColor; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", badgeColors[color], className)}>
      {children}
    </span>
  );
}

export function statusBadgeColor(status: string): BadgeColor {
  switch (status) {
    case "STRONG":
    case "COMPLETED":
    case "ACTIVE":
    case "PASSED":
    case "CONFIRMED":
    case "APPLIED":
      return "emerald";
    case "IMPROVE":
    case "IN_PROGRESS":
    case "SUBMITTED":
    case "PENDING":
      return "sky";
    case "MAJOR_GAP":
    case "TIMED_OUT":
      return "amber";
    case "CRITICAL_GAP":
    case "FAILED":
    case "DISABLED":
      return "rose";
    default:
      return "slate";
  }
}

// ── Form controls ─────────────────────────────────────────────────
export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-[13px] font-medium text-ink-700", className)}>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2 text-sm text-ink-900 placeholder:text-ink-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-ink-50 disabled:text-ink-400";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-[90px] resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20fill=%22%2364748b%22%20viewBox=%220%200%2016%2016%22%3E%3Cpath%20d=%22M4.646%206.646a.5.5%200%200%201%20.708%200L8%209.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat pr-9", className)} {...props}>
      {children}
    </select>
  );
}

// ── Progress ──────────────────────────────────────────────────────
export function ProgressBar({ value, color = "brand", className, showLabel }: { value: number; color?: "brand" | "emerald" | "amber" | "rose" | "sky" | "violet"; className?: string; showLabel?: boolean }) {
  const colors = {
    brand: "bg-brand-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500"
  };
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div className={cn("h-full rounded-full transition-all duration-500", colors[color])} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-9 text-right text-xs font-semibold text-ink-600">{Math.round(v)}%</span>}
    </div>
  );
}

export function ScoreRing({ value, size = 120, stroke = 10, color }: { value: number; size?: number; stroke?: number; color?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;
  const ringColor = color ?? (v >= 80 ? "#10b981" : v >= 65 ? "#0ea5e9" : v >= 45 ? "#f59e0b" : "#f43f5e");
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-2xl font-bold" style={{ color: ringColor }}>{Math.round(v)}%</div>
      </div>
    </div>
  );
}

// ── Skeleton / Empty / Stat ───────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-ink-100", className)} />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-1/3" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </Card>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <h3 className="text-[15px] font-semibold text-ink-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, accent = "brand" }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; accent?: "brand" | "emerald" | "amber" | "rose" | "sky" | "violet" }) {
  const accents = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600"
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-ink-900">{value}</p>
          {sub && <div className="mt-1 text-xs text-ink-500">{sub}</div>}
        </div>
        {icon && <div className={cn("rounded-xl p-2", accents[accent])}>{icon}</div>}
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300 bg-white text-ink-600 hover:bg-ink-50"
      )}
    >
      {children}
    </button>
  );
}
