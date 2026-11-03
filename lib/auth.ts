import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "./db";

const COOKIE_NAME = "micnic_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 יום

function secret(): string {
  return process.env.AUTH_SECRET ?? "micnic-club-dev-secret";
}

/** טביעת עין של הסיסמה — כשמחליפים סיסמה כל החיבורים הקיימים מתנתקים */
function fingerprint(password: string): string {
  return createHash("sha256").update(password).digest("hex").slice(0, 16);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function login(password: string): Promise<boolean> {
  const settings = await (await getStore()).getSettings();
  if (password !== settings.adminPassword) return false;

  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${exp}.${fingerprint(settings.adminPassword)}`;
  const token = `${payload}.${sign(payload)}`;

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

export async function logout(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const [exp, fp, sig] = raw.split(".");
  if (!exp || !fp || !sig || Number(exp) < Date.now()) return false;

  const settings = await (await getStore()).getSettings();
  if (fp !== fingerprint(settings.adminPassword)) return false;

  const expected = sign(`${exp}.${fp}`);
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function unauthorized(): Response {
  return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
}
