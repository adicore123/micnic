"use client";

import { useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { normalizePhone } from "@/lib/phone";
import { renderBirthday, renderInvite, renderMessage } from "@/lib/whatsapp";
import type { PublicSettings } from "@/lib/db/types";

const PLACEHOLDERS = [
  { token: "{name}", label: "שם הלקוח" },
  { token: "{business}", label: "שם העסק" },
  { token: "{discount}", label: "אחוז ההנחה" },
];

const INVITE_PLACEHOLDERS = [
  { token: "{business}", label: "שם העסק" },
  { token: "{discount}", label: "אחוז ההנחה" },
  { token: "{link}", label: "קישור ההצטרפות" },
];

const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;

export default function SettingsForm({ initial }: { initial: PublicSettings }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    businessName: initial.businessName,
    logo: initial.logo,
    discountPercent: String(initial.discountPercent),
    stampGoal: String(initial.stampGoal ?? 10),
    stampReward: initial.stampReward ?? "",
    messageTemplate: initial.messageTemplate,
    inviteTemplate: initial.inviteTemplate,
    birthdayTemplate: initial.birthdayTemplate,
    businessPhone: initial.businessPhone ? initial.businessPhone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") : "",
    password: "",
    passwordConfirm: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      renderMessage(form.messageTemplate, "דניאל", {
        businessName: form.businessName.trim() || "העסק",
        discountPercent: Number(form.discountPercent) || 0,
      }),
    [form.messageTemplate, form.businessName, form.discountPercent],
  );

  const birthdayPreview = useMemo(
    () =>
      renderBirthday(form.birthdayTemplate, "דניאל", {
        businessName: form.businessName.trim() || "העסק",
        stampReward: form.stampReward.trim() || "הפרס",
      }),
    [form.birthdayTemplate, form.businessName, form.stampReward],
  );

  const invitePreview = useMemo(
    () =>
      renderInvite(form.inviteTemplate, {
        businessName: form.businessName.trim() || "העסק",
        discountPercent: Number(form.discountPercent) || 0,
      }, typeof window !== "undefined" ? `${window.location.origin}/` : "https://…/"),
    [form.inviteTemplate, form.businessName, form.discountPercent],
  );

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("אפשר להעלות רק תמונה (PNG או JPG)");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("התמונה גדולה מדי — עד 1.5 מגה");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }).catch(() => null);
    if (!dataUrl) {
      setError("קריאת הקובץ נכשלה — נסו קובץ אחר");
      return;
    }
    setError(null);
    set("logo", dataUrl);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const discount = Number(form.discountPercent);
    if (!Number.isInteger(discount) || discount < 1 || discount > 100) {
      setError("אחוז ההנחה חייב להיות מספר שלם בין 1 ל-100");
      return;
    }
    if (form.businessPhone && !normalizePhone(form.businessPhone)) {
      setError("מספר הטלפון של העסק לא נראה תקין. לדוגמה: 050-1234567");
      return;
    }
    if (form.password && form.password.length < 4) {
      setError("הסיסמה החדשה קצרה מדי — לפחות 4 תווים");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("הסיסמאות לא תואמות");
      return;
    }
    const stampGoalNum = Number(form.stampGoal);
    if (!Number.isInteger(stampGoalNum) || stampGoalNum < 1 || stampGoalNum > 100) {
      setError("יעד החותמות חייב להיות מספר שלם בין 1 ל-100");
      return;
    }
    if (form.stampReward.trim().length < 2) {
      setError("תיאור הפרס קצר מדי");
      return;
    }
    if (form.birthdayTemplate.trim().length < 10) {
      setError("הודעת יום ההולדת קצרה מדי");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: form.businessName,
        logo: form.logo,
        discountPercent: discount,
        stampGoal: stampGoalNum,
        stampReward: form.stampReward.trim(),
        messageTemplate: form.messageTemplate,
        inviteTemplate: form.inviteTemplate,
        birthdayTemplate: form.birthdayTemplate,
        businessPhone: form.businessPhone ? normalizePhone(form.businessPhone)! : "",
        adminPassword: form.password,
      }),
    }).catch(() => null);
    setSaving(false);

    if (res?.ok) {
      setSaved(true);
      setForm((f) => ({ ...f, password: "", passwordConfirm: "" }));
      router.refresh();
    } else {
      const data = res ? await res.json().catch(() => null) : null;
      setError(data?.error ?? "השמירה נכשלה — נסו שוב");
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* לוגו ושם העסק */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">הלוגו והשם</h2>
        <p className="mb-5 mt-1 text-sm text-crust-700/60">הלוגו והשם יופיעו על כרטיסי החבר, בקוד ה-QR ובעמוד ההצטרפות</p>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex h-32 w-32 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed text-center transition ${
              dragOver ? "border-cheese-500 bg-cheese-400/10" : "border-crust-700/20 hover:border-cheese-500/60 hover:bg-cream-100/50"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.logo} alt="הלוגו של העסק" className="h-16 w-16 rounded-full object-cover ring-1 ring-crust-700/15" />
            <span className="text-xs font-semibold text-crust-700/60">לחיצה או גרירה של תמונה</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>

          <div className="w-full space-y-4">
            <div>
              <label htmlFor="set-name" className="mb-1.5 block text-sm font-semibold text-crust-700">
                שם העסק
              </label>
              <input id="set-name" type="text" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} className="field-light" />
            </div>
            <div>
              <label htmlFor="set-bizphone" className="mb-1.5 block text-sm font-semibold text-crust-700">
                טלפון העסק (לא חובה)
              </label>
              <input
                id="set-bizphone"
                type="tel"
                dir="ltr"
                value={form.businessPhone}
                onChange={(e) => set("businessPhone", e.target.value)}
                placeholder="050-1234567"
                className="field-light text-right"
              />
              <p className="mt-1.5 text-xs text-crust-700/50">אם יוזן — לקוחות שנרשמים לבד דרך ה-QR יוכלו לפתוח איתכם צ'אט וואטסאף</p>
            </div>
            {form.logo !== "/logo.svg" && (
              <button type="button" onClick={() => set("logo", "/logo.svg")} className="text-sm font-semibold text-cheese-500 underline-offset-4 hover:underline">
                ↩ החזרת הלוגו המקורי
              </button>
            )}
          </div>
        </div>
      </section>

      {/* הנחה */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">הנחת חבר מועדון</h2>
        <p className="mb-5 mt-1 text-sm text-crust-700/60">האחוז שכל חבר מועדון מקבל — יופיע בהודעה, בכרטיס ובפוסטר</p>

        <div className="flex items-center gap-4">
          <input
            type="number"
            min={1}
            max={100}
            value={form.discountPercent}
            onChange={(e) => set("discountPercent", e.target.value)}
            className="field-light w-32 text-center text-2xl font-extrabold"
          />
          <span className="text-3xl font-extrabold text-cheese-500">%</span>
          <span className="rounded-full bg-cheese-400/15 px-4 py-1.5 text-sm font-bold text-cheese-500">
            כל חבר חוסך {Number(form.discountPercent) || 0}₪ על כל 100₪
          </span>
        </div>
      </section>

      {/* הודעת וואטסאפ */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">הודעת התודה בוואטסאפ</h2>
        <p className="mb-4 mt-1 text-sm text-crust-700/60">זו ההודעה שנשלחת לכל לקוח שמצטרף למועדון</p>

        <div className="mb-3 flex flex-wrap gap-2">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p.token}
              type="button"
              onClick={() => set("messageTemplate", form.messageTemplate + p.token)}
              className="rounded-full bg-cream-100 px-3.5 py-1.5 text-xs font-bold text-crust-700 ring-1 ring-crust-700/10 transition hover:bg-cheese-400/20 hover:ring-cheese-500/40"
            >
              {p.label} · <span dir="ltr">{p.token}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <textarea
            value={form.messageTemplate}
            onChange={(e) => set("messageTemplate", e.target.value)}
            rows={10}
            className="field-light resize-y leading-relaxed"
          />

          {/* תצוגה חיה בסגנון וואטסאפ */}
          <div className="overflow-hidden rounded-2xl border border-crust-700/10 shadow-md">
            <div className="flex items-center gap-3 bg-[#1F2C33] px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.logo} alt="" className="h-8 w-8 rounded-full object-cover" />
              <div>
                <div className="text-sm font-bold text-white">{form.businessName.trim() || "העסק"}</div>
                <div className="text-[10px] text-white/50">כך תיראה ההודעה אצל הלקוח (שם לדוגמה: דניאל)</div>
              </div>
            </div>
            <div className="min-h-56 bg-[#0B141A] p-4">
              <div className="wa-bubble-dark ml-6 w-fit max-w-full px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line">
                {preview}
                <span className="mt-1 block text-left text-[10px] text-white/50">✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* הודעת הזמנה למועדון */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">הודעת הזמנה למועדון</h2>
        <p className="mb-4 mt-1 text-sm text-crust-700/60">
          נשלחת ללקוחות פוטנציאליים עם קישור ההצטרפות — דרך עמוד "שיתוף ופוסטר"
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          {INVITE_PLACEHOLDERS.map((p) => (
            <button
              key={p.token}
              type="button"
              onClick={() => set("inviteTemplate", form.inviteTemplate + p.token)}
              className="rounded-full bg-cream-100 px-3.5 py-1.5 text-xs font-bold text-crust-700 ring-1 ring-crust-700/10 transition hover:bg-cheese-400/20 hover:ring-cheese-500/40"
            >
              {p.label} · <span dir="ltr">{p.token}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <textarea
            value={form.inviteTemplate}
            onChange={(e) => set("inviteTemplate", e.target.value)}
            rows={6}
            className="field-light resize-y leading-relaxed"
          />

          <div className="overflow-hidden rounded-2xl border border-crust-700/10 shadow-md">
            <div className="bg-[#1F2C33] px-4 py-3">
              <div className="text-xs font-bold text-white/80">תצוגה חיה — כך תיראה ההזמנה שהלקוח מקבל</div>
            </div>
            <div className="min-h-40 bg-[#0B141A] p-4">
              <div className="wa-bubble-dark ml-6 w-fit max-w-full px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line">
                {invitePreview}
                <span className="mt-1 block text-left text-[10px] text-white/50">✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* כרטיס נקודות וימי הולדת */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">כרטיס הנקודות והימי הולדת</h2>
        <p className="mb-5 mt-1 text-sm text-crust-700/60">
          כל הזמנה = חותמה אצל הלקוח. בהגעה ליעד — הלקוח מקבל את הפרס והכרטיס מתאפס. בנוסף — מתנת יום הולדת לכל חבר
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="set-goal" className="mb-1.5 block text-sm font-semibold text-crust-700">
              יעד חותמות לפרס
            </label>
            <input
              id="set-goal"
              type="number"
              min={1}
              max={100}
              value={form.stampGoal}
              onChange={(e) => set("stampGoal", e.target.value)}
              className="field-light w-28 text-center text-xl font-extrabold"
            />
          </div>
          <div className="min-w-56 flex-1">
            <label htmlFor="set-reward" className="mb-1.5 block text-sm font-semibold text-crust-700">
              הפרס (מה מקבל הלקוח?)
            </label>
            <input
              id="set-reward"
              type="text"
              value={form.stampReward}
              onChange={(e) => set("stampReward", e.target.value)}
              placeholder="פיצה משפחתית חינם 🍕"
              className="field-light"
            />
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="set-birthday" className="mb-1.5 block text-sm font-semibold text-crust-700">
            הודעת יום הולדת · מציינים: <span dir="ltr">{`{name}`}</span>, <span dir="ltr">{`{business}`}</span>, <span dir="ltr">{`{reward}`}</span>
          </label>
          <textarea
            id="set-birthday"
            value={form.birthdayTemplate}
            onChange={(e) => set("birthdayTemplate", e.target.value)}
            rows={5}
            className="field-light resize-y leading-relaxed"
          />
          <div className="mt-3 overflow-hidden rounded-2xl border border-crust-700/10 shadow-md">
            <div className="bg-[#1F2C33] px-4 py-2.5 text-xs font-bold text-white/80">תצוגה חיה — כך תיראה הברכה (שם לדוגמה: דניאל)</div>
            <div className="bg-[#0B141A] p-4">
              <div className="wa-bubble-dark ml-6 w-fit max-w-full px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line">
                {birthdayPreview}
                <span className="mt-1 block text-left text-[10px] text-white/50">✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* סיסמה */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">החלפת סיסמה</h2>
        <p className="mb-4 mt-1 text-sm text-crust-700/60">אם לא מעוניינים להחליף — פשוט השאירו ריק</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="סיסמה חדשה"
            autoComplete="new-password"
            className="field-light"
          />
          <input
            type="password"
            value={form.passwordConfirm}
            onChange={(e) => set("passwordConfirm", e.target.value)}
            placeholder="אישור סיסמה"
            autoComplete="new-password"
            className="field-light"
          />
        </div>
      </section>

      {/* שמירה */}
      <div className="sticky bottom-4 flex items-center gap-4 rounded-2xl border border-crust-700/10 bg-white/90 p-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-br from-basil-400 to-basil-600 px-8 py-3.5 font-extrabold text-white shadow-lg shadow-basil-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "שומר…" : "שמירת הגדרות"}
        </button>
        {saved && <span className="font-bold text-basil-600">נשמר בהצלחה ✓</span>}
        {error && <span className="font-semibold text-tomato-600">{error}</span>}
      </div>
    </form>
  );
}
