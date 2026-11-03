import type { Store } from "./types";

/**
 * מחזיר את שכבת האחסון הפעילה:
 * - עם MONGODB_URI בסביבה → MongoDB (לפריסה ב-Vercel)
 * - אחרת → קובץ JSON מקומי (להרצה על מחשב העסק)
 */
export async function getStore(): Promise<Store> {
  if (process.env.MONGODB_URI) {
    const { mongoStore } = await import("./mongo");
    return mongoStore;
  }
  const { jsonStore } = await import("./json");
  return jsonStore;
}

export type { Customer, NewCustomer, PublicSettings, Settings } from "./types";
