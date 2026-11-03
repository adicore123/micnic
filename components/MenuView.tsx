"use client";

import { useEffect, useMemo, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import StyledQr from "./StyledQr";
import WhatsAppButton from "./WhatsAppButton";
import { normalizePhone, PHONE_HINT } from "@/lib/phone";
import { menuMessage, menuUrl, waLink } from "@/lib/whatsapp";
import type { PublicSettings } from "@/lib/db/types";

/** מודול התפריט הדיגיטלי: שליחה ללקוח בוואטסאפ, צפייה ו-QR לשולחנות */
export default function MenuView({ settings }: { settings: PublicSettings }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<QRCodeStyling | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const menuLink = origin ? menuUrl(origin) : "";
  const normalized = normalizePhone(phone);

  const message = useMemo(
    () => menuMessage(settings.businessName, menuLink),
    [settings.businessName, menuLink],
  );

  function guardSend(e: React.MouseEvent) {
    if (!normalized) {
      e.preventDefault();
      setPhoneError(`מספר הטלפון לא נראה תקין. ${PHONE_HINT}`);
    } else {
      setPhoneError(null);
    }
  }

  async function copyLink() {
    if (!menuLink) return;
    await navigator.clipboard.writeText(menuLink).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
    <div className="grid items-start gap-8 lg:grid-cols-2">
      {/* שליחת התפריט בוואטסאפ */}
      <section className="rounded-2xl border border-crust-700/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-crust-900">שליחת התפריט בוואטסאפ</h2>
        <p className="mb-5 mt-1 text-sm leading-relaxed text-crust-700/60">
          מזינים מספר טלפון של לקוח → לוחצים על הכפתור הירוק → נפתח צ'אט עם ההודעה והקישור לתפריט
          הדיגיטלי. הלקוח עובר ישר לתפריט המלא מהטלפון שלו.
        </p>

        <label htmlFor="menu-phone" className="mb-1.5 block text-sm font-semibold text-crust-700">
          טלפון הלקוח
        </label>
        <input
          id="menu-phone"
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
          href={normalized ? waLink(normalized, message) : "#"}
          onClick={guardSend}
          label="שליחת התפריט בוואטסאפ"
          sub="ההודעה מולאה מראש — רק ללחוץ שלח"
        />

        <div className="mt-5">
          <p className="mb-2 text-xs text-crust-700/50">כך תיראה ההודעה אצל הלקוח:</p>
          <div className="wa-bubble mx-auto w-fit max-w-full px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow">
            {message || "…"}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-crust-700/10 pt-4">
          <button
            type="button"
            onClick={copyLink}
            disabled={!menuLink}
            className="rounded-xl border border-crust-700/15 bg-white px-4 py-2.5 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99] disabled:opacity-50"
          >
            {copied ? "הקישור הועתק ✓" : "🔗 העתקת קישור התפריט"}
          </button>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99]"
          >
            🍕 פתיחת התפריט לצפייה
          </a>
        </div>
        {menuLink && (
          <p dir="ltr" className="mt-2 truncate text-left text-xs text-crust-700/40">
            {menuLink}
          </p>
        )}

        <div className="mt-4 rounded-xl bg-cream-100/70 p-4 ring-1 ring-crust-700/10">
          <p className="text-sm font-bold text-crust-800">✏️ עריכת התפריט — לצוות בלבד</p>
          <p className="mt-0.5 text-xs leading-relaxed text-crust-700/60">
            התפריט שהלקוחות רואים נעול ולא ניתן לעריכה. שינויי מנות ומחירים מתבצעים בעורך הפנימי,
            ולאחר מכן בוחרים בו ב"ייצוא ללקוחות" ושולחים לנו את הקובץ לעדכון.
          </p>
          <a
            href="/menu-editor.html"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex rounded-xl border border-crust-700/20 bg-white px-4 py-2 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-50 active:scale-[0.99]"
          >
            פתיחת עורך התפריט
          </a>
        </div>
      </section>

      {/* QR לשולחנות */}
      <section>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-crust-800 to-crust-950 p-8 text-center shadow-2xl">
          <div aria-hidden="true" className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-basil-500/20 blur-[90px]" />

          <p className="relative text-lg font-bold text-cream-200/80">משהו טעים מחכה לכם</p>
          <h3 className="relative mt-1 text-3xl font-extrabold text-cheese-300">התפריט של {settings.businessName}</h3>

          <div className="relative mx-auto mt-7 w-fit rounded-3xl bg-cream-50 p-5 shadow-inner">
            {menuLink ? (
              <StyledQr data={menuLink} logo={settings.logo} size={850} displaySize={260} onReady={setQr} />
            ) : (
              <div className="h-[260px] w-[260px] animate-pulse rounded-2xl bg-cream-200" />
            )}
          </div>

          <p className="relative mt-6 text-lg font-extrabold text-cream-50">סרקו וצפו בתפריט 📱</p>
          <p className="relative mt-1.5 text-sm text-cream-200/60">
            מומלץ להדפיס ולהצמיד לשולחנות ולדלפק — הלקוחות סורקים ומזמינים
          </p>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => qr?.download({ name: "micnic-menu-qr", extension: "png" })}
            disabled={!qr}
            className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-5 py-3 font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            ⬇️ הורדת QR התפריט להדפסה
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-crust-700/15 bg-white px-5 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99]"
          >
            🖨️ הדפסה
          </button>
        </div>
      </section>
    </div>

    {/* תצוגה חיה של התפריט — בלי לעזוב את הניהול */}
    <section className="mt-8 rounded-2xl border border-crust-700/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-crust-900">תצוגה חיה של התפריט</h2>
          <p className="mt-0.5 text-sm text-crust-700/60">כך בדיוק רואים הלקוחות — אפשר לגלול ולבדוק</p>
        </div>
        <a
          href="/menu"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-crust-700/15 bg-white px-4 py-2 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-100"
        >
          ⤢ מסך מלא
        </a>
      </div>
      <div className="overflow-hidden rounded-xl border border-crust-700/10 bg-white shadow-inner">
        <iframe src="/menu" title="תצוגה חיה של התפריט" className="h-[70vh] min-h-96 w-full border-0" loading="lazy" />
      </div>
    </section>
    </>
  );
}
