import { getStore } from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/auth";
import { joinSchema } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();

  const parsed = joinSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" }, { status: 400 });
  }

  const { id } = await params;
  const store = await getStore();

  const byPhone = await store.findCustomerByPhone(parsed.data.phone);
  if (byPhone && byPhone.id !== id) {
    return Response.json({ error: `המספר הזה כבר רשום במועדון על שם ${byPhone.name}` }, { status: 409 });
  }

  const customer = await store.updateCustomer(id, parsed.data);
  if (!customer) {
    return Response.json({ error: "הלקוח לא נמצא" }, { status: 404 });
  }
  return Response.json({ customer });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  await (await getStore()).deleteCustomer(id);
  return Response.json({ ok: true });
}
