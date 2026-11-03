"use client";

import { useEffect, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import StyledQr from "./StyledQr";
import PosterA4 from "./PosterA4";
import type { PublicSettings } from "@/lib/db/types";

/**
 * מסך הפוסטר השחור-לבן: תצוגה מקדימה נוחה במסך, ובהדפסה — פריסת A4 מלאה
 * (210×297mm) שעוצבה במיוחד למדפסות מונו.
 */
export default function MonoPoster({
  settings,
  link,
  onClose,
}: {
  settings: PublicSettings;
  link: string;
  onClose: () => void;
}) {
  const [qr, setQr] = useState<QRCodeStyling | null>(null);

  // בהדפסה מהמסך הזה מודפס רק הפוסטר השחור-לבן
  useEffect(() => {
    document.body.classList.add("print-poster-only");
    return () => document.body.classList.remove("print-poster-only");
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-4 sm:p-8">
      <div className="mx-auto w-full max-w-md">
        <div className="no-print mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-crust-900">גרסה שחור-לבן להדפסה ב-A4</h3>
            <p className="mt-0.5 text-sm text-crust-700/60">
              מותאמת למדפסות שחור-לבן — ממלאת עמוד A4 שלם, חדה וחסכונית בדיו
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-lg p-2 text-crust-700/50 transition hover:bg-crust-700/10 hover:text-crust-900"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* בהדפסה: פריסת A4 מלאה במקום התצוגה המקדימה */}
        <div className="print-target">
          {/* תצוגה מקדימה במסך בלבד */}
          <div className="print:hidden mx-auto w-full max-w-sm rounded-2xl border-[3px] border-black bg-white p-8 text-center text-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logo}
              alt=""
              className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-black grayscale"
            />

            <h4 className="mt-5 text-3xl font-extrabold leading-tight text-black">{settings.businessName}</h4>
            <p className="mt-1 text-lg font-bold text-black">מועדון הלקוחות</p>

            <div aria-hidden="true" className="mt-5 border-t-4 border-double border-black" />

            <StyledQr data={link} logo={settings.logo} size={850} displaySize={280} mono onReady={setQr} className="mx-auto mt-6" />

            <p className="mt-6 text-xl font-extrabold text-black">סרקו והצטרפו עכשיו</p>
            <div className="mx-auto mt-3 w-fit rounded-xl border-2 border-black px-6 py-2.5 text-lg font-extrabold text-black">
              {settings.discountPercent}% הנחה לחברי המועדון
            </div>
            <p className="mt-3 text-sm font-semibold text-black/70">ההצטרפות חינם · לוקחת 10 שניות</p>
          </div>

          {/* פריסת A4 — הדפסה בלבד */}
          <div className="hidden print:block force-colors">
            <PosterA4 settings={settings} link={link} mono />
          </div>
        </div>

        <div className="no-print mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-gradient-to-br from-crust-800 to-crust-950 px-8 py-3.5 text-lg font-extrabold text-white shadow-lg transition hover:brightness-125 active:scale-[0.99]"
          >
            🖨️ הדפסה שחור-לבן (A4)
          </button>
          <button
            type="button"
            onClick={() => qr?.download({ name: "micnic-qr-black-white", extension: "png" })}
            disabled={!qr}
            className="rounded-xl border border-crust-700/20 bg-white px-6 py-3.5 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99] disabled:opacity-50"
          >
            ⬇️ הורדת הקוד (PNG איכות הדפסה)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-crust-700/20 bg-white px-6 py-3.5 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99]"
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}
