"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { Badge, Button, Card, CardHeader, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui/ui";
import { Modal } from "@/components/ui/modal";
import { confirmDelete } from "@/lib/confirm";

interface SkillRef {
  id: string;
  name: string;
  category: string;
}

interface RoleSkillRow {
  id: string;
  requirement: string;
  minProficiency: number;
  weight: number;
  skill: SkillRef;
}

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  isCustom: boolean;
  roleSkills: RoleSkillRow[];
  _count: { profiles: number; assessments: number };
}

export function RolesClient({ initialRoles, skills }: { initialRoles: RoleRow[]; skills: SkillRef[] }) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleRow[]>(initialRoles);
  const [createOpen, setCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleCategory, setRoleCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // requirement editor state
  const [editor, setEditor] = useState<RoleRow | null>(null);
  const [skillId, setSkillId] = useState("");
  const [reqLevel, setReqLevel] = useState("REQUIRED");
  const [minProf, setMinProf] = useState("70");
  const [weight, setWeight] = useState("1");
  const [toggling, setToggling] = useState<string | null>(null);

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      await api("/api/admin/roles", { method: "POST", body: JSON.stringify({ name: roleName.trim(), description: roleDesc.trim() || undefined, category: roleCategory || undefined }) });
      toast.success("Role created");
      setCreateOpen(false);
      setRoleName("");
      setRoleDesc("");
      setRoleCategory("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create role");
    } finally {
      setSaving(false);
    }
  }

  async function addRequirement(e: React.FormEvent) {
    e.preventDefault();
    if (!editor || !skillId) return;
    setSaving(true);
    try {
      await api(`/api/admin/roles/${editor.id}/skills`, {
        method: "POST",
        body: JSON.stringify({ skillId, requirement: reqLevel, minProficiency: Number(minProf), weight: Number(weight) })
      });
      toast.success("Requirement updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save requirement");
    } finally {
      setSaving(false);
    }
  }

  async function removeRequirement(roleId: string, skillId: string, name: string) {
    if (!(await confirmDelete(`Remove ${name}?`, "This skill will no longer count toward the role requirements."))) return;
    setToggling(roleId + skillId);
    try {
      await api(`/api/admin/roles/${roleId}/skills?skillId=${skillId}`, { method: "DELETE" });
      toast.success("Requirement removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove requirement");
    } finally {
      setToggling(null);
    }
  }

  async function toggleRole(role: RoleRow) {
    setToggling(role.id);
    try {
      await api(`/api/admin/roles/${role.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !role.isActive }) });
      toast.success(role.isActive ? "Role deactivated" : "Role activated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update role");
    } finally {
      setToggling(null);
    }
  }

  async function deleteRole(role: RoleRow) {
    if (!(await confirmDelete(`Delete ${role.name}?`, "Students targeting this role will lose their gap analysis. This cannot be undone."))) return;
    setToggling(role.id);
    try {
      await api(`/api/admin/roles/${role.id}`, { method: "DELETE" });
      toast.success("Role deleted");
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete role");
    } finally {
      setToggling(null);
    }
  }

  const availableSkills = skills.filter((s) => !editor?.roleSkills.some((rs) => rs.skill.id === s.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Requirements"
        subtitle="The role requirement engine is database-driven — every requirement below feeds the skill-gap engine."
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New role</Button>}
      />

      {roles.length === 0 && <EmptyState icon={<Target className="h-8 w-8" />} title="No roles yet" description="Create a role to start building requirement profiles." />}

      <div className="grid gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-ink-900">{role.name}</h3>
                <p className="mt-0.5 text-xs text-ink-500">{role.description ?? "No description"} · {role._count.profiles} student{role._count.profiles === 1 ? "" : "s"} targeting</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!role.isActive && <Badge color="slate">Inactive</Badge>}
                <Button variant="ghost" size="icon" title="Edit requirements" onClick={() => { setEditor(role); setSkillId(""); }}>
                  <Settings2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={toggling === role.id} onClick={() => toggleRole(role)} title={role.isActive ? "Deactivate" : "Activate"}>
                  <Target className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={toggling === role.id} onClick={() => deleteRole(role)} className="text-ink-400 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {role.roleSkills.length === 0 && <p className="text-xs text-ink-400">No requirements yet — click the settings icon to add skills.</p>}
              {[...role.roleSkills].sort((a, b) => (a.requirement === b.requirement ? b.weight - a.weight : a.requirement === "REQUIRED" ? -1 : 1)).map((rs) => (
                <div key={rs.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5">
                  <div>
                    <p className="text-[13px] font-semibold text-ink-800">{rs.skill.name}</p>
                    <p className="text-[11px] text-ink-400">Min {rs.minProficiency}% · weight {rs.weight}</p>
                  </div>
                  <Badge color={rs.requirement === "REQUIRED" ? "brand" : "slate"}>{rs.requirement === "REQUIRED" ? "Required" : "Preferred"}</Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Create role */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create role">
        <form onSubmit={createRole} className="space-y-4">
          <div>
            <Label>Role name</Label>
            <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Machine Learning Engineer" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={roleCategory} onChange={(e) => setRoleCategory(e.target.value)} placeholder="e.g. Technology / Analytics" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} rows={3} className="w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30" placeholder="What does this role do?" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!roleName.trim()}>Create role</Button>
          </div>
        </form>
      </Modal>

      {/* Requirement editor */}
      <Modal open={!!editor} onClose={() => setEditor(null)} title={editor ? `Requirements — ${editor.name}` : ""} size="lg">
        {editor && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink-800">Current requirements</p>
              <div className="space-y-2">
                {editor.roleSkills.length === 0 && <p className="text-xs text-ink-400">None yet.</p>}
                {editor.roleSkills.map((rs) => (
                  <div key={rs.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5">
                    <div>
                      <p className="text-[13px] font-semibold text-ink-800">{rs.skill.name}</p>
                      <p className="text-[11px] text-ink-400">{rs.requirement} · min {rs.minProficiency}% · weight {rs.weight}</p>
                    </div>
                    <Button variant="ghost" size="sm" disabled={toggling === editor.id + rs.skill.id} onClick={() => removeRequirement(editor.id, rs.skill.id, rs.skill.name)} className="text-ink-400 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={addRequirement} className="rounded-xl border border-ink-200 p-4">
              <p className="mb-3 text-[13px] font-semibold text-ink-800">Add / update a requirement</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Skill</Label>
                  <Select value={skillId} onChange={(e) => setSkillId(e.target.value)} disabled={availableSkills.length === 0}>
                    <option value="">{availableSkills.length === 0 ? "All skills already added" : "Select a skill…"}</option>
                    {availableSkills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Requirement</Label>
                  <Select value={reqLevel} onChange={(e) => setReqLevel(e.target.value)}>
                    <option value="REQUIRED">Required</option>
                    <option value="PREFERRED">Preferred</option>
                  </Select>
                </div>
                <div>
                  <Label>Minimum proficiency %</Label>
                  <Input type="number" min={0} max={100} value={minProf} onChange={(e) => setMinProf(e.target.value)} />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit" loading={saving} disabled={!skillId}>Save requirement</Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
