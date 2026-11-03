"use client";

import { useEffect, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import StyledQr from "./StyledQr";
import type { PublicSettings } from "@/lib/db/types";

/** ממיר תמונה לגווני אפור כ-data URL — כדי שהלוגו במרכז ה-QR יהיה שחור-לבן גם בהורדה */
function toGrayscaleDataUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src);
        ctx.filter = "grayscale(1)";
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * פוסטר הצטרפות בגרסת שחור-לבן — מעוצב מאפס להדפסה על מדפסות מונו:
 * לבן טהור, שחור טהור, בלי רקעים כבדים. נפתח כמסך מלא עם הדפסה והורדה.
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
  const [monoLogo, setMonoLogo] = useState<string | null>(null);

  // בהדפסה מהמסך הזה מודפס רק הפוסטר השחור-לבן
  useEffect(() => {
    document.body.classList.add("print-poster-only");
    return () => document.body.classList.remove("print-poster-only");
  }, []);

  useEffect(() => {
    let alive = true;
    void toGrayscaleDataUrl(settings.logo).then((gray) => {
      if (alive) setMonoLogo(gray);
    });
    return () => {
      alive = false;
    };
  }, [settings.logo]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-4 sm:p-8">
      <div className="mx-auto w-full max-w-md">
        <div className="no-print mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-crust-900">גרסה שחור-לבן להדפסה</h3>
            <p className="mt-0.5 text-sm text-crust-700/60">מותאמת במיוחד למדפסות שחור-לבן — חדה, נקייה וחסכונית בדיו</p>
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

        {/* הפוסטר עצמו */}
        <div className="print-target force-colors mx-auto w-full max-w-sm rounded-2xl border-[3px] border-black bg-white p-8 text-center text-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.logo} alt="" className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-black grayscale" />

          <h4 className="mt-5 text-3xl font-extrabold leading-tight text-black">{settings.businessName}</h4>
          <p className="mt-1 text-lg font-bold text-black">מועדון הלקוחות</p>

          <div aria-hidden="true" className="mt-5 border-t-4 border-double border-black" />

          {link ? (
            <StyledQr data={link} logo={monoLogo ?? settings.logo} size={280} mono onReady={setQr} className="mx-auto mt-6" />
          ) : (
            <div className="mx-auto mt-6 h-[280px] w-[280px] animate-pulse bg-crust-700/10" />
          )}

          <p className="mt-6 text-xl font-extrabold text-black">סרקו והצטרפו עכשיו</p>
          <div className="mx-auto mt-3 w-fit rounded-xl border-2 border-black px-6 py-2.5 text-lg font-extrabold text-black">
            {settings.discountPercent}% הנחה לחברי המועדון
          </div>
          <p className="mt-3 text-sm font-semibold text-black/70">ההצטרפות חינם · לוקחת 10 שניות</p>
        </div>

        <div className="no-print mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-gradient-to-br from-crust-800 to-crust-950 px-8 py-3.5 text-lg font-extrabold text-white shadow-lg transition hover:brightness-125 active:scale-[0.99]"
          >
            🖨️ הדפסה שחור-לבן
          </button>
          <button
            type="button"
            onClick={() => qr?.download({ name: "micnic-qr-black-white", extension: "png" })}
            disabled={!qr}
            className="rounded-xl border border-crust-700/20 bg-white px-6 py-3.5 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99] disabled:opacity-50"
          >
            ⬇️ הורדת הקוד (PNG)
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
