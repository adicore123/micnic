import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_SETTINGS } from "../defaults";
import type { Customer, NewCustomer, Settings, Store } from "./types";

type DbFile = { customers: Customer[]; settings: Settings };

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");

let cache: DbFile | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

async function read(): Promise<DbFile> {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(await fs.readFile(dbFile, "utf8")) as Partial<DbFile>;
    cache = {
      customers: parsed.customers ?? [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    cache = { customers: [], settings: { ...DEFAULT_SETTINGS } };
    void flush(cache);
  }
  return cache;
}

/** כותב לדיסק בתור — מונע כתיבות שקורסות זו לזו */
function flush(db: DbFile): Promise<unknown> {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dbFile, JSON.stringify(db, null, 2), "utf8");
  });
  return writeQueue;
}

export const jsonStore: Store = {
  async listCustomers() {
    return (await read())
      .customers.slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async addCustomer(input: NewCustomer) {
    const db = await read();
    const cardNumber = db.customers.reduce((max, c) => Math.max(max, c.cardNumber), 100) + 1;
    const customer: Customer = {
      id: randomUUID(),
      name: input.name,
      phone: input.phone,
      cardNumber,
      createdAt: new Date().toISOString(),
    };
    db.customers.push(customer);
    await flush(db);
    return customer;
  },

  async deleteCustomer(id) {
    const db = await read();
    db.customers = db.customers.filter((c) => c.id !== id);
    await flush(db);
  },

  async findCustomerByPhone(phone) {
    return (await read()).customers.find((c) => c.phone === phone) ?? null;
  },

  async getSettings() {
    return (await read()).settings;
  },

  async saveSettings(settings) {
    const db = await read();
    db.settings = settings;
    await flush(db);
  },
};
