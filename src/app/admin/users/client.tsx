"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Users, Shield, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Skeleton, statusBadgeColor } from "@/components/ui/ui";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  department: string | null;
  batch: string | null;
  targetRole: string | null;
  readiness: number | null;
}

const PAGE_SIZE = 20;

export function UsersClient() {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("search", debounced);
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const data = await api<{ rows: UserRow[]; total: number }>(`/api/admin/users?${params.toString()}`);
      setRows(data.rows);
      setTotal(data.total);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debounced, role, status, page]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debounced, role, status]);

  async function update(id: string, patch: { role?: string; status?: string }) {
    setBusyId(id);
    try {
      await api("/api/admin/users", { method: "PATCH", body: JSON.stringify({ userId: id, ...patch }) });
      toast.success("User updated");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update user");
    } finally {
      setBusyId(null);
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle={`${total} account${total === 1 ? "" : "s"} on the platform`} />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="pl-9" />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="PENDING">Pending</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead className="bg-ink-50 text-[11px] uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Dept / Batch</th>
                <th className="px-4 py-3 font-semibold">Target role</th>
                <th className="px-4 py-3 font-semibold">Readiness</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-ink-100">
                  <td colSpan={8} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
              {!loading && rows?.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10"><EmptyState icon={<Users className="h-8 w-8" />} title="No users match" description="Adjust the filters or search term." /></td></tr>
              )}
              {!loading && rows?.map((u) => (
                <tr key={u.id} className="border-b border-ink-100 hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{u.name}</p>
                    <p className="text-[11px] text-ink-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => update(u.id, { role: e.target.value })}
                      className="h-8 w-28 py-1 text-xs"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusBadgeColor(u.status)}>{u.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    <p>{u.department ?? "—"}</p>
                    <p className="text-[11px] text-ink-400">{u.batch ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{u.targetRole ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-display font-bold ${u.readiness === null ? "text-ink-300" : u.readiness >= 75 ? "text-emerald-600" : u.readiness >= 50 ? "text-amber-600" : "text-rose-500"}`}>
                      {u.readiness !== null ? `${u.readiness}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.status === "ACTIVE" ? (
                      <Button variant="outline" size="sm" disabled={busyId === u.id} onClick={() => update(u.id, { status: "DISABLED" })}>
                        <UserX className="h-3.5 w-3.5" /> Disable
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled={busyId === u.id} onClick={() => update(u.id, { status: "ACTIVE" })}>
                        <UserCheck className="h-3.5 w-3.5" /> Enable
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
          <p className="text-xs text-ink-500">Page {page} of {pages} · <Shield className="inline h-3 w-3" /> all changes are audit-logged</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
