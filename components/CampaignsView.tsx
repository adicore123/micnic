"use client";

import { useMemo, useState } from "react";
import WhatsAppButton from "./WhatsAppButton";
import { renderMessage, waLink } from "@/lib/whatsapp";
import { displayPhone } from "@/lib/phone";
import type { Customer, PublicSettings } from "@/lib/db/types";

type Segment = { id: string; label: string; hint: string };

const SEGMENTS: Segment[] = [
  { id: "all", label: "כל החברים", hint: "שליחה לכלל חברי המועדון" },
  { id: "new", label: "חדשים (30 יום)", hint: "הצטרפו בחודש האחרון — הזמן לחבר אותם" },
  { id: "inactive", label: "לא הזמינו 30+ יום", hint: "חברים שנעלמו — מבצע חזרה" },
  { id: "vip", label: "VIP", hint: "לקוחות מתויגים VIP" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_MESSAGE = `🍕 מבצע חדש ב{business}!

רוצים {discount}% הנחה על ההזמנה הבאה?
מציגים את ההודעה הזו בקופה עד סוף השבוע 🎁

נשמח לראותכם!`;

/** קמפיינים — שליחת מבצעים לכלל החברים או לפילוח, אישית לכל לקוח */
export default function CampaignsView({
  initialCustomers,
  settings,
}: {
  initialCustomers: Customer[];
  settings: PublicSettings;
}) {
  const [segment, setSegment] = useState<Segment>(SEGMENTS[0]);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const audience = useMemo(() => {
    const now = Date.now();
    return initialCustomers.filter((c) => {
      if (segment.id === "new") return now - new Date(c.createdAt).getTime() <= 30 * DAY_MS;
      if (segment.id === "inactive") {
        const last = c.lastVisitAt ?? c.createdAt;
        return now - new Date(last).getTime() > 30 * DAY_MS;
      }
      if (segment.id === "vip") return c.tags?.includes("VIP") ?? false;
      return true;
    });
  }, [initialCustomers, segment]);

  const preview = useMemo(
    () => renderMessage(message, "דניאל", settings),
    [message, settings],
  );

  const sent = audience.filter((c) => sentIds.has(c.id)).length;

  function markSent(id: string) {
    setSentIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="space-y-8">
      {/* הודעת הקמפיין */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">הודעת הקמפיין</h2>
        <p className="mb-4 mt-1 text-sm text-crust-700/60">
          כותבים את המבצע פעם אחת — והוא נשלח אישית לכל לקוח עם השם שלו. מציינים: {`{name}`}, {`{business}`}, {`{discount}`}
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="field-light resize-y leading-relaxed"
        />

        <div className="mt-4 overflow-hidden rounded-2xl border border-crust-700/10 shadow-md">
          <div className="bg-[#1F2C33] px-4 py-3">
            <div className="text-xs font-bold text-white/80">תצוגה חיה — כך תיראה ההודעה אצל הלקוח (שם לדוגמה: דניאל)</div>
          </div>
          <div className="min-h-32 bg-[#0B141A] p-4">
            <div className="wa-bubble-dark ml-6 w-fit max-w-full px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line">
              {preview}
              <span className="mt-1 block text-left text-[10px] text-white/50">✓✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* קהל ושליחה */}
      <section>
        <h2 className="mb-3 text-lg font-extrabold text-crust-900">למי שולחים</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSegment(s)}
              title={s.hint}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                segment.id === s.id
                  ? "bg-gradient-to-br from-tomato-400 to-tomato-600 text-white shadow-md shadow-tomato-600/25"
                  : "border border-crust-700/15 bg-white text-crust-800 shadow-sm hover:bg-cream-100"
              }`}
            >
              {s.label}
              <span className={`ms-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${segment.id === s.id ? "bg-white/20" : "bg-cream-100 text-crust-700"}`}>
                {initialCustomers.filter((c) =>
                  s.id === "all" ? true
                  : s.id === "new" ? Date.now() - new Date(c.createdAt).getTime() <= 30 * DAY_MS
                  : s.id === "inactive" ? Date.now() - new Date(c.lastVisitAt ?? c.createdAt).getTime() > 30 * DAY_MS
                  : c.tags?.includes("VIP") ?? false,
                ).length}
              </span>
            </button>
          ))}
        </div>
        <p className="mb-4 text-xs font-semibold text-crust-700/50">{segment.hint}</p>

        {audience.length === 0 ? (
          <p className="rounded-2xl border border-crust-700/10 bg-white p-10 text-center text-sm text-crust-700/50 shadow-sm">
            אין לקוחות בקהל הזה כרגע
          </p>
        ) : (
          <div className="rounded-2xl border border-crust-700/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-crust-700/10 px-5 py-3.5">
              <span className="text-sm font-extrabold text-crust-900">
                {audience.length} לקוחות בקהל
              </span>
              <span className="text-sm font-bold text-basil-600">
                נשלח ✓ {sent}/{audience.length}
              </span>
            </div>
            <ul className="divide-y divide-crust-700/5">
              {audience.map((c) => {
                const done = sentIds.has(c.id);
                return (
                  <li key={c.id} className={`flex items-center gap-3 px-5 py-3 transition ${done ? "bg-basil-500/5" : ""}`}>
                    <span className="w-11 text-center font-mono text-xs text-crust-700/60" dir="ltr">
                      #{String(c.cardNumber).padStart(4, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-crust-900">{c.name}</div>
                      <div className="text-xs text-crust-700/60" dir="ltr">
                        {displayPhone(c.phone)}
                      </div>
                    </div>
                    {done ? (
                      <span className="rounded-lg bg-basil-500/10 px-3 py-1.5 text-xs font-extrabold text-basil-600">נשלח ✓</span>
                    ) : (
                      <div onClick={() => markSent(c.id)}>
                        <WhatsAppButton
                          size="sm"
                          href={waLink(c.phone, renderMessage(message, c.name, settings))}
                          label={`שליחת הקמפיין ל${c.name}`}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
