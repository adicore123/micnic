"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPieScene, type PieScene } from "@/lib/pizza3d/scene";
import { BASE_PRICE, TOPPINGS } from "@/lib/pizza3d/toppings";
import WhatsAppButton from "./WhatsAppButton";
import { waLink } from "@/lib/whatsapp";
import type { PublicSettings } from "@/lib/db/types";

type Props = { settings: PublicSettings };

/** בונה הפיצה האישית — פיצה תלת-ממדית + גרירת תוספות על הבצק */
export default function PizzaBuilder({ settings }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stillRef = useRef<HTMLImageElement>(null);
  const sceneRef = useRef<PieScene | null>(null);
  const [ready, setReady] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dragKind, setDragKind] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let scene: PieScene | null = null;
    void createPieScene(hostRef.current!, stillRef.current!, {
      onToppingDiscarded: (uid) => {
        const kind = uid.split("-")[0];
        setCounts((prev) => ({ ...prev, [kind]: Math.max(0, (prev[kind] ?? 1) - 1) }));
      },
      onToppingMoved: () => undefined,
    }).then((s) => {
      if (disposed) {
        s.dispose();
        return;
      }
      scene = s;
      sceneRef.current = s;
      setReady(true);
    });
    return () => {
      disposed = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const summary = useMemo(() => {
    const lines: string[] = [];
    let total = BASE_PRICE;
    for (const kind of TOPPINGS) {
      const count = counts[kind.id] ?? 0;
      if (count > 0) {
        lines.push(`${kind.name} ×${count}`);
        total += kind.price * count;
      }
    }
    return { lines, total };
  }, [counts]);

  const orderMessage = useMemo(() => {
    const list = summary.lines.length ? summary.lines.join(", ") : "ללא תוספות";
    return `🍕 הזמנת פיצה אישית מ${settings.businessName}!\n\nההרכב שלי: ${list}\nסה"כ: ${summary.total}₪\n\nבונים אותה בעצמי ב: ${typeof window !== "undefined" ? window.location.href : ""}`;
  }, [summary, settings.businessName]);

  // ─── גרירה מהמגש: הרכיב עוקב אחרי האצבע, הסצנה מזיזה רפאים ───
  useEffect(() => {
    if (!dragKind) return;
    const kind = TOPPINGS.find((k) => k.id === dragKind);
    if (!kind) return;

    const move = (e: globalThis.PointerEvent) => sceneRef.current?.moveGhost(e.clientX, e.clientY);
    const up = (e: globalThis.PointerEvent) => {
      const spot = sceneRef.current?.endGhost();
      if (spot) {
        sceneRef.current?.addTopping(kind, spot);
        setCounts((prev) => ({ ...prev, [kind.id]: (prev[kind.id] ?? 0) + 1 }));
      }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDragKind(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragKind]);

  function trayPointerDown(kindId: string, e: ReactPointerEvent<HTMLElement>) {
    if (!ready || dragKind) return;
    const kind = TOPPINGS.find((k) => k.id === kindId);
    if (!kind) return;
    const scene = sceneRef.current;
    if (!scene) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const move = (ev: globalThis.PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) {
        moved = true;
        scene.beginGhost(kind, ev.clientX, ev.clientY);
        setDragKind(kind.id);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!moved) {
        // הקשה קצרה = הוספה מהירה בנקודה פנויה
        scene.addTopping(kind);
        setCounts((prev) => ({ ...prev, [kind.id]: (prev[kind.id] ?? 0) + 1 }));
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function clearAll() {
    sceneRef.current?.clearToppings();
    setCounts({});
  }

  const hasToppings = Object.values(counts).some((n) => n > 0);

  return (
    <div className="flex min-h-dvh flex-col bg-crust-950 text-cream-50">
      {/* כותרת */}
      <header className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={settings.logo} alt="" className="mx-auto h-14 w-14 rounded-full object-cover ring-2 ring-cheese-400/50" />
        <h1 className="mt-3 text-3xl font-extrabold">בונים פיצה אישית 🍕</h1>
        <p className="mt-1 text-sm text-cream-200/60">
          בחרו תוספות, גררו על הפיצה — והזמינו ישר בוואטסאפ. גררו את הפיצה עצמה כדי לסובב אותה.
        </p>
      </header>

      {/* הפיצה */}
      <div ref={hostRef} className="relative mx-auto mt-2 aspect-square w-full max-w-[440px] min-h-[300px] touch-none select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={stillRef} alt="" className="absolute inset-0 h-full w-full rounded-3xl object-cover" hidden />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-cream-200/40">
            <span className="animate-pulse text-lg font-bold">טוען את הפיצה…</span>
          </div>
        )}
      </div>

      {/* מגש התוספות */}
      <div className="mt-2">
        <p className="text-center text-xs font-bold text-cream-200/50">לוחצים להוספה מהירה · או גוררים על הפיצה למיקום מדויק</p>
        <div className="mt-2.5 flex gap-2 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ justifyContent: "safe center" }}>
          {TOPPINGS.map((kind) => {
            const count = counts[kind.id] ?? 0;
            return (
              <button
                key={kind.id}
                type="button"
                onPointerDown={(e) => trayPointerDown(kind.id, e)}
                className={`relative flex h-[76px] w-[64px] shrink-0 touch-none select-none flex-col items-center justify-center gap-1 rounded-2xl border text-center transition active:scale-95 ${
                  count > 0
                    ? "border-cheese-400/50 bg-cheese-400/10"
                    : "border-white/10 bg-white/5 hover:border-cheese-400/30"
                }`}
              >
                <span className="text-2xl leading-none">{kind.emoji}</span>
                <span className="px-1 text-[11px] font-bold leading-tight">{kind.name}</span>
                <span className="text-[10px] font-bold text-cheese-300">+{kind.price}₪</span>
                {count > 0 && (
                  <span className="absolute -end-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-tomato-500 text-xs font-extrabold text-white shadow-md">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* פס סיכום */}
      <div className="sticky bottom-0 mt-auto border-t border-white/10 bg-crust-900/95 px-4 py-3.5 backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-extrabold text-cheese-300">הפיצה שלך:</span>
          <span className="min-w-0 flex-1 truncate text-sm text-cream-100">
            {hasToppings ? summary.lines.join(" · ") : `בסיס גבינה ורוטב (${BASE_PRICE}₪)`}
          </span>
          <span className="text-lg font-extrabold text-cream-50">{summary.total}₪</span>
        </div>
        <div className="mx-auto mt-3 flex max-w-lg items-center gap-2.5">
          {settings.businessPhone ? (
            <WhatsAppButton
              className="flex-1 justify-center !py-3 !text-base"
              href={waLink(settings.businessPhone, orderMessage)}
              label="הזמנה בוואטסאפ"
              sub={hasToppings ? "ההרכב המלא יצורף להודעה" : "בסיס בלבד — אפשר להוסיף תוספות"}
            />
          ) : (
            <a
              href="/menu"
              className="flex-1 rounded-2xl bg-gradient-to-br from-tomato-400 to-tomato-600 py-3 text-center font-extrabold text-white shadow-lg"
            >
              🍕 חזרה לתפריט
            </a>
          )}
          {hasToppings && (
            <button
              type="button"
              onClick={clearAll}
              title="ניקוי כל התוספות"
              className="shrink-0 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-cream-200/70 transition hover:bg-white/5"
            >
              🗑 ניקוי
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
