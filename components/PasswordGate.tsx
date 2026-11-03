"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/** מסך כניסת צוות — מוצג במקום כל עמודי הניהול עד להתחברות */
export default function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);

    setPending(false);
    if (res?.ok) {
      router.refresh();
    } else {
      setError(res ? "סיסמה שגויה, נסו שוב" : "בעיית חיבור — נסו שוב");
      setShakeKey((k) => k + 1);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-crust-950 px-4">
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-tomato-500/20 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-cheese-400/10 blur-[120px]" />

      <form
        key={shakeKey}
        onSubmit={submit}
        className={`anim-fade-up relative w-full max-w-sm rounded-3xl border border-white/10 bg-crust-800/80 p-8 shadow-2xl backdrop-blur ${shakeKey ? "anim-shake" : ""}`}
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-20 w-20 rounded-full object-cover shadow-xl ring-2 ring-cheese-400/50 anim-float" />
          <h1 className="text-xl font-extrabold text-cream-50">ניהול מועדון הלקוחות</h1>
          <p className="text-sm text-cream-200/60">אזור הצוות של מיקניק — הזינו סיסמה לכניסה</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="סיסמה"
          autoComplete="current-password"
          className="field mb-4 text-center tracking-widest"
          autoFocus
        />

        {error && <p className="mb-3 text-center text-sm font-semibold text-tomato-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-6 py-3.5 font-extrabold text-white shadow-lg shadow-tomato-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "בודק…" : "כניסה"}
        </button>
      </form>
    </div>
  );
}
