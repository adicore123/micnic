import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import PrintCardView from "@/components/PrintCardView";

export const dynamic = "force-dynamic";

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await getStore();
  const customer = await store.findCustomerById(id);
  if (!customer) notFound();

  const { adminPassword: _hidden, ...settings } = await store.getSettings();
  return <PrintCardView customer={customer} settings={settings} />;
}
