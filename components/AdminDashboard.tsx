"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import JoinForm, { type JoinResult } from "./JoinForm";
import SuccessView from "./SuccessView";
import WhatsAppButton from "./WhatsAppButton";
import { menuMessage, menuUrl, renderBirthday, renderInvite, renderMessage, waLink } from "@/lib/whatsapp";
import { displayPhone, joinSchema } from "@/lib/phone";
import type { Customer, PublicSettings } from "@/lib/db/types";

const pad = (n: number) => String(n).padStart(4, "0");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const QUICK_TAGS = ["VIP", "אלרגיה", "עסקי", "משלוח"];

const dateFmt = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "numeric" });

function tagClass(tag: string): string {
  if (tag === "VIP") return "bg-cheese-400/20 text-cheese-500 ring-cheese-500/40";
  if (tag.includes("אלר")) return "bg-tomato-500/10 text-tomato-600 ring-tomato-500/30";
  return "bg-cream-100 text-crust-700 ring-crust-700/15";
}

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
  const [origin, setOrigin] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<"present" | "absent">("present");
  const [absentPhone, setAbsentPhone] = useState("");
  const [absentError, setAbsentError] = useState<string | null>(null);
  const [absentSent, setAbsentSent] = useState<string | null>(null);

  // כרטיס לקוח (עריכה + חותמות)
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [stampPending, setStampPending] = useState(false);
  const [rewardFlash, setRewardFlash] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const menuLink = useMemo(() => (origin ? menuUrl(origin) : ""), [origin]);
  const joinLink = origin ? `${origin}/` : "";
  const inviteLink = useMemo(
    () => (joinLink ? waLink(absentPhone.trim(), renderInvite(settings.inviteTemplate, settings, joinLink)) : "#"),
    [absentPhone, settings, joinLink],
  );

  const goal = settings.stampGoal ?? 10;

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
        c.note?.toLowerCase().includes(lower) ||
        c.tags?.some((t) => t.toLowerCase().includes(lower)) ||
        (digits && (c.phone.includes(digits) || pad(c.cardNumber).includes(digits))),
    );
  }, [customers, query]);

  const birthdaysThisMonth = useMemo(() => {
    const mm = String(new Date().getMonth() + 1).padStart(2, "0");
    return customers
      .filter((c) => c.birthday?.slice(3, 5) === mm)
      .sort((a, b) => (a.birthday ?? "").localeCompare(b.birthday ?? ""));
  }, [customers]);

  function updateCustomers(customer: Customer) {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? customer : c)));
  }

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

  function openCard(customer: Customer) {
    setEditing(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditBirthday(customer.birthday ?? "");
    setEditTags(customer.tags ?? []);
    setEditNote(customer.note ?? "");
    setEditError(null);
    setRewardFlash((customer.points ?? 0) >= goal);
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
      body: JSON.stringify({
        ...parsed.data,
        birthday: editBirthday.trim(),
        tags: editTags,
        note: editNote.trim(),
      }),
    }).catch(() => null);
    setEditPending(false);

    if (res?.ok) {
      const { customer } = (await res.json()) as { customer: Customer };
      updateCustomers(customer);
      setEditing(null);
    } else {
      const data = res ? await res.json().catch(() => null) : null;
      setEditError(data?.error ?? "השמירה נכשלה — נסו שוב");
    }
  }

  async function stamp() {
    if (!editing || stampPending) return;
    setStampPending(true);
    const res = await fetch(`/api/customers/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stamp" }),
    }).catch(() => null);
    setStampPending(false);
    if (res?.ok) {
      const { customer, rewardReady } = (await res.json()) as { customer: Customer; rewardReady: boolean };
      updateCustomers(customer);
      setEditing(customer);
      setRewardFlash(rewardReady);
    }
  }

  async function redeem() {
    if (!editing) return;
    const res = await fetch(`/api/customers/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redeem" }),
    }).catch(() => null);
    if (res?.ok) {
      const { customer } = (await res.json()) as { customer: Customer };
      updateCustomers(customer);
      setEditing(customer);
      setRewardFlash(false);
    }
  }

  function sendAbsentInvite(e: React.MouseEvent) {
    if (!/^\d{9,10}$/.test(absentPhone.replace(/\D/g, ""))) {
      e.preventDefault();
      setAbsentError("מספר הטלפון לא נראה תקין. לדוגמה: 050-1234567");
      return;
    }
    setAbsentError(null);
    setAbsentSent("הקישור נפתח בוואטסאפ — אחרי השליחה הלקוח יצטרף בעצמו עם אישורו");
  }

  const actionBtn = "rounded-lg p-1.5 transition";
  const points = editing?.points ?? 0;
  const progressPct = Math.min(100, Math.round((points / goal) * 100));

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[400px_1fr]">
      {/* הוספת לקוח — עם אישור הסכמה */}
      <div className="space-y-6">
        <section className="h-fit min-w-0 rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-crust-900">הוספת לקוח למועדון</h2>

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-cream-100 p-1.5">
            <button
              type="button"
              onClick={() => setAddMode("present")}
              className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                addMode === "present" ? "bg-white text-crust-900 shadow-sm" : "text-crust-700/60 hover:text-crust-900"
              }`}
            >
              🙋 הלקוח לפניי
            </button>
            <button
              type="button"
              onClick={() => setAddMode("absent")}
              className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                addMode === "absent" ? "bg-white text-crust-900 shadow-sm" : "text-crust-700/60 hover:text-crust-900"
              }`}
            >
              📲 הלקוח לא נמצא
            </button>
          </div>

          {addMode === "present" ? (
            <>
              <p className="mb-5 mt-4 text-sm leading-relaxed text-crust-700/60">
                הלקוח נמצא במקום: ממלאים את פרטיו, מאשרים את הסכמתו בעל פה — ושולחים את הודעת התודה וההנחה
                בוואטסאפ בלחיצה אחת
              </p>
              {result ? (
                <div className="rounded-2xl bg-crust-900 p-5">
                  <SuccessView result={result} settings={settings} mode="staff" onReset={() => setResult(null)} />
                </div>
              ) : (
                <JoinForm dark={false} adminMode onDone={handleDone} submitLabel="הוספה למועדון 🍕" />
              )}
            </>
          ) : (
            <div className="mt-4">
              <p className="mb-4 text-sm leading-relaxed text-crust-700/60">
                הלקוח לא נמצא כאן? לא מוסיפים אותו ישירות — שולחים לו קישור הצטרפות בוואטסאפ, והוא ימלא את
                שמו ו<strong>יאשר את הצטרפותו בעצמו</strong>. הלקוח יתווסף לרשימה אוטומטית לאחר האישור.
              </p>

              <label htmlFor="absent-phone" className="mb-1.5 block text-sm font-semibold text-crust-700">
                טלפון הלקוח
              </label>
              <input
                id="absent-phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                value={absentPhone}
                onChange={(e) => {
                  setAbsentPhone(e.target.value);
                  setAbsentSent(null);
                }}
                placeholder="050-1234567"
                className="field-light mb-2 text-right text-lg"
              />
              {absentError && <p className="mb-3 text-sm font-semibold text-tomato-600">{absentError}</p>}

              <WhatsAppButton
                className="w-full justify-center"
                href={inviteLink}
                onClick={sendAbsentInvite}
                label="שליחת קישור הצטרפות"
                sub="הלקוח יאשר את הצטרפותו בעצמו"
              />

              {absentSent && (
                <p className="mt-4 rounded-xl bg-basil-500/10 px-4 py-3 text-sm font-semibold text-basil-600">
                  ✓ {absentSent}
                </p>
              )}
            </div>
          )}
        </section>

        {/* ימי הולדת החודש */}
        <section className="h-fit rounded-2xl border border-crust-700/10 bg-white p-5 shadow-sm">
          <h3 className="text-base font-extrabold text-crust-900">🎂 ימי הולדת החודש</h3>
          <p className="mt-0.5 text-xs text-crust-700/50">שליחת מתנת יום הולדת בוואטסאפ — בלחיצה אחת</p>
          {birthdaysThisMonth.length === 0 ? (
            <p className="mt-4 text-sm text-crust-700/50">אין ימי הולדת החודש</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {birthdaysThisMonth.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-cream-100/60 px-3 py-2">
                  <span className="w-12 text-center font-mono text-xs font-bold text-crust-700">{c.birthday}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-crust-900">{c.name}</span>
                  <WhatsAppButton
                    size="sm"
                    href={waLink(c.phone, renderBirthday(settings.birthdayTemplate, c.name, settings))}
                    label={`ברכת יום הולדת ל${c.name}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* רשימת לקוחות */}
      <section className="min-w-0">
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
              placeholder="🔍 חיפוש לקוח — שם, טלפון, תגית או מספר חבר (עובד גם עם קורא ברקוד)"
              className="field-light"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-crust-700/50">
              {customers.length === 0 ? "עדיין אין חברים במועדון — הוסיפו את הראשון 🍕" : "לא נמצאו לקוחות שמתאימים לחיפוש"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm [&_td]:whitespace-nowrap">
                <thead>
                  <tr className="text-xs text-crust-700/50 [&>th]:px-4 [&>th]:py-3 [&>th]:text-start [&>th]:font-semibold">
                    <th>מס׳ חבר</th>
                    <th>שם</th>
                    <th>טלפון</th>
                    <th>נקודות</th>
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
                      <td className="px-4 py-3">
                        <div className="font-bold text-crust-900">
                          {c.name}
                          {c.tags?.length ? (
                            <span className="ms-1.5 inline-flex gap-1 align-middle">
                              {c.tags.map((t) => (
                                <span key={t} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${tagClass(t)}`}>
                                  {t}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </div>
                        {c.note ? <div className="max-w-52 truncate text-xs text-crust-700/60">{c.note}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-crust-700" dir="ltr">
                        {displayPhone(c.phone)}
                      </td>
                      <td className="px-4 py-3 text-crust-700">
                        {c.points ? (
                          <span className="font-bold" title={`${c.visits ?? 0} ביקורים`}>
                            🍕 {c.points}/{goal}
                          </span>
                        ) : (
                          <span className="text-crust-700/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-crust-700/70">{dateFmt.format(new Date(c.createdAt))}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <WhatsAppButton
                            size="sm"
                            href={waLink(c.phone, renderMessage(settings.messageTemplate, c.name, settings))}
                            label={`שליחת הודעה ל${c.name}`}
                          />
                          <a
                            href={menuLink ? waLink(c.phone, menuMessage(settings.businessName, menuLink, c.name)) : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`שליחת התפריט ל${c.name}`}
                            aria-label={`שליחת התפריט ל${c.name}`}
                            className={`${actionBtn} inline-flex text-crust-700/50 transition hover:bg-cheese-400/15 hover:text-cheese-500`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v7a2.5 2.5 0 01-5 0V3M4.5 10v11M20 3c-2 1-3 3.2-3 6v5h3v7M20 3v11" />
                            </svg>
                          </a>
                          <button
                            type="button"
                            onClick={() => openCard(c)}
                            title={`כרטיס ${c.name}`}
                            aria-label={`כרטיס ${c.name}`}
                            className={`${actionBtn} text-crust-700/50 hover:bg-cheese-400/15 hover:text-cheese-500`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                              <circle cx="12" cy="8" r="3.5" />
                              <path strokeLinecap="round" d="M5 19.5c.9-3.4 3.6-5 7-5s6.1 1.6 7 5" />
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

      {/* כרטיס לקוח — עריכה, חותמות ותגיות */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div className="anim-fade absolute inset-0 bg-black/50" onClick={() => setEditing(null)} aria-hidden="true" />
          <form onSubmit={saveEdit} className="anim-pop relative my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-crust-900">
              כרטיס לקוח · #{pad(editing.cardNumber)}
            </h3>
            <p className="mt-0.5 text-xs text-crust-700/50">
              {editing.visits ?? 0} ביקורים
              {editing.lastVisitAt ? ` · אחרון: ${dateFmt.format(new Date(editing.lastVisitAt))}` : ""}
              {editing.birthday ? ` · 🎂 ${editing.birthday}` : ""}
            </p>

            {/* כרטיס נקודות */}
            <div className="mt-4 rounded-xl bg-cream-100/70 p-4 ring-1 ring-crust-700/10">
              <div className="flex items-center justify-between text-sm font-bold text-crust-800">
                <span>
                  🍕 {points}/{goal} חותמות
                </span>
                <span className="truncate text-xs font-semibold text-crust-700/60">הפרס: {settings.stampReward}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-crust-700/10">
                <div className="h-full rounded-full bg-gradient-to-l from-cheese-400 to-cheese-500 transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={stamp}
                  disabled={stampPending}
                  className="rounded-xl bg-gradient-to-br from-basil-400 to-basil-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-basil-600/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                >
                  {stampPending ? "רושם…" : "✚ חותמה להזמנה"}
                </button>
                {rewardFlash && (
                  <button
                    type="button"
                    onClick={redeem}
                    className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-tomato-600/25 transition hover:brightness-110 active:scale-[0.99]"
                  >
                    🎁 מימוש הפרס (איפוס)
                  </button>
                )}
              </div>
              {rewardFlash && (
                <p className="mt-3 rounded-lg bg-cheese-400/15 px-3 py-2 text-sm font-bold text-cheese-500">
                  🎯 הלקוח השיג את הפרס! מסרו את {settings.stampReward} ולחצו "מימוש הפרס" לאיפוס הכרטיס
                </p>
              )}
            </div>

            {/* פרטים */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-name" className="mb-1.5 block text-sm font-semibold text-crust-700">
                  שם מלא
                </label>
                <input id="edit-name" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="field-light" />
              </div>
              <div>
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
              </div>
              <div>
                <label htmlFor="edit-birthday" className="mb-1.5 block text-sm font-semibold text-crust-700">
                  יום הולדת (DD/MM)
                </label>
                <input
                  id="edit-birthday"
                  type="text"
                  dir="ltr"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  placeholder="25/03"
                  className="field-light text-right"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-crust-700">תגיות</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {QUICK_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 transition ${
                        editTags.includes(t) ? "bg-crust-900 text-cream-50 ring-crust-900" : "bg-cream-100 text-crust-700 ring-crust-700/15 hover:bg-cream-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="edit-note" className="mb-1.5 block text-sm font-semibold text-crust-700">
                הערה לצוות (אלרגיות, העדפות…)
              </label>
              <textarea
                id="edit-note"
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="לדוגמה: אלרגי לבצל · מעדיף חריף"
                className="field-light resize-y"
              />
            </div>

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
                סגירה
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
