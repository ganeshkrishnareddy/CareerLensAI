"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Button, Card, CardHeader, EmptyState, Input, Label, PageHeader } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";
import { confirmDelete } from "@/lib/confirm";

interface DeptRow {
  id: string;
  name: string;
  code: string;
  _count: { profiles: number; batches: number };
}

interface BatchRow {
  id: string;
  name: string;
  year: number;
  department: { id: string; name: string };
  _count: { profiles: number };
}

export function DepartmentsClient({ initial }: { initial: { departments: DeptRow[]; batches: BatchRow[] } }) {
  const router = useRouter();
  const [departments, setDepartments] = useState<DeptRow[]>(initial.departments);
  const [batches, setBatches] = useState<BatchRow[]>(initial.batches);
  const [deptModal, setDeptModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [batchDept, setBatchDept] = useState("");
  const [batchName, setBatchName] = useState("");
  const [batchYear, setBatchYear] = useState(String(new Date().getFullYear()));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;
    setSaving(true);
    try {
      await api("/api/admin/departments", { method: "POST", body: JSON.stringify({ name: deptName.trim(), code: deptCode.trim() }) });
      toast.success("Department created");
      setDeptModal(false);
      setDeptName("");
      setDeptCode("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create department");
    } finally {
      setSaving(false);
    }
  }

  async function addBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!batchDept || !batchName.trim() || !Number.isInteger(Number(batchYear))) return;
    setSaving(true);
    try {
      await api("/api/admin/departments", {
        method: "POST",
        body: JSON.stringify({ kind: "batch", departmentId: batchDept, name: batchName.trim(), year: Number(batchYear) })
      });
      toast.success("Batch created");
      setBatchModal(false);
      setBatchName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create batch");
    } finally {
      setSaving(false);
    }
  }

  async function removeDepartment(id: string, name: string) {
    if (!(await confirmDelete(`Delete ${name}?`, "This removes the department, its batches and student links."))) return;
    setDeleting(id);
    try {
      await api(`/api/admin/departments/${id}`, { method: "DELETE" });
      toast.success("Department deleted");
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete department");
    } finally {
      setDeleting(null);
    }
  }

  async function removeBatch(id: string, name: string) {
    if (!(await confirmDelete(`Delete batch ${name}?`, "Students in this batch will be unlinked."))) return;
    setDeleting(id);
    try {
      await api(`/api/admin/batches/${id}`, { method: "DELETE" });
      toast.success("Batch deleted");
      setBatches((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete batch");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments & Batches"
        subtitle="Organize the institution structure that scopes faculty and student profiles."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBatchModal(true)}><Plus className="h-4 w-4" /> Batch</Button>
            <Button onClick={() => setDeptModal(true)}><Plus className="h-4 w-4" /> Department</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Departments" subtitle={`${departments.length} total`} />
          <div className="space-y-2.5 p-5">
            {departments.length === 0 && <EmptyState icon={<Building2 className="h-8 w-8" />} title="No departments yet" description="Create your first department to organize batches and students." />}
            {departments.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-800">{d.name}</p>
                  <p className="text-[11px] text-ink-400">Code {d.code} · {d._count.batches} batch{d._count.batches === 1 ? "" : "es"} · {d._count.profiles} students</p>
                </div>
                <Button variant="ghost" size="sm" disabled={deleting === d.id} onClick={() => removeDepartment(d.id, d.name)} className="text-ink-400 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Batches" subtitle={`${batches.length} total`} />
          <div className="space-y-2.5 p-5">
            {batches.length === 0 && <EmptyState icon={<Building2 className="h-8 w-8" />} title="No batches yet" description="Batches group students by graduation year within a department." />}
            {batches.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink-800">Batch {b.name}</p>
                  <p className="text-[11px] text-ink-400">{b.department.name} · {b._count.profiles} students</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="slate">Class of {b.year}</Badge>
                  <Button variant="ghost" size="sm" disabled={deleting === b.id} onClick={() => removeBatch(b.id, b.name)} className="text-ink-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Department modal */}
      <Modal open={deptModal} onClose={() => setDeptModal(false)} title="Add department">
        <form onSubmit={addDepartment} className="space-y-4">
          <div>
            <Label>Department name</Label>
            <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g. Electronics & Communication Engineering" />
          </div>
          <div>
            <Label>Code</Label>
            <Input value={deptCode} onChange={(e) => setDeptCode(e.target.value)} placeholder="e.g. ECE" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeptModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!deptName.trim() || !deptCode.trim()}>Create department</Button>
          </div>
        </form>
      </Modal>

      {/* Batch modal */}
      <Modal open={batchModal} onClose={() => setBatchModal(false)} title="Add batch">
        <form onSubmit={addBatch} className="space-y-4">
          <div>
            <Label>Department</Label>
            <select value={batchDept} onChange={(e) => setBatchDept(e.target.value)} className="w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30">
              <option value="">Select department…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Batch name</Label>
            <Input value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. 2026" />
          </div>
          <div>
            <Label>Graduation year</Label>
            <Input type="number" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setBatchModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!batchDept || !batchName.trim()}>Create batch</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
