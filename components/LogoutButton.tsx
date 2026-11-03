"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.refresh();
      }}
      className="ms-auto rounded-lg px-3 py-1.5 text-sm font-medium text-crust-700/70 transition hover:bg-tomato-500/10 hover:text-tomato-600"
    >
      יציאה
    </button>
  );
}
