"use client";

import { useMemo, useState } from "react";
import type { KitchenDish } from "@/lib/kitchen";

type Props = {
  dishes: KitchenDish[];
  initialRecipes: Record<string, string>;
  /** readOnly = מצב טבחים — צפייה בלבד, בלי שום כפתור עריכה */
  readOnly?: boolean;
};

/** מודול מטבח — הוראות הכנה לכל מנה, מותאם מובייל לטבחים */
export default function KitchenView({ dishes, initialRecipes, readOnly = false }: Props) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [openDish, setOpenDish] = useState<KitchenDish | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const cats = useMemo(() => {
    const order = new Map<string, { key: string; label: string; count: number }>();
    for (const d of dishes) {
      const entry = order.get(d.cat) ?? { key: d.cat, label: d.catLabel, count: 0 };
      entry.count += 1;
      order.set(d.cat, entry);
    }
    return [...order.values()];
  }, [dishes]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return dishes.filter((d) => {
      if (cat !== "all" && d.cat !== cat) return false;
      if (!q) return true;
      return d.name.includes(q) || d.desc.includes(q) || (recipes[d.id] ?? "").includes(q);
    });
  }, [dishes, cat, query, recipes]);

  function open(d: KitchenDish, startInEdit = false) {
    setOpenDish(d);
    setSaveError(null);
    if (readOnly || !startInEdit) {
      setEditing(false);
    } else {
      setEditText(recipes[d.id] ?? "");
      setEditing(true);
    }
  }

  function startEdit() {
    setEditText(recipes[openDish!.id] ?? "");
    setEditing(true);
  }

  async function saveRecipe() {
    if (!openDish || saving) return;
    setSaving(true);
    setSaveError(null);
    const res = await fetch("/api/kitchen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId: openDish.id, steps: editText.trim() }),
    }).catch(() => null);
    setSaving(false);

    if (res?.ok) {
      setRecipes((prev) => ({ ...prev, [openDish.id]: editText.trim() }));
      setEditing(false);
    } else {
      setSaveError("השמירה נכשלה — נסו שוב");
    }
  }

  const catChip = (key: string, label: string, count?: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setCat(key)}
      className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition ${
        cat === key
          ? "bg-gradient-to-br from-tomato-400 to-tomato-600 text-white shadow-md shadow-tomato-600/25"
          : "border border-crust-700/15 bg-white text-crust-800 shadow-sm"
      } ${count === undefined ? "px-5" : ""}`}
    >
      {label}
      {count !== undefined && (
        <span className={`ms-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold ${cat === key ? "bg-white/25" : "bg-cream-100"}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div>
      {/* חיפוש + קטגוריות — דביקים בראש המסך */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-crust-700/10 bg-cream-50/95 px-4 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 חיפוש מנה…"
          className="field-light !py-3.5 !text-lg"
        />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {catChip("all", "הכל", dishes.length)}
          {cats.map((c) => catChip(c.key, c.label, c.count))}
        </div>
      </div>

      {/* רשימת המנות */}
      {filtered.length === 0 ? (
        <p className="p-10 text-center text-crust-700/50">לא נמצאו מנות מתאימות</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const hasRecipe = Boolean(recipes[d.id]?.trim());
            return (
              <li key={d.id} className="relative">
                <button
                  type="button"
                  onClick={() => open(d)}
                  className="w-full rounded-2xl border border-crust-700/10 bg-white p-4 text-start shadow-sm transition hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-lg font-extrabold text-crust-900">{d.name}</span>
                    <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-1 text-sm font-extrabold text-crust-700">
                      {d.price}₪
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-relaxed text-crust-700/70">{d.desc || "—"}</p>
                  <div className="mt-2.5">
                    {hasRecipe ? (
                      <span className="rounded-full bg-basil-500/10 px-3 py-1 text-xs font-extrabold text-basil-600">
                        ✓ יש הוראות הכנה
                      </span>
                    ) : (
                      <span className="rounded-full bg-cheese-400/15 px-3 py-1 text-xs font-bold text-cheese-500">
                        ✎ אין עדיין הוראות — לחצו להוספה
                      </span>
                    )}
                  </div>
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => open(d, true)}
                    title={`עריכת הוראות ${d.name}`}
                    aria-label={`עריכת הוראות ${d.name}`}
                    className="absolute left-3 top-3 rounded-xl bg-crust-900/5 p-2 text-crust-700/60 transition hover:bg-cheese-400/20 hover:text-cheese-600 active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.9l3.6 3.6L8.4 19.2 4 20l.8-4.4L16.5 3.9z" />
                    </svg>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* כרטיס מנה — מסך מלא */}
      {openDish && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="anim-fade absolute inset-0 bg-black/60" onClick={() => setOpenDish(null)} aria-hidden="true" />
          <div className="anim-card-in relative flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            {/* ראש הכרטיס */}
            <div className="flex items-center gap-3 border-b border-crust-700/10 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-2xl font-extrabold text-crust-900">{openDish.name}</h3>
                  <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-1 text-sm font-extrabold text-crust-700">
                    {openDish.price}₪
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-crust-700/50">{openDish.catLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenDish(null)}
                aria-label="סגירה"
                className="rounded-xl p-2.5 text-crust-700/50 transition hover:bg-cream-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* תוכן נגלל */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <h4 className="text-sm font-extrabold uppercase tracking-wide text-crust-700/50">מרכיבים</h4>
              <p className="mt-1.5 text-lg leading-relaxed text-crust-800">{openDish.desc || "אין תיאור מרכיבים בתפריט"}</p>

              <div className="my-5 border-t border-dashed border-crust-700/20" />

              <h4 className="text-sm font-extrabold uppercase tracking-wide text-crust-700/50">הוראות הכנה</h4>
              {editing ? (
                <div className="mt-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={9}
                    placeholder={"לדוגמה:\n1. מרדדים את הבצק לקוטר 36\n2. מורחים רוטב ומוצרלה\n3. תנור 350 מעלות עד הזהבה"}
                    className="field-light !text-lg leading-relaxed"
                    autoFocus
                  />
                  {saveError && <p className="mt-2 text-sm font-semibold text-tomato-600">{saveError}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={saveRecipe}
                      disabled={saving}
                      className="flex-1 rounded-xl bg-gradient-to-br from-basil-400 to-basil-600 px-6 py-3.5 text-lg font-extrabold text-white shadow-lg shadow-basil-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                    >
                      {saving ? "שומר…" : "שמירת הוראות"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-xl border border-crust-700/15 bg-white px-5 py-3.5 font-bold text-crust-800 shadow-sm"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="whitespace-pre-line text-xl font-medium leading-loose text-crust-900">
                    {recipes[openDish.id]?.trim() || "עדיין לא נכתבו הוראות הכנה למנה הזו"}
                  </p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="mt-5 w-full rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-6 py-3.5 text-lg font-extrabold text-white shadow-lg shadow-tomato-600/25 transition hover:brightness-110 active:scale-[0.99]"
                    >
                      ✎ {recipes[openDish.id]?.trim() ? "עריכת ההוראות" : "כתיבת הוראות הכנה"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
