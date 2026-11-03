"use client";

import MembershipCard from "./MembershipCard";
import WhatsAppButton from "./WhatsAppButton";
import { selfJoinMessage, waLink } from "@/lib/whatsapp";
import type { PublicSettings } from "@/lib/db/types";
import type { JoinResult } from "./JoinForm";

type Props = {
  result: JoinResult;
  settings: PublicSettings;
  /** staff = הצוות שולח ללקוח, self = הלקוח נרשם מהטלפון שלו */
  mode: "staff" | "self";
  onReset?: () => void;
  resetLabel?: string;
};

export default function SuccessView({ result, settings, mode, onReset, resetLabel }: Props) {
  const { customer, existing, message } = result;
  const accent = existing ? "#F2B441" : "#4E9F6D";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="anim-pop relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: existing ? "rgb(242 180 65 / 0.4)" : "rgb(78 159 109 / 0.4)" }}
        />
        <svg viewBox="0 0 52 52" className="relative h-16 w-16">
          <circle cx="26" cy="26" r="23" fill="none" stroke={accent} strokeWidth="3.5" />
          <path
            d="M15.5 27l7.5 7.5L37 18"
            fill="none"
            stroke={accent}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-draw"
          />
        </svg>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-cream-50">
          {existing ? "כבר חברים במועדון 😊" : `ברוך הבא, ${customer.name}!`}
        </h2>
        <p className="mt-1 text-cream-200/70">
          {existing
            ? "הכרטיס כבר קיים — אפשר לשלוח שוב את ההודעה עם ההנחה"
            : `הצטרפת בהצלחה למועדון הלקוחות של ${settings.businessName}`}
        </p>
      </div>

      <div className="w-full max-w-sm">
        {mode === "staff" && <p className="mb-2 text-xs text-cream-200/50">זו ההודעה שתישלח ללקוח בוואטסאפ:</p>}
        <div className="wa-bubble mx-auto w-fit max-w-full px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line shadow-lg">
          {message}
        </div>
      </div>

      <MembershipCard customer={customer} settings={settings} />

      <div className="flex flex-col items-center gap-3">
        {mode === "staff" ? (
          <WhatsAppButton href={result.waLink} label="שליחת ההודעה בוואטסאפ" sub="נפתח צ'אט מוכן — רק ללחוץ שלח" />
        ) : settings.businessPhone ? (
          <WhatsAppButton
            href={waLink(settings.businessPhone, selfJoinMessage(settings.businessName))}
            label="המשך בוואטסאפ שלנו"
            sub="נשמח להכיר 🍕"
          />
        ) : null}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-cream-200/70 underline-offset-4 transition hover:text-cheese-300 hover:underline"
          >
            {resetLabel ?? "➕ הוספת לקוח נוסף"}
          </button>
        )}
      </div>
    </div>
  );
}
