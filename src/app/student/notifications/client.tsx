"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

export function MarkAllRead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function markAll() {
    setLoading(true);
    try {
      await api("/api/notifications", { method: "POST" });
      router.refresh();
    } catch {
      toast.error("Could not update notifications");
      setLoading(false);
    }
  }
  return (
    <button onClick={markAll} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-50 disabled:opacity-50">
      <CheckCheck className="h-4 w-4" /> Mark all read
    </button>
  );
}
