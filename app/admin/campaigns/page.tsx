import { getStore } from "@/lib/db";
import CampaignsView from "@/components/CampaignsView";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const store = await getStore();
  const [customers, settings] = await Promise.all([store.listCustomers(), store.getSettings()]);
  const { adminPassword: _hidden, ...publicSettings } = settings;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-crust-900">קמפיינים</h1>
      <p className="mb-6 text-sm text-crust-700/60">מבצעים לכלל החברים או לפילוח — אישי ומדויק, בלחיצה אחת לכל לקוח</p>
      <CampaignsView initialCustomers={customers} settings={publicSettings} />
    </div>
  );
}
