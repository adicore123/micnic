import type { Settings, Store } from "./types";

/**
 * מטמון הגדרות קצר-טווח בצד השרת — ההגדרות כמעט לא משתנות,
 * וכל ניווט בניהול קורא אותן פעמיים-שלוש (אימות, layout, עמוד).
 * שמירת הגדרות מנקה את המטמון מיידית.
 */
const SETTINGS_TTL_MS = 10_000;

const globalForCache = globalThis as typeof globalThis & {
  __micnicSettingsCache?: { value: Settings; at: number };
};

function withSettingsCache(store: Store): Store {
  return {
    ...store,
    async getSettings() {
      const cached = globalForCache.__micnicSettingsCache;
      if (cached && Date.now() - cached.at < SETTINGS_TTL_MS) {
        return cached.value;
      }
      const value = await store.getSettings();
      globalForCache.__micnicSettingsCache = { value, at: Date.now() };
      return value;
    },
    async saveSettings(settings) {
      globalForCache.__micnicSettingsCache = undefined;
      return store.saveSettings(settings);
    },
  };
}

/**
 * מחזיר את שכבת האחסון הפעילה:
 * - עם MONGODB_URI בסביבה → MongoDB (לפריסה ב-Vercel)
 * - אחרת → קובץ JSON מקומי (להרצה על מחשב העסק)
 */
export async function getStore(): Promise<Store> {
  if (process.env.MONGODB_URI) {
    const { mongoStore } = await import("./mongo");
    return withSettingsCache(mongoStore);
  }
  const { jsonStore } = await import("./json");
  return withSettingsCache(jsonStore);
}

export type { Customer, NewCustomer, PublicSettings, Settings } from "./types";
