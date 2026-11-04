import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "./db";

const COOKIE_NAME = "micnic_kitchen";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 יום

function secret(): string {
  return process.env.AUTH_SECRET ?? "micnic-club-dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** טביעת עין של קוד המטבח — החלפת הקוד מנתקת את כל הטבחים */
function fingerprint(pin: string): string {
  return createHash("sha256").update(`kitchen:${pin}`).digest("hex").slice(0, 16);
}

export async function loginKitchen(pin: string): Promise<boolean> {
  const settings = await (await getStore()).getSettings();
  if (!settings.kitchenPin || pin !== settings.kitchenPin) return false;

  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${exp}.${fingerprint(settings.kitchenPin)}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

export async function logoutKitchen(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isKitchenAuthed(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const [exp, fp, sig] = raw.split(".");
  if (!exp || !fp || !sig || Number(exp) < Date.now()) return false;

  const settings = await (await getStore()).getSettings();
  if (!settings.kitchenPin || fp !== fingerprint(settings.kitchenPin)) return false;

  const expected = sign(`${exp}.${fp}`);
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
