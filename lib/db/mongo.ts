import { MongoClient } from "mongodb";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_SETTINGS } from "../defaults";
import type { Customer, NewCustomer, Settings, Store } from "./types";

type SettingsDoc = Settings & { _id: string };

const globalForMongo = globalThis as typeof globalThis & {
  __micnicMongo?: Promise<MongoClient>;
  __micnicImported?: boolean;
};

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  globalForMongo.__micnicMongo ??= new MongoClient(uri).connect();
  return globalForMongo.__micnicMongo;
}

async function collections() {
  const db = (await client()).db("micnic");
  const cols = {
    customers: db.collection<Customer>("customers"),
    settings: db.collection<SettingsDoc>("settings"),
  };
  await importLocalData(cols);
  return cols;
}

/** מיגרציה חד-פעמית: אם הענן ריק וקיים בסיס JSON מקומי — מעבירים אותו ל-Mongo */
async function importLocalData(cols: {
  customers: import("mongodb").Collection<Customer>;
  settings: import("mongodb").Collection<SettingsDoc>;
}) {
  if (globalForMongo.__micnicImported) return;
  globalForMongo.__micnicImported = true;
  try {
    const local = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "data", "db.json"), "utf8"),
    ) as { customers?: Customer[]; settings?: Settings };

    if (local.settings && (await cols.settings.countDocuments()) === 0) {
      await cols.settings.updateOne({ _id: SETTINGS_ID }, { $set: local.settings }, { upsert: true });
    }
    if (Array.isArray(local.customers) && local.customers.length > 0 && (await cols.customers.countDocuments()) === 0) {
      await cols.customers.insertMany(local.customers);
    }
  } catch {
    // אין קובץ מקומי או שכבר הועבר — ממשיכים כרגיל
  }
}

const SETTINGS_ID = "main";

/** מנקה את _id של MongoDB — אובייקט ObjectId (עם toJSON) אסור לו להגיע לרכיבי לקוח */
function stripId<T extends object>(doc: T | null): T | null {
  if (!doc) return null;
  const { _id: _removed, ...clean } = doc as T & { _id?: unknown };
  return clean as T;
}

export const mongoStore: Store = {
  async listCustomers() {
    const { customers } = await collections();
    const docs = await customers.find().sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => stripId(doc)!);
  },

  async addCustomer(input: NewCustomer) {
    const { customers } = await collections();
    const last = await customers.find().sort({ cardNumber: -1 }).limit(1).toArray();
    const now = new Date().toISOString();
    const customer: Customer = {
      id: randomUUID(),
      name: input.name,
      phone: input.phone,
      cardNumber: (last[0]?.cardNumber ?? 100) + 1,
      createdAt: now,
      consentAt: now,
    };
    await customers.insertOne(customer);
    // insertOne מוסיף _id לאובייקט שהועבר — מחזירים עותק נקי
    return { ...customer };
  },

  async deleteCustomer(id) {
    const { customers } = await collections();
    await customers.deleteOne({ id });
  },

  async findCustomerByPhone(phone) {
    const { customers } = await collections();
    return stripId(await customers.findOne({ phone }));
  },

  async findCustomerById(id) {
    const { customers } = await collections();
    return stripId(await customers.findOne({ id }));
  },

  async updateCustomer(id, changes) {
    const { customers } = await collections();
    const updated = await customers.findOneAndUpdate(
      { id },
      { $set: { name: changes.name, phone: changes.phone } },
      { returnDocument: "after" },
    );
    return stripId(updated);
  },

  async getSettings() {
    const { settings } = await collections();
    const doc = await settings.findOne({ _id: SETTINGS_ID });
    const { _id: _ignored, ...saved } = doc ?? {};
    // מיזוג עם ברירות המחדל — מכסה שדות שנוספו בגרסאות חדשות
    return { ...DEFAULT_SETTINGS, ...saved };
  },

  async saveSettings(s) {
    const { settings } = await collections();
    await settings.updateOne({ _id: SETTINGS_ID }, { $set: s }, { upsert: true });
  },
};
