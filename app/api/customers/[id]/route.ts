import { z } from "zod";
import { getStore } from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/auth";
import { birthdaySchema, joinSchema } from "@/lib/phone";

export const dynamic = "force-dynamic";

const editSchema = joinSchema.extend({
  birthday: z.optional(z.union([z.literal(""), birthdaySchema])),
  tags: z.optional(z.array(z.string().trim().min(1).max(20)).max(6)),
  note: z.optional(z.string().trim().max(200)),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();

  const parsed = editSchema.safeParse(await request.json().catch(() => null));
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

/** פעולות כרטיס המועדון — חותמה או מימוש פרס */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();

  const { action } = (await request.json().catch(() => ({}))) as { action?: string };
  const { id } = await params;
  const store = await getStore();

  if (action === "stamp") {
    const result = await store.stampCustomer(id);
    if (!result) return Response.json({ error: "הלקוח לא נמצא" }, { status: 404 });
    return Response.json(result);
  }
  if (action === "redeem") {
    const customer = await store.redeemReward(id);
    if (!customer) return Response.json({ error: "הלקוח לא נמצא" }, { status: 404 });
    return Response.json({ customer });
  }
  return Response.json({ error: "פעולה לא מוכרת" }, { status: 400 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  await (await getStore()).deleteCustomer(id);
  return Response.json({ ok: true });
}
