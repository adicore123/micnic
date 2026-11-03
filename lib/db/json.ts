import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_SETTINGS } from "../defaults";
import type { Customer, NewCustomer, Settings, Store } from "./types";

type DbFile = { customers: Customer[]; settings: Settings };

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");

/**
 * נעילת כתיבה גלובלית — נשמרת על globalThis כדי שכל מופעי המודול
 * (בפיתוח עם Turbopack לכל route יכול להיות מופע משלו) ישתפו את אותה תור.
 */
const globalForDb = globalThis as typeof globalThis & { __micnicDbLock?: Promise<unknown> };

/** קורא תמיד מהדיסק — הדיסק הוא מקור האמת, בלי מטמון זיכרון ישן */
async function read(): Promise<DbFile> {
  try {
    const parsed = JSON.parse(await fs.readFile(dbFile, "utf8")) as Partial<DbFile>;
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return { customers: [], settings: { ...DEFAULT_SETTINGS } };
  }
}

async function persist(db: DbFile): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbFile, JSON.stringify(db, null, 2), "utf8");
}

/** קריאה-שינוי-כתיבה אטומית דרך הנעילה — מונע דריסות הדדיות */
async function update<T>(mutate: (db: DbFile) => T): Promise<T> {
  const previous = globalForDb.__micnicDbLock ?? Promise.resolve();
  const result = previous.then(async () => {
    const db = await read();
    const value = mutate(db);
    await persist(db);
    return value;
  });
  globalForDb.__micnicDbLock = result.catch(() => undefined);
  return result;
}

export const jsonStore: Store = {
  async listCustomers() {
    return (await read())
      .customers.slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  addCustomer(input: NewCustomer) {
    return update((db) => {
      const customer: Customer = {
        id: randomUUID(),
        name: input.name,
        phone: input.phone,
        cardNumber: db.customers.reduce((max, c) => Math.max(max, c.cardNumber), 100) + 1,
        createdAt: new Date().toISOString(),
      };
      db.customers.push(customer);
      return customer;
    });
  },

  deleteCustomer(id) {
    return update((db) => {
      db.customers = db.customers.filter((c) => c.id !== id);
    });
  },

  async findCustomerByPhone(phone) {
    return (await read()).customers.find((c) => c.phone === phone) ?? null;
  },

  async getSettings() {
    return (await read()).settings;
  },

  saveSettings(settings) {
    return update((db) => {
      db.settings = settings;
    });
  },
};
