import type { ReactNode } from "react";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import PasswordGate from "@/components/PasswordGate";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) return <PasswordGate />;

  return (
    <div className="min-h-screen bg-cream-50 text-crust-900">
      <header className="no-print sticky top-0 z-20 border-b border-crust-700/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2 text-lg font-extrabold text-crust-900">
            <span className="text-2xl">🍕</span>
            ניהול המועדון
          </Link>
          <nav className="flex items-center gap-1 text-sm font-semibold text-crust-700">
            <Link href="/admin" className="rounded-lg px-3 py-1.5 transition hover:bg-crust-700/5 hover:text-crust-900">
              לקוחות
            </Link>
            <Link href="/admin/settings" className="rounded-lg px-3 py-1.5 transition hover:bg-crust-700/5 hover:text-crust-900">
              הגדרות
            </Link>
            <Link href="/admin/poster" className="rounded-lg px-3 py-1.5 transition hover:bg-crust-700/5 hover:text-crust-900">
              פוסטר QR
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
