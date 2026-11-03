import { z } from "zod";
import { getStore } from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/auth";
import { phoneSchema } from "@/lib/phone";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  businessName: z.string().trim().min(2, "שם העסק קצר מדי").max(60, "שם העסק ארוך מדי"),
  logo: z
    .string()
    .max(2_500_000, "הלוגו גדול מדי (עד 1.5MB)")
    .refine((v) => v.startsWith("/") || v.startsWith("data:image/"), "פורמט הלוגו אינו נתמך"),
  discountPercent: z.coerce
    .number()
    .int("אחוז ההנחה חייב להיות מספר שלם")
    .min(1, "ההנחה חייבת להיות לפחות 1%")
    .max(100, "ההנחה לא יכולה לעבור 100%"),
  messageTemplate: z.string().trim().min(10, "ההודעה קצרה מדי").max(1200, "ההודעה ארוכה מדי"),
  inviteTemplate: z.string().trim().min(10, "הודעת ההזמנה קצרה מדי").max(600, "הודעת ההזמנה ארוכה מדי"),
  businessPhone: z.union([z.literal(""), phoneSchema]),
  adminPassword: z.union([z.literal(""), z.string().min(4, "הסיסמה קצרה מדי (לפחות 4 תווים)").max(40)]),
});

export async function GET() {
  const { adminPassword: _hidden, ...publicSettings } = await (await getStore()).getSettings();
  return Response.json(publicSettings);
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" }, { status: 400 });
  }

  const store = await getStore();
  const current = await store.getSettings();
  const { adminPassword, ...rest } = parsed.data;

  await store.saveSettings({
    ...current,
    ...rest,
    // סיסמה ריקה = לשמור על הקיימת
    ...(adminPassword ? { adminPassword } : {}),
  });
  return Response.json({ ok: true });
}
