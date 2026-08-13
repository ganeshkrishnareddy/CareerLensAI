export function aiAvailable(): boolean {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.length > 10);
}

export function aiConfig() {
  return {
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
    model: process.env.AI_MODEL ?? "gpt-4o-mini"
  };
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call an OpenAI-compatible chat-completions endpoint and return parsed JSON.
 * Returns null on any failure so callers can fall back deterministically.
 */
export async function callAI(
  messages: AiMessage[],
  opts: { json?: boolean; maxTokens?: number; temperature?: number } = {}
): Promise<unknown | null> {
  if (!aiAvailable()) return null;
  const cfg = aiConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 800,
        response_format: opts.json ? { type: "json_object" } : undefined
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      console.error("AI request failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    if (opts.json) {
      try {
        return JSON.parse(content);
      } catch {
        // Strip markdown fences and retry once.
        const cleaned = content.replace(/```json|```/g, "").trim();
        try {
          return JSON.parse(cleaned);
        } catch {
          return null;
        }
      }
    }
    return content;
  } catch (err) {
    console.error("AI request error:", err instanceof Error ? err.message : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function safeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}
