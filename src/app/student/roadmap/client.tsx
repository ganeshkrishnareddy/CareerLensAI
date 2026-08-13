"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Play, RefreshCw, SkipForward, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";

type Status = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

export function ItemActions({ itemId, status }: { itemId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: Status) {
    setLoading(true);
    try {
      await api(`/api/roadmap/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      toast.success(next === "COMPLETED" ? "Task completed — keep going! 💪" : next === "SKIPPED" ? "Task skipped" : "Task started");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update task");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {status !== "IN_PROGRESS" && status !== "COMPLETED" && (
        <button onClick={() => setStatus("IN_PROGRESS")} disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-200" title="Start task">
          <Play className="h-3.5 w-3.5" /> Start
        </button>
      )}
      {status === "IN_PROGRESS" && (
        <button onClick={() => setStatus("PENDING")} disabled={loading} className="rounded-lg border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-500 hover:bg-ink-50" title="Back to pending">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
      {status !== "COMPLETED" && (
        <button onClick={() => setStatus("COMPLETED")} disabled={loading} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700" title="Mark complete">
          <Check className="h-3.5 w-3.5" /> Complete
        </button>
      )}
      {status !== "SKIPPED" && status !== "COMPLETED" && (
        <button onClick={() => setStatus("SKIPPED")} disabled={loading} className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-ink-500" title="Skip">
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function GenerateRoadmapButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function generate() {
    setLoading(true);
    try {
      await api("/api/roadmap/generate", { method: "POST" });
      toast.success("Your personalized roadmap is ready!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not generate roadmap");
      setLoading(false);
    }
  }
  return (
    <button onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
      <Wand2 className="h-4 w-4" /> {loading ? "Generating…" : "Generate roadmap"}
    </button>
  );
}

export function CompleteWeekButton({ week, count }: { week: number; count: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function complete() {
    setLoading(true);
    try {
      await api("/api/roadmap/week", { method: "POST", body: JSON.stringify({ week }) });
      toast.success(`Week ${week} marked complete 🎉`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not complete week");
      setLoading(false);
    }
  }
  return (
    <button onClick={complete} disabled={loading} className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">
      {loading ? "Marking…" : `Mark week ${week} complete (${count})`}
    </button>
  );
}
