import type { ReactNode } from "react";
import { isAdmin } from "@/lib/auth";
import { getStore } from "@/lib/db";
import PasswordGate from "@/components/PasswordGate";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) return <PasswordGate />;

  const settings = await (await getStore()).getSettings();
  return (
    <AdminShell businessName={settings.businessName} logo={settings.logo}>
      {children}
    </AdminShell>
  );
}
