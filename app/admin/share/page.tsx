import { getStore } from "@/lib/db";
import ShareView from "@/components/ShareView";

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const { adminPassword: _hidden, ...settings } = await (await getStore()).getSettings();
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-crust-900">שיתוף המועדון</h1>
      <p className="mb-6 text-sm text-crust-700/60">כל הדרכים לגייס חברים חדשים למועדון הלקוחות</p>
      <ShareView settings={settings} />
    </div>
  );
}
