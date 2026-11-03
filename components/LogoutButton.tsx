"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.refresh();
      }}
      className={
        dark
          ? "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-cream-200/60 transition hover:bg-tomato-500/15 hover:text-tomato-400"
          : "rounded-lg px-3 py-1.5 text-sm font-medium text-crust-700/70 transition hover:bg-tomato-500/10 hover:text-tomato-600"
      }
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 shrink-0">
        <path strokeLinecap="round" d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M16 8l4 4-4 4M20 12H9" />
      </svg>
      {dark ? "יציאה" : ""}
    </button>
  );
}
