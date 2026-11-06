import { getStore } from "@/lib/db";
import PizzaBuilder from "@/components/PizzaBuilder";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "בונים פיצה אישית 🍕 | מיקניק",
  description: "בנו את הפיצה שלכם בתלת-ממד — בחרו תוספות, גררו על הפיצה והזמינו בוואטסאפ",
};

export default async function PizzaPage() {
  const { adminPassword: _hidden, kitchenPin: _hiddenPin, ...settings } = await (
    await getStore()
  ).getSettings();
  return <PizzaBuilder settings={settings} />;
}
