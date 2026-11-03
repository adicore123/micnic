"use client";

import { useEffect, useState } from "react";
import type QRCodeStyling from "qr-code-styling";
import StyledQr from "./StyledQr";
import type { PublicSettings } from "@/lib/db/types";

/** פוסטר ההצטרפות לדלפק — QR מעוצב עם הלוגו, להצגה על מסך או הורדה להדפסה */
export default function PosterView({ settings }: { settings: PublicSettings }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const [qr, setQr] = useState<QRCodeStyling | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin ? `${origin}/` : null;

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-gradient-to-b from-crust-800 to-crust-950 p-10 text-center shadow-2xl">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-tomato-500/25 blur-[100px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-cheese-400/15 blur-[100px]" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={settings.logo} alt="" className="anim-float relative mx-auto h-20 w-20 rounded-full object-cover ring-2 ring-cheese-400/40" />

        <h1 className="relative mt-5 text-3xl font-extrabold leading-snug text-cream-50">
          סרקו והצטרפו
          <br />
          למועדון הלקוחות
        </h1>
        <p className="relative mt-2 text-cream-200/70">של {settings.businessName}</p>

        <div className="relative mx-auto mt-7 w-fit rounded-3xl bg-cream-50 p-5 shadow-inner">
          {url ? (
            <StyledQr data={url} logo={settings.logo} size={280} onReady={setQr} />
          ) : (
            <div className="h-[280px] w-[280px] animate-pulse rounded-2xl bg-cream-200" />
          )}
        </div>

        <div className="relative mx-auto mt-7 w-fit rounded-full bg-cheese-400/15 px-7 py-2.5 text-lg font-extrabold text-cheese-300 ring-1 ring-cheese-400/40">
          🎁 {settings.discountPercent}% הנחה לחברי המועדון
        </div>
        <p className="relative mt-4 text-sm text-cream-200/50">ההצטרפות לוקחת 10 שניות 📱</p>
      </div>

      <div className="no-print flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => qr?.download({ name: "micnic-club-qr", extension: "png" })}
          disabled={!qr}
          className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-6 py-3 font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        >
          ⬇️ הורדת הקוד להדפסה
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-crust-700/15 bg-white px-6 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99]"
        >
          🖨️ הדפסה
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-xl border border-crust-700/15 bg-white px-6 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100 active:scale-[0.99]"
        >
          {copied ? "הקישור הועתק ✓" : "🔗 העתקת הקישור"}
        </button>
      </div>

      <p className="no-print max-w-md text-center text-sm leading-relaxed text-crust-700/60">
        טיפ: מומלץ להציב את הפוסטר על מסך בדלפק או להדפיס ולהצמיד לקופה. הקוד מוביל לעמוד ההצטרפות של המועדון.
      </p>
    </div>
  );
}
