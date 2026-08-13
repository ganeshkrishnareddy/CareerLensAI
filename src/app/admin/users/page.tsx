import { requireRole } from "@/lib/auth";
import { UsersClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole("ADMIN");
  return (
    <div>
      <UsersClient />
    </div>
  );
}
