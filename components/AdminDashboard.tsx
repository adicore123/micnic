"use client";

import { useMemo, useState } from "react";
import JoinForm, { type JoinResult } from "./JoinForm";
import SuccessView from "./SuccessView";
import WhatsAppButton from "./WhatsAppButton";
import { renderMessage, waLink } from "@/lib/whatsapp";
import { displayPhone } from "@/lib/phone";
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
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { icon: "👥", value: stats.total, label: "חברים במועדון" },
            { icon: "🎉", value: stats.thisWeek, label: "הצטרפו השבוע" },
            { icon: "💰", value: `${settings.discountPercent}%`, label: "הנחת חבר" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-crust-700/10 bg-white px-4 py-4 text-center shadow-sm">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-1 text-2xl font-extrabold text-crust-900">{s.value}</div>
              <div className="text-xs font-medium text-crust-700/60">{s.label}</div>
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
                    <th className="w-24 text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-crust-700/5">
                  {filtered.map((c) => (
                    <tr key={c.id} className="transition hover:bg-cream-100/50">
                      <td className="px-4 py-3 font-mono text-xs text-crust-700/70" dir="ltr">
                        #{pad(c.cardNumber)}
                      </td>
                      <td className="px-4 py-3 font-bold text-crust-900">{c.name}</td>
                      <td className="px-4 py-3 text-crust-700" dir="ltr">
                        {displayPhone(c.phone)}
                      </td>
                      <td className="px-4 py-3 text-crust-700/70">{dateFmt.format(new Date(c.createdAt))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <WhatsAppButton
                            size="sm"
                            href={waLink(c.phone, renderMessage(settings.messageTemplate, c.name, settings))}
                            label={`שליחת הודעה ל${c.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => remove(c)}
                            title={`מחיקת ${c.name}`}
                            aria-label={`מחיקת ${c.name}`}
                            className="rounded-lg p-1.5 text-crust-700/40 transition hover:bg-tomato-500/10 hover:text-tomato-600"
                          >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
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
    </div>
  );
}
