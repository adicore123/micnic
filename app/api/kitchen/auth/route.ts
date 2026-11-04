import { loginKitchen, logoutKitchen } from "@/lib/kitchenAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { pin } = (await request.json().catch(() => ({}))) as { pin?: string };
  if (!pin || !(await loginKitchen(pin.trim()))) {
    return Response.json({ error: "קוד שגוי — נסו שוב" }, { status: 401 });
  }
  return Response.json({ ok: true });
}

export async function DELETE() {
  await logoutKitchen();
  return Response.json({ ok: true });
}
