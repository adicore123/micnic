"use client";

import { useEffect, useMemo, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import StyledQr from "./StyledQr";
import MonoPoster from "./MonoPoster";
import PosterA4 from "./PosterA4";
import WhatsAppButton from "./WhatsAppButton";
import { normalizePhone, PHONE_HINT } from "@/lib/phone";
import { renderInvite, waLink } from "@/lib/whatsapp";
import type { PublicSettings } from "@/lib/db/types";

/** מרכז גיוס הלקוחות: הזמנה בוואטסאפ, קישור הצטרפות ופוסטר QR לדלפק (צבע + שחור-לבן) */
export default function ShareView({ settings }: { settings: PublicSettings }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [qr, setQr] = useState<QRCodeStyling | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"invite" | "link" | null>(null);
  const [monoOpen, setMonoOpen] = useState(false);

  // בהדפסה מהעמוד הזה מודפס רק הפוסטר (אלא אם פתוח הפוסטר השחור-לבן, שמנהל לבד)
  useEffect(() => {
    if (monoOpen) return;
    document.body.classList.add("print-poster-only");
    return () => document.body.classList.remove("print-poster-only");
  }, [monoOpen]);

  useEffect(() => setOrigin(window.location.origin), []);

  const link = origin ? `${origin}/` : "";
  const invite = useMemo(() => (link ? renderInvite(settings.inviteTemplate, settings, link) : ""), [settings, link]);
  const normalized = normalizePhone(phone);

  function guardInvite(e: React.MouseEvent) {
    if (!normalized) {
      e.preventDefault();
      setPhoneError(`מספר הטלפון לא נראה תקין. ${PHONE_HINT}`);
    } else {
      setPhoneError(null);
    }
  }

  async function copy(text: string, kind: "invite" | "link") {
    await navigator.clipboard.writeText(text).catch(() => null);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      {/* הזמנה בוואטסאפ */}
      <section className="no-print rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">הזמנת לקוחות בוואטסאפ</h2>
        <p className="mb-5 mt-1 text-sm leading-relaxed text-crust-700/60">
          מזינים מספר טלפון של לקוח → לוחצים על הכפתור הירוק → נפתח צ'אט עם הודעת הזמנה שכוללת את קישור ההצטרפות
          וההטבות. הלקוח נרשם מהטלפון שלו תוך 10 שניות.
        </p>

        <label htmlFor="invite-phone" className="mb-1.5 block text-sm font-semibold text-crust-700">
          טלפון הלקוח
        </label>
        <input
          id="invite-phone"
          type="tel"
          dir="ltr"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-1234567"
          className="field-light mb-2 text-right text-lg"
        />
        {phoneError && <p className="mb-3 text-sm font-semibold text-tomato-600">{phoneError}</p>}

        <WhatsAppButton
          className="w-full justify-center"
          href={normalized ? waLink(normalized, invite) : "#"}
          onClick={guardInvite}
          label="שליחת קישור ההצטרפות"
          sub="ההודעה מולאה מראש — רק ללחוץ שלח"
        />

        <div className="mt-5">
          <p className="mb-2 text-xs text-crust-700/50">כך תיראה ההודעה אצל הלקוח:</p>
          <div className="wa-bubble mx-auto w-fit max-w-full px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow">
            {invite || "…"}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-crust-700/10 pt-4">
          <button
            type="button"
            onClick={() => copy(invite, "invite")}
            disabled={!invite}
            className="rounded-xl border border-crust-700/15 bg-white px-4 py-2.5 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99] disabled:opacity-50"
          >
            {copied === "invite" ? "ההודעה הועתקה ✓" : "📋 העתקת ההודעה כולה"}
          </button>
          <button
            type="button"
            onClick={() => link && copy(link, "link")}
            disabled={!link}
            className="rounded-xl border border-crust-700/15 bg-white px-4 py-2.5 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99] disabled:opacity-50"
          >
            {copied === "link" ? "הקישור הועתק ✓" : "🔗 העתקת הקישור בלבד"}
          </button>
        </div>
        {link && (
          <p dir="ltr" className="mt-2 truncate text-left text-xs text-crust-700/40">
            {link}
          </p>
        )}
      </section>

      {/* פוסטר QR לדלפק */}
      <section>
        <div className={`force-colors ${monoOpen ? "" : "print-target"}`}>
          {/* תצוגה מקדימה במסך בלבד */}
          <div className="print:hidden relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-crust-800 to-crust-950 p-8 text-center shadow-2xl sm:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-tomato-500/25 blur-[100px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-cheese-400/15 blur-[100px]" />

          {/* הלוגו במרכז הבמה */}
          <div className="relative mx-auto w-fit">
            <div aria-hidden="true" className="absolute inset-0 -m-3 rounded-full bg-cheese-400/25 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logo}
              alt=""
              className="anim-float relative h-28 w-28 rounded-full object-cover shadow-2xl ring-4 ring-cheese-400/60 sm:h-32 sm:w-32"
            />
          </div>
          <h3 className="relative mt-6 text-3xl font-extrabold leading-tight text-cheese-300 sm:text-4xl">
            {settings.businessName}
          </h3>
          <p className="relative mt-1.5 text-xl font-extrabold text-cream-50 sm:text-2xl">מועדון הלקוחות</p>

          <div className="relative mx-auto mt-7 w-fit rounded-[1.75rem] bg-cream-50 p-5 shadow-inner sm:p-6">
            {link ? (
              <StyledQr data={link} logo={settings.logo} size={850} displaySize={270} onReady={setQr} />
            ) : (
              <div className="h-[270px] w-[270px] animate-pulse rounded-2xl bg-cream-200" />
            )}
          </div>

          <p className="relative mt-5 text-base font-bold text-cream-200/80 sm:text-lg">סרקו, הצטרפו וקבלו 🎁</p>
          <div className="relative mx-auto mt-3 w-fit rounded-full bg-cheese-400/15 px-7 py-2.5 text-lg font-extrabold text-cheese-300 ring-1 ring-cheese-400/40">
            {settings.discountPercent}% הנחה לחברי המועדון
          </div>
          <p className="relative mt-4 text-sm text-cream-200/50">ההצטרפות לוקחת 10 שניות 📱</p>
          </div>

          {/* פריסת A4 מלאה — הדפסה בלבד */}
          <div className="hidden print:block">
            <PosterA4 settings={settings} link={link} />
          </div>
        </div>

        <div className="no-print mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => qr?.download({ name: "micnic-club-qr", extension: "png" })}
            disabled={!qr}
            className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-3 font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            ⬇️ הורדת הקוד להדפסה
          </button>
          <button
            type="button"
            onClick={() => setMonoOpen(true)}
            className="rounded-xl bg-gradient-to-br from-crust-800 to-crust-950 px-6 py-3 font-extrabold text-white shadow-lg shadow-crust-900/30 ring-1 ring-white/20 transition hover:brightness-125 active:scale-[0.99]"
          >
            🖨️ הדפסה שחור-לבן
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-crust-700/15 bg-white px-5 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99]"
          >
            הדפסה צבעונית
          </button>
        </div>
      </section>

      {/* פוסטר שחור-לבן למדפסות מונו */}
      {monoOpen && link && <MonoPoster settings={settings} link={link} onClose={() => setMonoOpen(false)} />}
    </div>
  );
}
