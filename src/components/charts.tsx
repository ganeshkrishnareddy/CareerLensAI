"use client";

import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell,
  AreaChart, Area, Legend
} from "recharts";

export function SkillRadar({ data, height = 260 }: { data: { skill: string; score: number; required: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#475569" }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} angle={90} />
        <Radar name="Your score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
        <Radar name="Required" dataKey="required" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `${v}%`} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ReadinessTrend({ data, height = 240 }: { data: { date: string; overall: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} width={32} />
        <Tooltip formatter={(v) => [`${v}%`, "Readiness"]} />
        <Area type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2.5} fill="url(#readinessGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SkillTrendChart({ data, height = 240 }: { data: { date: string; [key: string]: string | number }[]; height?: number }) {
  const keys = Object.keys(data[0] ?? {}).filter((k) => k !== "date").slice(0, 4);
  const colors = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981"];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} width={32} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k, i) => (
          <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 2.5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const STATUS_COLORS: Record<string, string> = {
  STRONG: "#10b981",
  IMPROVE: "#0ea5e9",
  MAJOR_GAP: "#f59e0b",
  CRITICAL_GAP: "#f43f5e"
};

export function GapBars({ data, height = 220 }: { data: { skill: string; current: number; required: number; status: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis type="category" dataKey="skill" width={110} tick={{ fontSize: 11, fill: "#334155" }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]} barSize={10}>
          {data.map((d) => (
            <Cell key={d.skill} fill={STATUS_COLORS[d.status] ?? "#6366f1"} />
          ))}
        </Bar>
        <Bar dataKey="required" name="Required" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBars({ data, height = 260 }: { data: { label: string; value: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: "#334155" }} />
        <Tooltip formatter={(v) => `${v}%`} />
        <Bar dataKey="value" name="Score" radius={[0, 4, 4, 0]} barSize={12}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 75 ? "#10b981" : d.value >= 50 ? "#6366f1" : "#f43f5e"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
