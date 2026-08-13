import { requireRole } from "@/lib/auth";
import { listDepartments } from "@/services/admin-service";
import { DepartmentsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminDepartmentsPage() {
  await requireRole("ADMIN");
  const data = await listDepartments();
  return <DepartmentsClient initial={data} />;
}
