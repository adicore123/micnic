import { getStore } from "@/lib/db";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { adminPassword: _hidden, ...settings } = await (await getStore()).getSettings();
  return <SettingsForm initial={settings} />;
}
