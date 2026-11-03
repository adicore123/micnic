import { getStore } from "@/lib/db";
import PosterView from "@/components/PosterView";

export const dynamic = "force-dynamic";

export default async function PosterPage() {
  const { adminPassword: _hidden, ...settings } = await (await getStore()).getSettings();
  return <PosterView settings={settings} />;
}
