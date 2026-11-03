import { getStore } from "@/lib/db";
import { isAdmin, unauthorized } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  await (await getStore()).deleteCustomer(id);
  return Response.json({ ok: true });
}
