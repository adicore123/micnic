"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicSettings } from "@/lib/db/types";

/** שער קוד המטבח — מקלדת מספרים ענקית לידיים עסוקות */
export default function KitchenGate({ settings }: { settings: PublicSettings }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(finalPin: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await fetch("/api/kitchen/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: finalPin }),
    }).catch(() => null);
    setPending(false);

    if (res?.ok) {
      router.refresh();
    } else {
      setPin("");
      setError(res ? "קוד שגוי — נסו שוב" : "בעיית חיבור — נסו שוב");
    }
  }

  function press(digit: string) {
    if (pending) return;
    const next = (pin + digit).slice(0, 6);
    setPin(next);
    setError(null);
  }

  const keyClass =
    "flex h-16 items-center justify-center rounded-2xl border border-crust-700/10 bg-white text-2xl font-extrabold text-crust-900 shadow-sm transition hover:bg-cream-100 active:scale-95 sm:h-20 sm:text-3xl";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-100 px-4 py-8">
      <div className="w-full max-w-xs">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.logo} alt="" className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-cheese-400/40" />
          <h1 className="mt-4 text-2xl font-extrabold text-crust-900">מטבח {settings.businessName}</h1>
          <p className="mt-1 text-sm text-crust-700/60">הקישו את קוד המטבח</p>
        </div>

        {/* נקודות התקדמות */}
        <div className="mt-6 flex justify-center gap-3" aria-hidden="true">
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition ${i < pin.length ? "scale-110 bg-tomato-500" : "bg-crust-700/15"}`}
            />
          ))}
        </div>
        {error && <p className="mt-3 text-center text-sm font-bold text-tomato-600">{error}</p>}

        {/* מקלדת */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button key={d} type="button" onClick={() => press(d)} className={keyClass} dir="ltr">
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin("")}
            className="flex h-16 items-center justify-center rounded-2xl border border-crust-700/10 bg-white text-lg font-bold text-crust-700/60 shadow-sm transition hover:bg-cream-100 active:scale-95 sm:h-20"
          >
            C
          </button>
          <button type="button" onClick={() => press("0")} className={keyClass} dir="ltr">
            0
          </button>
          <button
            type="button"
            onClick={() => submit(pin)}
            disabled={pin.length < 4 || pending}
            className="flex h-16 items-center justify-center rounded-2xl bg-gradient-to-br from-basil-400 to-basil-600 text-xl font-extrabold text-white shadow-lg shadow-basil-600/25 transition hover:brightness-110 active:scale-95 disabled:opacity-40 sm:h-20"
          >
            {pending ? "…" : "✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
