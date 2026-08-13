import { requireRole } from "@/lib/auth";
import { getSettings } from "@/services/admin-service";
import { SettingsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");
  const settings = await getSettings();
  return <SettingsClient initial={settings} />;
}
