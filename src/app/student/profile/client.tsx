"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Button, Input, Label, Select, Textarea } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";

interface ProfileRow {
  phone?: string | null;
  college?: string | null;
  university?: string | null;
  departmentId?: string | null;
  batchId?: string | null;
  graduationYear?: number | null;
  cgpa?: number | null;
  location?: string | null;
  bio?: string | null;
  targetRoleId?: string | null;
}

export function ProfileForm({
  profile,
  departments,
  batches,
  roles
}: {
  profile: ProfileRow | null;
  departments: { id: string; name: string }[];
  batches: { id: string; name: string; departmentId: string }[];
  roles: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    phone: profile?.phone ?? "",
    college: profile?.college ?? "",
    university: profile?.university ?? "",
    departmentId: profile?.departmentId ?? "",
    batchId: profile?.batchId ?? "",
    graduationYear: profile?.graduationYear ? String(profile.graduationYear) : "",
    cgpa: profile?.cgpa ? String(profile.cgpa) : "",
    location: profile?.location ?? "",
    bio: profile?.bio ?? "",
    targetRoleId: profile?.targetRoleId ?? ""
  });
  const [loading, setLoading] = useState(false);

  const filteredBatches = batches.filter((b) => !form.departmentId || b.departmentId === form.departmentId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          phone: form.phone || null,
          college: form.college || null,
          university: form.university || null,
          departmentId: form.departmentId || null,
          batchId: form.batchId || null,
          graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
          cgpa: form.cgpa ? Number(form.cgpa) : null,
          location: form.location || null,
          bio: form.bio || null
        })
      });
      if (form.targetRoleId && form.targetRoleId !== profile?.targetRoleId) {
        await api("/api/profile/target-role", { method: "POST", body: JSON.stringify({ roleId: form.targetRoleId }) });
      }
      toast.success("Profile saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save profile");
    } finally {
      setLoading(false);
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <form onSubmit={save} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-phone">Phone</Label>
          <Input id="p-phone" value={form.phone} onChange={set("phone")} placeholder="+91 98xxxxxx00" />
        </div>
        <div>
          <Label htmlFor="p-location">Location</Label>
          <Input id="p-location" value={form.location} onChange={set("location")} placeholder="Hyderabad" />
        </div>
        <div>
          <Label htmlFor="p-college">College</Label>
          <Input id="p-college" value={form.college} onChange={set("college")} placeholder="Your college" />
        </div>
        <div>
          <Label htmlFor="p-university">University</Label>
          <Input id="p-university" value={form.university} onChange={set("university")} placeholder="Your university" />
        </div>
        <div>
          <Label htmlFor="p-dept">Department</Label>
          <Select id="p-dept" value={form.departmentId} onChange={set("departmentId")}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="p-batch">Batch</Label>
          <Select id="p-batch" value={form.batchId} onChange={set("batchId")}>
            <option value="">Select batch</option>
            {filteredBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="p-year">Graduation year</Label>
          <Input id="p-year" type="number" min={2000} max={2100} value={form.graduationYear} onChange={set("graduationYear")} placeholder="2026" />
        </div>
        <div>
          <Label htmlFor="p-cgpa">CGPA</Label>
          <Input id="p-cgpa" type="number" step="0.01" min={0} max={10} value={form.cgpa} onChange={set("cgpa")} placeholder="8.5" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-role">Target role</Label>
          <Select id="p-role" value={form.targetRoleId} onChange={set("targetRoleId")}>
            <option value="">Select target role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-bio">Bio</Label>
          <Textarea id="p-bio" value={form.bio} onChange={set("bio")} placeholder="A short summary about you and your goals" />
        </div>
      </div>
      <Button type="submit" loading={loading}>
        <Save className="h-4 w-4" /> Save profile
      </Button>
    </form>
  );
}

export function ProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", technologies: "", role: "",
    difficulty: "INTERMEDIATE", status: "IN_PROGRESS", githubUrl: "", demoUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          technologies: form.technologies.split(",").map((t) => t.trim()).filter(Boolean),
          githubUrl: form.githubUrl || null,
          demoUrl: form.demoUrl || null
        })
      });
      toast.success("Project added");
      setOpen(false);
      setForm({ name: "", description: "", technologies: "", role: "", difficulty: "INTERMEDIATE", status: "IN_PROGRESS", githubUrl: "", demoUrl: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a project" size="lg" footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} loading={loading}>Add project</Button>
        </>
      }>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Project name</Label>
            <Input required value={form.name} onChange={set("name")} placeholder="Placement Prep Tracker" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={set("description")} placeholder="What does it do? What was your role?" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Technologies (comma separated)</Label>
              <Input value={form.technologies} onChange={set("technologies")} placeholder="Python, React, SQL" />
            </div>
            <div>
              <Label>Your role</Label>
              <Input value={form.role} onChange={set("role")} placeholder="Developer" />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onChange={set("difficulty")}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={set("status")}>
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </div>
            <div>
              <Label>GitHub URL</Label>
              <Input value={form.githubUrl} onChange={set("githubUrl")} placeholder="https://github.com/…" />
            </div>
            <div>
              <Label>Demo URL</Label>
              <Input value={form.demoUrl} onChange={set("demoUrl")} placeholder="https://…" />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function CertificationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", issuer: "", date: "", credentialUrl: "" });
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/certifications", {
        method: "POST",
        body: JSON.stringify({ ...form, date: form.date || null, credentialUrl: form.credentialUrl || null })
      });
      toast.success("Certification added");
      setOpen(false);
      setForm({ name: "", issuer: "", date: "", credentialUrl: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add certification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" /> Add</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a certification" footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} loading={loading}>Add certification</Button>
        </>
      }>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>Certification name</Label>
            <Input required value={form.name} onChange={set("name")} placeholder="Python for Everybody" />
          </div>
          <div>
            <Label>Issuer</Label>
            <Input value={form.issuer} onChange={set("issuer")} placeholder="Coursera" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={set("date")} />
            </div>
            <div>
              <Label>Credential URL</Label>
              <Input value={form.credentialUrl} onChange={set("credentialUrl")} placeholder="https://…" />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteButton({ kind, id, label }: { kind: "project" | "certification"; id: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function remove() {
    setLoading(true);
    try {
      await api(`/api/${kind === "project" ? "projects" : "certifications"}?id=${id}`, { method: "DELETE" });
      toast.success(`${label[0].toUpperCase()}${label.slice(1)} deleted`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : `Could not delete ${label}`);
      setLoading(false);
    }
  }
  return (
    <button onClick={remove} disabled={loading} className="rounded-lg p-1.5 text-ink-300 hover:bg-rose-50 hover:text-rose-500" title={`Delete ${label}`} aria-label={`Delete ${label}`}>
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
