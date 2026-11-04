import { z } from "zod";
import { getStore } from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

const recipeSchema = z.object({
  dishId: z.string().trim().min(1).max(40),
  steps: z.string().trim().max(4000),
});

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return Response.json({ recipes: await (await getStore()).getRecipes() });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return unauthorized();

  const parsed = recipeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "פרטים לא תקינים" }, { status: 400 });
  }

  await (await getStore()).saveRecipe(parsed.data.dishId, parsed.data.steps);
  return Response.json({ ok: true });
}
