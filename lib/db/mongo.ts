import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { DEFAULT_SETTINGS } from "../defaults";
import type { Customer, NewCustomer, Settings, Store } from "./types";

type SettingsDoc = Settings & { _id: string };

const globalForMongo = globalThis as typeof globalThis & { __micnicMongo?: Promise<MongoClient> };

function client(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  globalForMongo.__micnicMongo ??= new MongoClient(uri).connect();
  return globalForMongo.__micnicMongo;
}

async function collections() {
  const db = (await client()).db("micnic");
  return {
    customers: db.collection<Customer>("customers"),
    settings: db.collection<SettingsDoc>("settings"),
  };
}

const SETTINGS_ID = "main";

export const mongoStore: Store = {
  async listCustomers() {
    const { customers } = await collections();
    return customers.find().sort({ createdAt: -1 }).toArray();
  },

  async addCustomer(input: NewCustomer) {
    const { customers } = await collections();
    const last = await customers.find().sort({ cardNumber: -1 }).limit(1).toArray();
    const customer: Customer = {
      id: randomUUID(),
      name: input.name,
      phone: input.phone,
      cardNumber: (last[0]?.cardNumber ?? 100) + 1,
      createdAt: new Date().toISOString(),
    };
    await customers.insertOne(customer);
    return customer;
  },

  async deleteCustomer(id) {
    const { customers } = await collections();
    await customers.deleteOne({ id });
  },

  async findCustomerByPhone(phone) {
    const { customers } = await collections();
    return customers.findOne({ phone });
  },

  async getSettings() {
    const { settings } = await collections();
    const doc = await settings.findOne({ _id: SETTINGS_ID });
    if (!doc) return { ...DEFAULT_SETTINGS };
    const { _id: _ignored, ...rest } = doc;
    return rest;
  },

  async saveSettings(s) {
    const { settings } = await collections();
    await settings.updateOne({ _id: SETTINGS_ID }, { $set: s }, { upsert: true });
  },
};
