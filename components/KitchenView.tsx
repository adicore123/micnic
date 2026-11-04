"use client";

import { useMemo, useRef, useState } from "react";
import { fileToResizedDataUrl } from "@/lib/image";
import type { KitchenDish } from "@/lib/kitchen";
import type { RecipeEntry } from "@/lib/db/types";

type Props = {
  dishes: KitchenDish[];
  initialRecipes: Record<string, RecipeEntry>;
  /** readOnly = מצב טבחים — צפייה בלבד, בלי שום כפתור עריכה */
  readOnly?: boolean;
};

/** מודול מטבח — הוראות הכנה ותמונת מנה לכל מנה, מותאם מובייל לטבחים */
export default function KitchenView({ dishes, initialRecipes, readOnly = false }: Props) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [openDish, setOpenDish] = useState<KitchenDish | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoPending, setPhotoPending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      return d.name.includes(q) || d.desc.includes(q) || (recipes[d.id]?.steps ?? "").includes(q);
    });
  }, [dishes, cat, query, recipes]);

  function entry(dishId: string): RecipeEntry {
    return recipes[dishId] ?? { steps: "" };
  }

  function open(d: KitchenDish, startInEdit = false) {
    setOpenDish(d);
    setSaveError(null);
    if (readOnly || !startInEdit) {
      setEditing(false);
    } else {
      setEditText(entry(d.id).steps);
      setEditing(true);
    }
  }

  function startEdit() {
    setEditText(entry(openDish!.id).steps);
    setEditing(true);
  }

  function patchRecipe(dishId: string, patch: { steps?: string; image?: string | null }) {
    setRecipes((prev) => {
      const current = prev[dishId] ?? { steps: "" };
      const next: RecipeEntry = { ...current, ...(patch.steps !== undefined ? { steps: patch.steps } : {}) };
      if (patch.image === null) delete next.image;
      else if (patch.image !== undefined) next.image = patch.image;
      return { ...prev, [dishId]: next };
    });
  }

  async function saveSteps() {
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
      patchRecipe(openDish.id, { steps: editText.trim() });
      setEditing(false);
    } else {
      setSaveError("השמירה נכשלה — נסו שוב");
    }
  }

  async function savePhoto(file: File | undefined | null) {
    if (!file || !openDish || photoPending) return;
    setPhotoPending(true);
    setSaveError(null);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      const res = await fetch("/api/kitchen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId: openDish.id, image: dataUrl }),
      }).catch(() => null);
      if (res?.ok) {
        patchRecipe(openDish.id, { image: dataUrl });
      } else {
        setSaveError("שמירת התמונה נכשלה — נסו שוב");
      }
    } catch {
      setSaveError("קריאת התמונה נכשלה — נסו שוב");
    } finally {
      setPhotoPending(false);
    }
  }

  async function removePhoto() {
    if (!openDish || photoPending) return;
    setPhotoPending(true);
    const res = await fetch("/api/kitchen", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId: openDish.id, image: null }),
    }).catch(() => null);
    setPhotoPending(false);
    if (res?.ok) patchRecipe(openDish.id, { image: null });
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

  const openImage = openDish ? entry(openDish.id).image : undefined;

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
            const e = entry(d.id);
            const hasRecipe = Boolean(e.steps.trim());
            return (
              <li key={d.id} className="relative">
                <button
                  type="button"
                  onClick={() => open(d)}
                  className="flex w-full gap-3 rounded-2xl border border-crust-700/10 bg-white p-3.5 text-start shadow-sm transition hover:shadow-md active:scale-[0.99]"
                >
                  {e.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.image}
                      alt={d.name}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-crust-700/10"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-2xl" aria-hidden="true">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-lg font-extrabold text-crust-900">{d.name}</span>
                      <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-1 text-sm font-extrabold text-crust-700">
                        {d.price}₪
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-crust-700/70">{d.desc || "—"}</p>
                    <div className="mt-1.5">
                      {hasRecipe ? (
                        <span className="rounded-full bg-basil-500/10 px-3 py-1 text-xs font-extrabold text-basil-600">
                          ✓ הוראות הכנה
                        </span>
                      ) : (
                        <span className="rounded-full bg-cheese-400/15 px-3 py-1 text-xs font-bold text-cheese-500">
                          אין עדיין הוראות
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => open(d, true)}
                    title={`עריכת ${d.name}`}
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
              {/* תמונת המנה — כך המנה אמורה להיראות */}
              {openImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={openImage}
                  alt={openDish.name}
                  className="mb-5 aspect-[4/3] w-full rounded-2xl object-cover shadow-md ring-1 ring-crust-700/10"
                />
              ) : editing ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoPending}
                  className="mb-5 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-crust-700/20 bg-cream-50 text-crust-700/50 transition hover:border-cheese-500/50 hover:bg-cream-100 disabled:opacity-60"
                >
                  <span className="text-4xl">📷</span>
                  <span className="text-sm font-bold">{photoPending ? "שומר תמונה…" : "צילום המנה / העלאת תמונה"}</span>
                  <span className="text-xs">כך כולם יראו איך המנה אמורה לצאת</span>
                </button>
              ) : null}

              {editing && openImage && (
                <div className="mb-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={photoPending}
                    className="rounded-xl border border-crust-700/15 bg-white px-4 py-2.5 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 disabled:opacity-60"
                  >
                    📷 {photoPending ? "שומר…" : "החלפת התמונה"}
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoPending}
                    className="rounded-xl border border-tomato-500/20 bg-white px-4 py-2.5 text-sm font-bold text-tomato-600 shadow-sm transition hover:bg-tomato-500/10 disabled:opacity-60"
                  >
                    🗑 הסרת תמונה
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  void savePhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

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
                      onClick={saveSteps}
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
                    {entry(openDish.id).steps.trim() || "עדיין לא נכתבו הוראות הכנה למנה הזו"}
                  </p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="mt-5 w-full rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-6 py-3.5 text-lg font-extrabold text-white shadow-lg shadow-tomato-600/25 transition hover:brightness-110 active:scale-[0.99]"
                    >
                      ✎ {entry(openDish.id).steps.trim() ? "עריכת המנה (הוראות + תמונה)" : "כתיבת הוראות + צילום המנה"}
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
