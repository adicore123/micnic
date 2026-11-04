import { z } from "zod";
import { getStore } from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const recipeSchema = z.object({
  dishId: z.string().trim().min(1).max(40),
  steps: z.string().trim().max(4000).optional(),
  /** null = הסרת התמונה */
  image: z
    .union([
      z.null(),
      z
        .string()
        .max(2_200_000, "התמונה גדולה מדי")
        .refine((v) => v.startsWith("data:image/"), "פורמט תמונה לא נתמך"),
    ])
    .optional(),
});

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return Response.json({ recipes: await (await getStore()).getRecipes() });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  const parsed = recipeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" }, { status: 400 });
  }
  if (parsed.data.steps === undefined && parsed.data.image === undefined) {
    return Response.json({ error: "לא נשלח תוכן לעדכון" }, { status: 400 });
  }

  const { dishId, ...patch } = parsed.data;
  await (await getStore()).saveRecipe(dishId, patch);
  return Response.json({ ok: true });
}
