"use client";

import { useEffect, useMemo, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import StyledQr from "./StyledQr";
import MonoPoster from "./MonoPoster";
import PosterA4 from "./PosterA4";
import WhatsAppButton from "./WhatsAppButton";
import { normalizePhone, PHONE_HINT } from "@/lib/phone";
import { menuUrl, renderInvite, waLink } from "@/lib/whatsapp";
import type { PublicSettings } from "@/lib/db/types";

type PosterMode = "club" | "menu";

/** מרכז השיתוף — שני אזורים מופרדים לחלוטין: מועדון הלקוחות | התפריט הדיגיטלי */
export default function ShareView({ settings }: { settings: PublicSettings }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [clubQr, setClubQr] = useState<QRCodeStyling | null>(null);
  const [menuQr, setMenuQr] = useState<QRCodeStyling | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"invite" | "link" | null>(null);
  const [mono, setMono] = useState<PosterMode | null>(null);

  // בהדפסה מהעמוד הזה מודפס רק הפוסטר שנבחר
  useEffect(() => {
    if (mono) return;
    document.body.classList.add("print-poster-only");
    return () => document.body.classList.remove("print-poster-only");
  }, [mono]);

  useEffect(() => setOrigin(window.location.origin), []);

  const link = origin ? `${origin}/` : "";
  const menuLink = origin ? menuUrl(origin) : "";
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

  /** הדפסה צבעונית של פוסטר אחד ספציפי — מסמן אותו כיעד ההדפסה ופותח את הדיאלוג */
  function printColor(which: PosterMode) {
    document.querySelectorAll(".print-target").forEach((el) => el.classList.remove("print-target"));
    document.querySelector(`[data-poster="${which}"]`)?.classList.add("print-target");
    window.print();
  }

  const zoneHeader = (title: string, subtitle: string) => (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <h2 className="text-xl font-extrabold text-crust-900">{title}</h2>
      <span className="h-px flex-1 bg-crust-700/15" aria-hidden="true" />
      <span className="text-xs font-semibold text-crust-700/50">{subtitle}</span>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* ══════════ אזור 1: מועדון הלקוחות ══════════ */}
      {zoneHeader("מועדון הלקוחות", "הזמנות בוואטסאפ · פוסטר הצטרפות")}

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* הזמנה בוואטסאפ */}
        <section className="no-print rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-crust-900">הזמנת לקוחות בוואטסאפ</h3>
          <p className="mb-5 mt-1 text-sm leading-relaxed text-crust-700/60">
            מזינים מספר טלפון של לקוח → לוחצים על הכפתור הירוק → נפתח צ'אט עם הודעת הזמנה שכוללת את קישור
            ההצטרפות וההטבות. הלקוח נרשם מהטלפון שלו תוך 10 שניות.
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

        {/* פוסטר המועדון — QR יחיד להצטרפות */}
        <section data-poster="club">
          <div className={`force-colors ${mono ? "" : ""}`}>
            <div className="print:hidden relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-crust-800 to-crust-950 p-8 text-center shadow-2xl sm:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-tomato-500/25 blur-[100px]" />

              <div className="relative mx-auto w-fit">
                <div aria-hidden="true" className="absolute inset-0 -m-3 rounded-full bg-cheese-400/25 blur-2xl" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.logo}
                  alt=""
                  className="anim-float relative h-24 w-24 rounded-full object-cover shadow-2xl ring-4 ring-cheese-400/60 sm:h-28 sm:w-28"
                />
              </div>
              <h4 className="relative mt-5 text-2xl font-extrabold leading-snug text-cheese-300 sm:text-3xl">
                {settings.businessName}
              </h4>
              <p className="relative mt-1 text-xl font-extrabold text-cream-50 sm:text-2xl">מועדון הלקוחות</p>

              <div className="relative mx-auto mt-7 w-fit rounded-[1.75rem] bg-cream-50 p-5 shadow-inner sm:p-6">
                {link ? (
                  <StyledQr data={link} logo={settings.logo} size={850} displaySize={270} onReady={setClubQr} />
                ) : (
                  <div className="h-[270px] w-[270px] animate-pulse rounded-2xl bg-cream-200" />
                )}
              </div>

              <p className="relative mt-5 text-base font-bold text-cream-200/80 sm:text-lg">סרקו והצטרפו עכשיו 🎁</p>
              <div className="relative mx-auto mt-3 w-fit rounded-full bg-cheese-400/15 px-6 py-2.5 text-base font-extrabold text-cheese-300 ring-1 ring-cheese-400/40 sm:text-lg">
                {settings.discountPercent}% הנחה לחברי המועדון
              </div>
              <p className="relative mt-4 text-sm text-cream-200/50">ההצטרפות לוקחת 10 שניות 📱</p>
            </div>

            {/* פריסת A4 מלאה — הדפסה בלבד */}
            <div className="hidden print:block">
              <PosterA4 settings={settings} mode="club" link={link} />
            </div>
          </div>

          <div className="no-print mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => clubQr?.download({ name: "micnic-club-qr", extension: "png" })}
              disabled={!clubQr}
              className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-3 font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              ⬇️ הורדת הקוד
            </button>
            <button
              type="button"
              onClick={() => setMono("club")}
              className="rounded-xl bg-gradient-to-br from-crust-800 to-crust-950 px-6 py-3 font-extrabold text-white shadow-lg shadow-crust-900/30 ring-1 ring-white/20 transition hover:brightness-125 active:scale-[0.99]"
            >
              🖨️ הדפסה שחור-לבן
            </button>
            <button
              type="button"
              onClick={() => printColor("club")}
              className="rounded-xl border border-crust-700/15 bg-white px-5 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99]"
            >
              הדפסה צבעונית
            </button>
          </div>
        </section>
      </div>

      {/* ══════════ אזור 2: התפריט הדיגיטלי ══════════ */}
      {zoneHeader("התפריט הדיגיטלי", "פוסטר QR לשולחנות ולדלפק")}

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* הדרכה קצרה */}
        <section className="no-print rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-crust-900">QR התפריט לשולחנות</h3>
          <p className="mb-4 mt-1 text-sm leading-relaxed text-crust-700/60">
            פוסטר נפרד לחלוטין מהמועדון — מסר אחד, מטרה אחת: הלקוח סורק ונכנס ישר לתפריט המלא מהטלפון שלו.
          </p>
          <ul className="space-y-2.5 text-sm text-crust-700/80">
            <li className="flex items-start gap-2.5">
              <span>🪑</span>
              <span><b>שולחנות</b> — הדפסה קטנה בתוך מסגרת והצמדה לכל שולחן</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span>🧾</span>
              <span><b>דלפק</b> — ליד הקופה להזמנות המאספים</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span>🪟</span>
              <span><b>חלון הראווה</b> — לעוברי אורח גם כשהעסק סגור</span>
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-crust-700/10 pt-4">
            <a
              href="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110"
            >
              👁️ צפייה בתפריט
            </a>
            <a
              href="/admin/menu"
              className="rounded-xl border border-crust-700/15 bg-white px-5 py-2.5 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-100"
            >
              ✏️ עריכת התפריט
            </a>
          </div>
        </section>

        {/* פוסטר התפריט — QR יחיד לתפריט */}
        <section data-poster="menu">
          <div className="force-colors">
            <div className="print:hidden relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-crust-800 to-crust-950 p-8 text-center shadow-2xl sm:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-basil-500/25 blur-[100px]" />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logo}
                alt=""
                className="anim-float relative mx-auto h-24 w-24 rounded-full object-cover shadow-2xl ring-4 ring-cheese-400/60 sm:h-28 sm:w-28"
              />
              <h4 className="relative mt-5 text-2xl font-extrabold leading-snug text-cheese-300 sm:text-3xl">
                {settings.businessName}
              </h4>
              <p className="relative mt-1 text-xl font-extrabold text-cream-50 sm:text-2xl">התפריט הדיגיטלי</p>

              <div className="relative mx-auto mt-7 w-fit rounded-[1.75rem] bg-cream-50 p-5 shadow-inner sm:p-6">
                {menuLink ? (
                  <StyledQr data={menuLink} logo={settings.logo} size={850} displaySize={270} onReady={setMenuQr} />
                ) : (
                  <div className="h-[270px] w-[270px] animate-pulse rounded-2xl bg-cream-200" />
                )}
              </div>

              <p className="relative mt-5 text-base font-bold text-cream-200/80 sm:text-lg">סרקו וצפו בתפריט 📱</p>
              <div className="relative mx-auto mt-3 w-fit rounded-full bg-cheese-400/15 px-6 py-2.5 text-base font-extrabold text-cheese-300 ring-1 ring-cheese-400/40 sm:text-lg">
                התפריט המלא · מהטלפון שלכם
              </div>
              <p className="relative mt-4 text-sm text-cream-200/50">עיינו, בחרו והזמינו 🍕</p>
            </div>

            {/* פריסת A4 מלאה — הדפסה בלבד */}
            <div className="hidden print:block">
              <PosterA4 settings={settings} mode="menu" link={menuLink} />
            </div>
          </div>

          <div className="no-print mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => menuQr?.download({ name: "micnic-menu-qr", extension: "png" })}
              disabled={!menuQr}
              className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-3 font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
            >
              ⬇️ הורדת הקוד
            </button>
            <button
              type="button"
              onClick={() => setMono("menu")}
              className="rounded-xl bg-gradient-to-br from-crust-800 to-crust-950 px-6 py-3 font-extrabold text-white shadow-lg shadow-crust-900/30 ring-1 ring-white/20 transition hover:brightness-125 active:scale-[0.99]"
            >
              🖨️ הדפסה שחור-לבן
            </button>
            <button
              type="button"
              onClick={() => printColor("menu")}
              className="rounded-xl border border-crust-700/15 bg-white px-5 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99]"
            >
              הדפסה צבעונית
            </button>
          </div>
        </section>
      </div>

      {/* פוסטר שחור-לבן (מועדון או תפריט) */}
      {mono === "club" && link && (
        <MonoPoster settings={settings} mode="club" link={link} onClose={() => setMono(null)} />
      )}
      {mono === "menu" && menuLink && (
        <MonoPoster settings={settings} mode="menu" link={menuLink} onClose={() => setMono(null)} />
      )}
    </div>
  );
}
