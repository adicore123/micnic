"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import LogoutButton from "./LogoutButton";

type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean };

const iconClass = "h-5 w-5 shrink-0";

const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "לקוחות",
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <circle cx="9" cy="8" r="3.5" />
        <path strokeLinecap="round" d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 5.4a3.2 3.2 0 010 5.4M17.5 14.9c1.7.7 2.7 2.2 3 4.1" />
      </svg>
    ),
  },
  {
    href: "/admin/share",
    label: "שיתוף ופוסטר",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <path strokeLinecap="round" d="M13.5 6.8h7M13.5 17h7M17 3.9v6M14.8 20.2l4.4-4.4M19.2 20.2l-4.4-4.4" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "הגדרות",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
        <circle cx="12" cy="12" r="3" />
        <path
          strokeLinecap="round"
          d="M12 3.5v2M12 18.5v2M4.9 7.5l1.7 1M17.4 15.5l1.7 1M4.9 16.5l1.7-1M17.4 8.5l1.7-1M3.5 12h2M18.5 12h2"
        />
      </svg>
    ),
  },
];

export default function AdminShell({
  businessName,
  logo,
  children,
}: {
  businessName: string;
  logo: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // סגירת המגירה בכל מעבר עמוד
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1.5 px-3">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold transition ${
            isActive(item)
              ? "bg-tomato-500/20 text-cheese-300 shadow-inner"
              : "text-cream-200/70 hover:bg-white/5 hover:text-cream-50"
          }`}
        >
          {item.icon}
          {item.label}
          {isActive(item) && <span className="ms-auto h-2 w-2 rounded-full bg-cheese-400" aria-hidden="true" />}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 px-5 pb-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-cheese-400/40" />
      <div className="min-w-0">
        <div className="truncate text-sm font-extrabold text-cream-50">{businessName}</div>
        <div className="text-[11px] text-cream-200/50">ניהול מועדון הלקוחות</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-50 text-crust-900">
      {/* סיידבר — דסקטופ */}
      <aside className="no-print fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l border-white/5 bg-crust-900 py-6 lg:flex">
        {brand}
        {navLinks}
        <div className="mt-auto border-t border-white/5 px-3 pt-3">
          <LogoutButton dark />
        </div>
      </aside>

      {/* פס עליון — מובייל */}
      <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 bg-crust-900 px-4 py-3 text-cream-50 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="פתיחת התפריט"
          className="rounded-lg p-2 transition hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-cheese-400/40" />
        <span className="truncate text-sm font-extrabold">{businessName}</span>
        <Link href="/admin" className="ms-auto text-xs font-semibold text-cream-200/50">
          🍕
        </Link>
      </header>

      {/* מגירת ניווט — מובייל */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="anim-fade absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="anim-drawer absolute inset-y-0 right-0 flex w-72 flex-col border-l border-white/5 bg-crust-900 py-6 text-cream-50">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="סגירת התפריט"
                className="absolute top-5 left-4 rounded-lg p-2 text-cream-200/60 transition hover:bg-white/10 hover:text-cream-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {navLinks}
            <div className="mt-auto border-t border-white/5 px-3 pt-3">
              <LogoutButton dark />
            </div>
          </div>
        </div>
      )}

      {/* תוכן העמודים */}
      <div className="lg:mr-64">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
