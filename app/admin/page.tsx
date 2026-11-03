import { getStore } from "@/lib/db";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const store = await getStore();
  const [customers, settings] = await Promise.all([store.listCustomers(), store.getSettings()]);
  const { adminPassword: _hidden, ...publicSettings } = settings;

  return <AdminDashboard initialCustomers={customers} settings={publicSettings} />;
}
