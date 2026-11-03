import { isAdmin, login, logout } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ authed: await isAdmin() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !(await login(body.password))) {
    return Response.json({ error: "סיסמה שגויה, נסו שוב" }, { status: 401 });
  }
  return Response.json({ ok: true });
}

export async function DELETE() {
  await logout();
  return Response.json({ ok: true });
}
