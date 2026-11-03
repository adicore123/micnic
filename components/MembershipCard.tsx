import Barcode from "./Barcode";
import type { Customer, PublicSettings } from "@/lib/db/types";

const pad = (n: number) => String(n).padStart(4, "0");

/** כרטיס חברות דיגיטלי — לוגו העסק, שם החבר, מספר חברות וברקוד אישי */
export default function MembershipCard({
  customer,
  settings,
  className = "",
}: {
  customer: Customer;
  settings: PublicSettings;
  className?: string;
}) {
  return (
    <div className={`card-lux anim-card-in relative w-full max-w-sm p-5 ${className}`}>
      <div className="card-sheen" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-tomato-500/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-cheese-400/20 blur-3xl" />

      <div className="relative flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={settings.logo} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover shadow-md ring-2 ring-cheese-400/50" />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-cheese-300">{settings.businessName}</div>
          <div className="text-xs text-cream-200/60">כרטיס חבר מועדון</div>
        </div>
        <span className="ms-auto shrink-0 rounded-full bg-cheese-400/15 px-3 py-1 text-sm font-extrabold text-cheese-300 ring-1 ring-cheese-400/30">
          {settings.discountPercent}% הנחה
        </span>
      </div>

      <div className="relative mt-4">
        <div className="truncate text-xl font-extrabold text-cream-50">{customer.name}</div>
        <div className="text-xs text-cream-200/60">חבר/ה מס׳ {pad(customer.cardNumber)}</div>
      </div>

      {customer.points ? (
        <div className="relative mt-3 rounded-xl bg-crust-950/60 px-3 py-2 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-cream-200/80">
            <span>🍕 {customer.points}/{settings.stampGoal ?? 10} חותמות</span>
            <span className="truncate">{settings.stampReward}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-l from-cheese-400 to-cheese-500"
              style={{ width: `${Math.min(100, Math.round(((customer.points ?? 0) / (settings.stampGoal ?? 10)) * 100))}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="relative mt-3 flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-crust-950/70 px-3 py-2 ring-1 ring-white/5">
        <Barcode value={`MC${pad(customer.cardNumber)}`} className="h-11 w-auto" />
        <span dir="ltr" className="shrink-0 pb-0.5 font-mono text-[11px] tracking-[0.2em] text-cream-200/50">
          {pad(customer.cardNumber)}
        </span>
      </div>
    </div>
  );
}
