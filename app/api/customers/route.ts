import { getStore } from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/auth";
import { joinWithConsentSchema } from "@/lib/phone";
import { renderMessage, waLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return Response.json({ customers: await (await getStore()).listCustomers() });
}

/**
 * הצטרפות למועדון — פתוח לכולם, אך מחייב אישור מפורש של הלקוח:
 * הלקוח מאשר בעצמו בטופס הציבורי, או הצוות מעיד על אישורו בעל פה כשהלקוח לפניו.
 */
export async function POST(request: Request) {
  const parsed = joinWithConsentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" }, { status: 400 });
  }

  const store = await getStore();
  const existing = await store.findCustomerByPhone(parsed.data.phone);
  const customer = existing ?? (await store.addCustomer(parsed.data));
  const settings = await store.getSettings();
  const message = renderMessage(settings.messageTemplate, customer.name, settings);

  return Response.json({
    customer,
    existing: Boolean(existing),
    message,
    waLink: waLink(customer.phone, message),
  });
}
