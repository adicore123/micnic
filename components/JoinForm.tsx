"use client";

import { useState, type FormEvent } from "react";
import { joinWithConsentSchema, PHONE_HINT } from "@/lib/phone";
import type { Customer } from "@/lib/db/types";

export type JoinResult = {
  customer: Customer;
  existing: boolean;
  message: string;
  waLink: string;
};

type Props = {
  onDone: (result: JoinResult) => void;
  dark?: boolean;
  submitLabel?: string;
  /** adminMode = הצוות מעיד על אישור הלקוח בעל פה; אחרת הלקוח מאשר בעצמו */
  adminMode?: boolean;
  consentText?: string;
};

/** טופס הצטרפות עם שם, טלפון ואישור הצטרפות מפורש */
export default function JoinForm({
  onDone,
  dark = true,
  submitLabel = "הצטרפות למועדון 🍕",
  adminMode = false,
  consentText,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; consent?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const defaultConsent = adminMode
    ? "הלקוח אישר בעל פה את הצטרפותו למועדון ואת קבלת ההטבות בוואטסאפ"
    : `אני מאשר/ת להצטרף למועדון הלקוחות ולקבל הטבות ועדכונים בוואטסאפ`;
  const consentLabel = consentText ?? defaultConsent;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = joinWithConsentSchema.safeParse({ name, phone, consent });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "name" | "phone" | "consent";
        next[key] ??= issue.message;
      }
      setErrors(next);
      setShakeKey((k) => k + 1);
      return;
    }

    setErrors({});
    setServerError(null);
    setPending(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "משהו השתבש, נסו שוב");
        setShakeKey((k) => k + 1);
        return;
      }
      onDone(data as JoinResult);
    } catch {
      setServerError("בעיית חיבור — בדקו את האינטרנט ונסו שוב");
      setShakeKey((k) => k + 1);
    } finally {
      setPending(false);
    }
  }

  const fieldClass = dark ? "field" : "field-light";
  const labelClass = dark ? "text-sm font-semibold text-cream-200" : "text-sm font-semibold text-crust-700";
  const checkboxClass = dark
    ? "h-5 w-5 shrink-0 accent-[#F2B441]"
    : "h-5 w-5 shrink-0 accent-basil-600";

  return (
    <form key={shakeKey} onSubmit={submit} noValidate className={`w-full space-y-4 ${shakeKey ? "anim-shake" : ""}`}>
      <div>
        <label htmlFor="join-name" className={`mb-1.5 block ${labelClass}`}>
          שם מלא
        </label>
        <input
          id="join-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: דניאל כהן"
          className={fieldClass}
        />
        {errors.name && <p className="mt-1.5 text-sm text-tomato-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="join-phone" className={`mb-1.5 block ${labelClass}`}>
          טלפון נייד
        </label>
        <input
          id="join-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-1234567"
          className={`${fieldClass} text-right`}
        />
        {errors.phone && <p className="mt-1.5 text-sm text-tomato-400">{errors.phone}</p>}
      </div>

      {/* אישור הצטרפות מפורש — חובה */}
      <div>
        <label className={`flex cursor-pointer items-start gap-3 ${dark ? "text-cream-200" : "text-crust-700"}`}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className={`${checkboxClass} mt-0.5`}
          />
          <span className="text-sm leading-relaxed">{consentLabel}</span>
        </label>
        {errors.consent && (
          <p className={`mt-1.5 text-sm ${dark ? "text-tomato-400" : "text-tomato-600"}`}>{errors.consent}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-xl bg-tomato-500/15 px-4 py-3 text-center text-sm font-semibold text-tomato-400">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "רק שנייה…" : submitLabel}
      </button>

      <p className={`text-center text-xs ${dark ? "text-cream-200/40" : "text-crust-700/40"}`}>
        הפרטים נשמרים אצל העסק בלבד · {PHONE_HINT}
      </p>
    </form>
  );
}
