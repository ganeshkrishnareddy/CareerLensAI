"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, Users, ArrowUpDown } from "lucide-react";
import { Badge, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, Skeleton, statusBadgeColor } from "@/components/ui/ui";
import { api } from "@/lib/api-client";

interface FilterOptions {
  departments: { id: string; name: string }[];
  batches: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  skills: { id: string; name: string }[];
  assessments: { id: string; title: string }[];
}

interface StudentRow {
  userId: string;
  name: string;
  email: string;
  roleName: string | null;
  batchName: string | null;
  departmentName: string | null;
  readiness: number | null;
  criticalGaps: number;
  attempts: number;
  roadmapProgress: number;
}

export function StudentsClient({ filters }: { filters: FilterOptions }) {
  const [rows, setRows] = useState<StudentRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [targetRoleId, setTargetRoleId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [readiness, setReadiness] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<"readiness" | "criticalGaps" | "name">("readiness");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("search", debounced);
      if (departmentId) params.set("departmentId", departmentId);
      if (batchId) params.set("batchId", batchId);
      if (targetRoleId) params.set("targetRoleId", targetRoleId);
      if (skillId) params.set("skillId", skillId);
      if (readiness === "ready") params.set("minReadiness", "75");
      if (readiness === "risk") params.set("maxReadiness", "50");
      params.set("page", String(page));
      params.set("pageSize", "25");
      const data = await api<{ rows: StudentRow[]; total: number }>(`/api/faculty/students?${params.toString()}`);
      setRows(data.rows);
      setTotal(data.total);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debounced, departmentId, batchId, targetRoleId, skillId, readiness, page]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debounced, departmentId, batchId, targetRoleId, skillId, readiness]);

  const sorted = rows ? [...rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""));
    return sortDir === "asc" ? cmp : -cmp;
  }) : [];

  const pageSize = 25;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle={`${total} student${total === 1 ? "" : "s"} in your scope`} />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative md:col-span-2 xl:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="pl-9" />
          </div>
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">All departments</option>
            {filters.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All batches</option>
            {filters.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select value={targetRoleId} onChange={(e) => setTargetRoleId(e.target.value)}>
            <option value="">All target roles</option>
            {filters.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
            <option value="">All skills</option>
            {filters.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select value={readiness} onChange={(e) => setReadiness(e.target.value)}>
            <option value="">Any readiness</option>
            <option value="ready">Ready (≥ 75%)</option>
            <option value="risk">At risk (&lt; 50%)</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">
                  <button onClick={() => { setSortKey("name"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }} className="inline-flex items-center gap-1 hover:text-ink-800">
                    Student <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Target role</th>
                <th className="px-4 py-3 font-semibold">Batch</th>
                <th className="px-4 py-3 font-semibold">
                  <button onClick={() => { setSortKey("readiness"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }} className="inline-flex items-center gap-1 hover:text-ink-800">
                    Readiness <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Critical gaps</th>
                <th className="px-4 py-3 font-semibold">Assessments</th>
                <th className="px-4 py-3 font-semibold">Roadmap</th>
                <th className="rounded-r-lg px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-ink-100">
                  <td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10"><EmptyState icon={<Users className="h-8 w-8" />} title="No students match the filters" description="Try adjusting the filters or clearing the search." /></td></tr>
              )}
              {!loading && sorted.map((s) => (
                <tr key={s.userId} className="border-b border-ink-100 hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{s.name}</p>
                    <p className="text-[11px] text-ink-400">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.roleName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{s.batchName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-display font-bold ${s.readiness === null ? "text-ink-300" : s.readiness >= 75 ? "text-emerald-600" : s.readiness >= 50 ? "text-amber-600" : "text-rose-500"}`}>
                      {s.readiness !== null ? `${s.readiness}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.criticalGaps > 0 ? <Badge color="rose">{s.criticalGaps}</Badge> : <Badge color="emerald">0</Badge>}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.attempts}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                        <div className={`h-full rounded-full ${s.roadmapProgress >= 75 ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${s.roadmapProgress}%` }} />
                      </div>
                      <span className="text-[11px] text-ink-500">{s.roadmapProgress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/faculty/students/${s.userId}`} className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
          <p className="text-xs text-ink-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
