import { getStore } from "@/lib/db";
import { getKitchenDishes } from "@/lib/kitchen";
import { isKitchenAuthed } from "@/lib/kitchenAuth";
import KitchenGate from "@/components/KitchenGate";
import KitchenView from "@/components/KitchenView";

export const dynamic = "force-dynamic";

/**
 * מטבח הטבחים — צפייה בלבד, נפתח בקישור ייעודי עם קוד מטבח.
 * בלי קוד נכון לא נחשף דבר — גם לא רשימת המנות.
 */
export default async function PublicKitchenPage() {
  const settings = await (await getStore()).getSettings();

  // קוד לא מוגדר — הקישור מושבת עד שהמנהל יגדיר קוד בהגדרות
  if (!settings.kitchenPin) {
    const { kitchenPin: _hidden, ...publicSettings } = settings;
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-100 px-4 text-center">
        <div>
          <p className="text-4xl">👨‍🍳</p>
          <h1 className="mt-3 text-xl font-extrabold text-crust-900">המטבח עדיין לא פעיל</h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-crust-700/60">
            המנהל צריך להגדיר קוד מטבח בהגדרות המערכת — ואז הקישור ייפתח לצוות המטבח
          </p>
        </div>
      </div>
    );
  }

  if (!(await isKitchenAuthed())) {
    const { kitchenPin: _hidden, ...publicSettings } = settings;
    return <KitchenGate settings={publicSettings} />;
  }

  const [dishes, recipes] = await Promise.all([getKitchenDishes(), (await getStore()).getRecipes()]);
  return (
    <div className="min-h-dvh bg-cream-50 px-4 pb-8 pt-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-crust-900">מטבח 👨‍🍳</h1>
          <span className="rounded-full bg-basil-500/10 px-3 py-1 text-xs font-bold text-basil-600">צפייה בלבד</span>
        </div>
        <KitchenView dishes={dishes} initialRecipes={recipes} readOnly />
      </div>
    </div>
  );
}
