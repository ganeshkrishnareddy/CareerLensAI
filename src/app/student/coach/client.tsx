"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
  source?: string;
}

export function CoachChat({
  suggestions,
  initial
}: {
  suggestions: string[];
  initial: { readiness: number | null; topGap: string | null; nextAction: string | null; assessment: string };
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "USER", content: message }]);
    setLoading(true);
    try {
      const result = await api<{ reply: { text: string; source: string }; conversationId: string }>("/api/coach", {
        method: "POST",
        body: JSON.stringify({ message, conversationId })
      });
      setConversationId(result.conversationId);
      setMessages((m) => [...m, { role: "ASSISTANT", content: result.reply.text, source: result.reply.source }]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "The coach is unavailable right now");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">Career Coach</p>
          <p className="text-[11px] text-emerald-600">● Online · answers from your live profile</p>
        </div>
        {initial.readiness !== null && (
          <span className="ml-auto rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
            Readiness: {initial.readiness}%
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col justify-center">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">Hi! I'm your AI Career Coach</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                Ask me about your preparation — I read your actual skill scores, gaps and readiness to answer. Try one of these:
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "USER" ? "justify-end" : "justify-start")}>
            {m.role === "ASSISTANT" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[13px] leading-relaxed", m.role === "USER" ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-ink-100 text-ink-800")}>
              {m.content}
              {m.source === "FALLBACK" && m.role === "ASSISTANT" && (
                <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-400">Rule-based engine (no AI key configured)</p>
              )}
            </div>
            {m.role === "USER" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-200 text-ink-600">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-ink-100 px-4 py-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
              <span className="text-xs text-ink-500">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-ink-100 p-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your career question…"
            className="flex-1 rounded-xl border border-ink-300 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <button type="submit" disabled={loading || !input.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40">
            <ArrowUp className="h-4.5 w-4.5" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-ink-300">Answers use your real profile data · generated by AI when configured, else the rule engine</p>
      </div>
    </div>
  );
}
