import { getStore } from "@/lib/db";
import { getKitchenDishes } from "@/lib/kitchen";
import KitchenView from "@/components/KitchenView";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const [dishes, recipes] = await Promise.all([getKitchenDishes(), (await getStore()).getRecipes()]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-crust-900">מטבח 👨‍🍳</h1>
      <p className="mb-5 text-sm text-crust-700/60">
        הוראות הכנה לכל מנות התפריט — מסונכרן אוטומטית עם העורך. נוח לטלפון במטבח
      </p>
      <KitchenView dishes={dishes} initialRecipes={recipes} />
    </div>
  );
}
