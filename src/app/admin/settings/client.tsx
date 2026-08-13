"use client";

import { useState } from "react";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Card, CardHeader, Input, Label, Select } from "@/components/ui/ui";

const DEFAULT_WEIGHTS = { technical: 0.22, coding: 0.18, aptitude: 0.12, communication: 0.14, interview: 0.12, projects: 0.12, resume: 0.1 };

export function SettingsClient({ initial }: { initial: Record<string, unknown> }) {
  const weights = (initial.readinessWeights as Partial<typeof DEFAULT_WEIGHTS>) ?? DEFAULT_WEIGHTS;
  const [technical, setTechnical] = useState(String((weights.technical ?? 0.22) * 100));
  const [coding, setCoding] = useState(String((weights.coding ?? 0.18) * 100));
  const [aptitude, setAptitude] = useState(String((weights.aptitude ?? 0.12) * 100));
  const [communication, setCommunication] = useState(String((weights.communication ?? 0.14) * 100));
  const [interview, setInterview] = useState(String((weights.interview ?? 0.12) * 100));
  const [projects, setProjects] = useState(String((weights.projects ?? 0.12) * 100));
  const [resume, setResume] = useState(String((weights.resume ?? 0.1) * 100));
  const [aiEnabled, setAiEnabled] = useState<boolean>(initial.aiEnabled === false ? false : true);
  const [aiProvider, setAiProvider] = useState<string>(typeof initial.aiProvider === "string" ? initial.aiProvider : "auto");
  const [aiModel, setAiModel] = useState<string>(typeof initial.aiModel === "string" ? initial.aiModel : "gpt-4o-mini");
  const [retakeLimit, setRetakeLimit] = useState(String(typeof initial.assessmentRetakeLimit === "number" ? initial.assessmentRetakeLimit : 5));
  const [saving, setSaving] = useState(false);

  const fields = [
    ["Technical skills", technical, setTechnical],
    ["Coding", coding, setCoding],
    ["Aptitude", aptitude, setAptitude],
    ["Communication", communication, setCommunication],
    ["Interview", interview, setInterview],
    ["Projects", projects, setProjects],
    ["Resume", resume, setResume]
  ] as const;

  const total = fields.reduce((a, [, v]) => a + (Number(v) || 0), 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          readinessWeights: {
            technical: (Number(technical) || 0) / 100,
            coding: (Number(coding) || 0) / 100,
            aptitude: (Number(aptitude) || 0) / 100,
            communication: (Number(communication) || 0) / 100,
            interview: (Number(interview) || 0) / 100,
            projects: (Number(projects) || 0) / 100,
            resume: (Number(resume) || 0) / 100
          },
          aiEnabled,
          aiProvider,
          aiModel,
          assessmentRetakeLimit: Number(retakeLimit) || 5
        })
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900 sm:text-2xl">
          <Settings className="h-5 w-5 text-brand-600" /> Platform Settings
        </h1>
        <p className="mt-1 text-sm text-ink-500">Scoring weights and AI configuration — stored in the database, applied on every analysis.</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader title="Readiness score weights" subtitle="Weights must total 100%. Every snapshot is recomputed with these." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {fields.map(([label, value, setter]) => (
              <div key={label}>
                <Label>{label} (%)</Label>
                <Input type="number" min={0} max={100} step={1} value={value} onChange={(e) => setter(e.target.value)} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <p className={`text-sm font-semibold ${Math.abs(total - 100) < 0.01 ? "text-emerald-600" : "text-amber-600"}`}>
                Total: {total}% {Math.abs(total - 100) < 0.01 ? "✓" : `— adjust to 100%`}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="AI configuration" subtitle="When a provider is unreachable or unconfigured, the rule-based fallback engine keeps everything working." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <Label>AI features</Label>
              <Select value={aiEnabled ? "on" : "off"} onChange={(e) => setAiEnabled(e.target.value === "on")}>
                <option value="on">Enabled</option>
                <option value="off">Disabled (fallback only)</option>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                <option value="auto">Auto-detect (env key)</option>
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini</option>
                <option value="none">None — deterministic fallback</option>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Input value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="gpt-4o-mini" />
            </div>
            <div>
              <Label>Max assessment retakes</Label>
              <Input type="number" min={1} value={retakeLimit} onChange={(e) => setRetakeLimit(e.target.value)} />
            </div>
          </div>
          <p className="px-5 pb-5 text-xs text-ink-400">
            API keys are never stored in the database — they live in server-side environment variables (see <code>.env.example</code>).
          </p>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={Math.abs(total - 100) >= 0.01}>
            <Save className="h-4 w-4" /> Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
