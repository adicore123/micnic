"use client";

import { useMemo, useState, type FormEvent } from "react";
import JoinForm, { type JoinResult } from "./JoinForm";
import SuccessView from "./SuccessView";
import WhatsAppButton from "./WhatsAppButton";
import { renderMessage, waLink } from "@/lib/whatsapp";
import { displayPhone, joinSchema } from "@/lib/phone";
import type { Customer, PublicSettings } from "@/lib/db/types";

const pad = (n: number) => String(n).padStart(4, "0");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const dateFmt = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "numeric" });

export default function AdminDashboard({
  initialCustomers,
  settings,
}: {
  initialCustomers: Customer[];
  settings: PublicSettings;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [result, setResult] = useState<JoinResult | null>(null);
  const [query, setQuery] = useState("");

  // עריכת לקוח
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);

  const stats = useMemo(
    () => ({
      total: customers.length,
      thisWeek: customers.filter((c) => Date.now() - new Date(c.createdAt).getTime() < WEEK_MS).length,
    }),
    [customers],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return customers;
    const lower = q.toLowerCase();
    const digits = q.replace(/\D/g, "");
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        (digits && (c.phone.includes(digits) || pad(c.cardNumber).includes(digits))),
    );
  }, [customers, query]);

  function handleDone(r: JoinResult) {
    setResult(r);
    if (!r.existing) setCustomers((prev) => [r.customer, ...prev.filter((c) => c.id !== r.customer.id)]);
  }

  async function remove(customer: Customer) {
    if (!window.confirm(`למחוק את ${customer.name} מהמועדון?`)) return;
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    } else {
      window.alert("המחיקה נכשלה — נסו שוב");
    }
  }

  function startEdit(customer: Customer) {
    setEditing(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditError(null);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const parsed = joinSchema.safeParse({ name: editName, phone: editPhone });
    if (!parsed.success) {
      setEditError(parsed.error.issues[0].message);
      return;
    }

    setEditPending(true);
    setEditError(null);
    const res = await fetch(`/api/customers/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    }).catch(() => null);
    setEditPending(false);

    if (res?.ok) {
      const { customer } = (await res.json()) as { customer: Customer };
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
      setEditing(null);
    } else {
      const data = res ? await res.json().catch(() => null) : null;
      setEditError(data?.error ?? "השמירה נכשלה — נסו שוב");
    }
  }

  const actionBtn =
    "rounded-lg p-1.5 transition";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[400px_1fr]">
      {/* הוספת לקוח */}
      <section className="h-fit rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">הוספת לקוח חדש</h2>
        <p className="mb-5 mt-1 text-sm leading-relaxed text-crust-700/60">
          מלאו שם וטלפון, ואז שלחו את הודעת התודה וההנחה בוואטסאפ — בלחיצה אחת
        </p>

        {result ? (
          <div className="rounded-2xl bg-crust-900 p-5">
            <SuccessView result={result} settings={settings} mode="staff" onReset={() => setResult(null)} />
          </div>
        ) : (
          <JoinForm dark={false} onDone={handleDone} submitLabel="הוספה למועדון 🍕" />
        )}
      </section>

      {/* רשימת לקוחות */}
      <section>
        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { icon: "👥", value: stats.total, label: "חברים במועדון" },
            { icon: "🎉", value: stats.thisWeek, label: "הצטרפו השבוע" },
            { icon: "💰", value: `${settings.discountPercent}%`, label: "הנחת חבר" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-crust-700/10 bg-white px-3 py-4 text-center shadow-sm sm:px-4">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-1 text-xl font-extrabold text-crust-900 sm:text-2xl">{s.value}</div>
              <div className="text-[11px] font-medium text-crust-700/60 sm:text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-crust-700/10 bg-white shadow-sm">
          <div className="border-b border-crust-700/10 p-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 חיפוש לקוח — שם, טלפון או מספר חבר (עובד גם עם קורא ברקוד)"
              className="field-light"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-crust-700/50">
              {customers.length === 0 ? "עדיין אין חברים במועדון — הוסיפו את הראשון 🍕" : "לא נמצאו לקוחות שמתאימים לחיפוש"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-crust-700/50 [&>th]:px-4 [&>th]:py-3 [&>th]:text-start [&>th]:font-semibold">
                    <th>מס׳ חבר</th>
                    <th>שם</th>
                    <th>טלפון</th>
                    <th>הצטרף בתאריך</th>
                    <th className="text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-crust-700/5">
                  {filtered.map((c) => (
                    <tr key={c.id} className="transition hover:bg-cream-100/50">
                      <td className="px-4 py-3 font-mono text-xs text-crust-700/70" dir="ltr">
                        #{pad(c.cardNumber)}
                      </td>
                      <td className="max-w-40 truncate px-4 py-3 font-bold text-crust-900">{c.name}</td>
                      <td className="px-4 py-3 text-crust-700" dir="ltr">
                        {displayPhone(c.phone)}
                      </td>
                      <td className="px-4 py-3 text-crust-700/70">{dateFmt.format(new Date(c.createdAt))}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <WhatsAppButton
                            size="sm"
                            href={waLink(c.phone, renderMessage(settings.messageTemplate, c.name, settings))}
                            label={`שליחת הודעה ל${c.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            title={`עריכת ${c.name}`}
                            aria-label={`עריכת ${c.name}`}
                            className={`${actionBtn} text-crust-700/50 hover:bg-cheese-400/15 hover:text-cheese-500`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.9l3.6 3.6L8.4 19.2 4 20l.8-4.4L16.5 3.9z" />
                            </svg>
                          </button>
                          <a
                            href={`/admin/card/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`הדפסת כרטיס ${c.name}`}
                            aria-label={`הדפסת כרטיס ${c.name}`}
                            className={`${actionBtn} inline-flex text-crust-700/50 hover:bg-basil-500/10 hover:text-basil-600`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8V4h10v4M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2m-10-2h10v6H7v-6z" />
                            </svg>
                          </a>
                          <button
                            type="button"
                            onClick={() => remove(c)}
                            title={`מחיקת ${c.name}`}
                            aria-label={`מחיקת ${c.name}`}
                            className={`${actionBtn} text-crust-700/40 hover:bg-tomato-500/10 hover:text-tomato-600`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                              <path strokeLinecap="round" d="M5 7h14M10 7V5a1 1 0 011-1h2a1 1 0 011 1v2m3 0v12a1 1 0 01-1 1H8a1 1 0 01-1-1V7m4 4v6m4-6v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* חלונית עריכת לקוח */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="anim-fade absolute inset-0 bg-black/50" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={saveEdit} className="anim-pop relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-crust-900">עריכת לקוח</h3>
            <p className="mb-5 mt-1 text-sm text-crust-700/60">עדכון שם או טלפון שהשתנו</p>

            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-semibold text-crust-700">
              שם מלא
            </label>
            <input
              id="edit-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="field-light mb-4"
            />

            <label htmlFor="edit-phone" className="mb-1.5 block text-sm font-semibold text-crust-700">
              טלפון נייד
            </label>
            <input
              id="edit-phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="field-light text-right"
            />

            {editError && <p className="mt-3 text-sm font-semibold text-tomato-600">{editError}</p>}

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={editPending}
                className="flex-1 rounded-xl bg-gradient-to-br from-basil-400 to-basil-600 px-6 py-3 font-extrabold text-white shadow-lg shadow-basil-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              >
                {editPending ? "שומר…" : "שמירת שינויים"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-crust-700/15 bg-white px-6 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
