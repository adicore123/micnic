import { promises as fs } from "node:fs";
import path from "node:path";

export type KitchenDish = {
  id: string;
  cat: string;
  catLabel: string;
  name: string;
  price: number;
  desc: string;
};

/**
 * מחלץ את רשימת המנות מה-seed של עורך התפריט — מקור האמת היחיד.
 * מנה חדשה שנוספת בעורך מופיעה במטבח אוטומטית.
 */
export async function getKitchenDishes(): Promise<KitchenDish[]> {
  const html = await fs.readFile(path.join(process.cwd(), "public", "menu-editor.html"), "utf8");

  const seedMatch = html.match(/id="seed">(\{.*?\})<\/script>/s);
  if (!seedMatch) return [];

  let items: Array<{ id: string; cat: string; name: string; price: number; desc?: string }> = [];
  try {
    items = JSON.parse(seedMatch[1]).items ?? [];
  } catch {
    return [];
  }

  // תוויות הקטגוריות בעברית מתוך קוד העמוד: const categories=[['starters','ראשונות',...],...]
  const labels = new Map<string, string>();
  const catsMatch = html.match(/const categories=\[(.*?)\];/s);
  if (catsMatch) {
    for (const [, key, label] of catsMatch[1].matchAll(/\[\s*'([^']+)'\s*,\s*'([^']+)'/g)) {
      labels.set(key, label);
    }
  }

  return items
    .filter((it) => it?.id && it?.name)
    .map((it) => ({
      id: String(it.id),
      cat: it.cat ?? "",
      catLabel: labels.get(it.cat ?? "") ?? it.cat ?? "",
      name: it.name,
      price: it.price ?? 0,
      desc: it.desc ?? "",
    }));
}
