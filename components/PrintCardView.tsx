"use client";

import Link from "next/link";
import Barcode from "./Barcode";
import type { Customer, PublicSettings } from "@/lib/db/types";

const pad = (n: number) => String(n).padStart(4, "0");

/** כרטיס חבר בגרסה מותאמת הדפסה — ברקוד כהה וגדול על רקע בהיר (קריא לסורקים) */
export default function PrintCardView({ customer, settings }: { customer: Customer; settings: PublicSettings }) {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center gap-6">
      <div className="no-print flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
        <span className="text-sm font-bold text-basil-600">הכרטיס מוכן להדפסה 🖨️</span>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-8 py-3 text-lg font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99]"
        >
          הדפסה
        </button>
        <Link
          href="/admin"
          className="rounded-xl border border-crust-700/15 bg-white px-6 py-3 font-bold text-crust-800 shadow-sm transition hover:bg-cream-100"
        >
          חזרה לניהול
        </Link>
      </div>

      <div className="w-full max-w-sm rounded-2xl border-2 border-crust-900/10 bg-white p-6 text-center shadow-md">
        <div className="flex items-center gap-3 text-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.logo} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-tomato-500/25" />
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-crust-900">{settings.businessName}</div>
            <div className="text-xs font-semibold text-crust-700/60">כרטיס חבר מועדון לקוחות</div>
          </div>
        </div>

        <div className="mt-5 border-y border-dashed border-crust-700/25 py-4">
          <div className="truncate text-2xl font-extrabold text-crust-900">{customer.name}</div>
          <div className="mt-0.5 text-sm font-semibold text-crust-700/60">חבר/ה מס׳ {pad(customer.cardNumber)}</div>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <Barcode value={`MC${pad(customer.cardNumber)}`} lineColor="#1b120c" height={72} barWidth={2.4} className="h-[72px] w-auto" />
          <span dir="ltr" className="mt-1.5 font-mono text-sm font-bold tracking-[0.35em] text-crust-800">
            {pad(customer.cardNumber)}
          </span>
        </div>

        <div className="mt-5 rounded-full bg-tomato-500/10 px-5 py-2.5 text-sm font-extrabold text-tomato-600">
          🎁 {settings.discountPercent}% הנחה לחברי המועדון
        </div>
      </div>

      <p className="no-print max-w-sm text-center text-xs leading-relaxed text-crust-700/50">
        אפשר להדפיס ולהצמיד לכרטיסיית החבר בדלפק — הברקוד נקרא בסורק ברקוד וגם במצלמת טלפון.
      </p>
    </div>
  );
}
