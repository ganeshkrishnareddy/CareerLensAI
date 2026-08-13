"use client";

import { Download } from "lucide-react";

export function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 self-start rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 no-print"
    >
      <Download className="h-4 w-4" /> {label}
    </button>
  );
}
