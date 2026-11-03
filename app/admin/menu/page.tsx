import { getStore } from "@/lib/db";
import MenuView from "@/components/MenuView";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const { adminPassword: _hidden, ...settings } = await (await getStore()).getSettings();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-crust-900">התפריט הדיגיטלי</h1>
      <p className="mb-6 text-sm text-crust-700/60">שליחה ללקוחות בוואטסאפ, קישור לשיתוף ו-QR לשולחנות</p>
      <MenuView settings={settings} />
    </div>
  );
}
