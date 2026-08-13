"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-[14px] font-semibold text-ink-900">{q}</span>
        <ChevronDown className={cn("h-4.5 w-4.5 shrink-0 text-ink-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-ink-100 px-5 py-4 text-[13px] leading-relaxed text-ink-500 animate-fade-in">{a}</div>
      )}
    </div>
  );
}
