"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type QRCodeStyling from "qr-code-styling";
import StyledQr from "./StyledQr";
import { normalizePhone } from "@/lib/phone";
import { renderInvite, renderMessage } from "@/lib/whatsapp";
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

export default function SettingsForm({ initial, kitchenPin = "" }: { initial: PublicSettings; kitchenPin?: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    businessName: initial.businessName,
    logo: initial.logo,
    discountPercent: String(initial.discountPercent),
    messageTemplate: initial.messageTemplate,
    inviteTemplate: initial.inviteTemplate,
    businessPhone: initial.businessPhone ? initial.businessPhone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") : "",
    kitchenPin,
    password: "",
    passwordConfirm: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [kitchenQr, setKitchenQr] = useState<QRCodeStyling | null>(null);
  const [kitchenCopied, setKitchenCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);
  const kitchenLink = origin ? `${origin}/kitchen` : "";

  const preview = useMemo(
    () =>
      renderMessage(form.messageTemplate, "דניאל", {
        businessName: form.businessName.trim() || "העסק",
        discountPercent: Number(form.discountPercent) || 0,
      }),
    [form.messageTemplate, form.businessName, form.discountPercent],
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
    if (form.kitchenPin.trim() && !/^\d{4,6}$/.test(form.kitchenPin.trim())) {
      setError("קוד המטבח חייב להיות 4-6 ספרות");
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
        messageTemplate: form.messageTemplate,
        inviteTemplate: form.inviteTemplate,
        businessPhone: form.businessPhone ? normalizePhone(form.businessPhone)! : "",
        kitchenPin: form.kitchenPin.trim(),
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

      {/* מטבח הטבחים — קוד וקישור */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">מטבח הטבחים 👨‍🍳</h2>
        <p className="mb-5 mt-1 text-sm leading-relaxed text-crust-700/60">
          קישור מיוחד לצוות המטבח: הטבחים נכנסים עם קוד קצר (פעם אחת — החיבור נשמר 30 יום) ורואים את הוראות
          ההכנה <strong>בצפייה בלבד</strong>, בלי שום אפשרות עריכה. החלפת הקוד מנתקת את כולם מיד.
        </p>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor="set-kitchen-pin" className="mb-1.5 block text-sm font-semibold text-crust-700">
              קוד מטבח (4-6 ספרות)
            </label>
            <input
              id="set-kitchen-pin"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              value={form.kitchenPin}
              onChange={(e) => set("kitchenPin", e.target.value)}
              placeholder="לדוגמה: 4821"
              className="field-light text-right text-2xl tracking-[0.4em]"
            />
            <p className="mt-1.5 text-xs text-crust-700/50">ריק = הקישור לטבחים מושבת</p>

            {kitchenLink && (
              <div className="mt-4 rounded-xl bg-cream-100/70 p-4 ring-1 ring-crust-700/10">
                <p className="text-sm font-bold text-crust-800">הקישור לשליחה לטבחים:</p>
                <p dir="ltr" className="mt-1 truncate text-left text-xs text-crust-700/60">
                  {kitchenLink}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(kitchenLink).catch(() => null);
                      setKitchenCopied(true);
                      setTimeout(() => setKitchenCopied(false), 2500);
                    }}
                    className="rounded-xl border border-crust-700/15 bg-white px-4 py-2 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-50"
                  >
                    {kitchenCopied ? "הועתק ✓" : "🔗 העתקת הקישור"}
                  </button>
                  <a
                    href="/kitchen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-crust-700/15 bg-white px-4 py-2 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-50"
                  >
                    👁️ תצוגה מהקישור
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="justify-self-center text-center">
            <div className="w-fit rounded-2xl bg-cream-50 p-4 shadow-inner ring-1 ring-crust-700/10">
              {kitchenLink ? (
                <StyledQr data={kitchenLink} logo={form.logo} size={850} displaySize="min(190px, 60vw)" onReady={setKitchenQr} />
              ) : (
                <div className="h-[190px] w-[190px] animate-pulse rounded-xl bg-cream-200" />
              )}
            </div>
            <button
              type="button"
              onClick={() => kitchenQr?.download({ name: "micnic-kitchen-qr", extension: "png" })}
              disabled={!kitchenQr}
              className="mt-3 rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-tomato-600/25 transition hover:brightness-110 disabled:opacity-50"
            >
              ⬇️ הורדת QR למטבח
            </button>
            <p className="mt-2 max-w-48 text-xs leading-relaxed text-crust-700/50">
              מדפיסים, מדביקים במטבח — הטבחים סורקים ומקישים את הקוד פעם אחת
            </p>
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
