export type Customer = {
  id: string;
  name: string;
  /** טלפון מנורמל בפורמט 05XXXXXXXX */
  phone: string;
  cardNumber: number;
  createdAt: string;
};

export type NewCustomer = { name: string; phone: string };

export type Settings = {
  businessName: string;
  /** נתיב קובץ (/logo.svg) או data URL של תמונה שהועלתה */
  logo: string;
  discountPercent: number;
  /** תבנית הודעת הוואטסאפ — תומך ב-{name}, {business}, {discount} */
  messageTemplate: string;
  /** תבנית הזמנה למועדון ללקוחות פוטנציאליים — תומך ב-{business}, {discount}, {link} */
  inviteTemplate: string;
  /** טלפון העסק לצ'אט הצטרפות עצמאית, בפורמט 05XXXXXXXX או ריק */
  businessPhone: string;
  adminPassword: string;
};

/** הגדרות שמותר לחשוף ללקוח (בלי הסיסמה) */
export type PublicSettings = Omit<Settings, "adminPassword">;

export interface Store {
  listCustomers(): Promise<Customer[]>;
  addCustomer(input: NewCustomer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  findCustomerByPhone(phone: string): Promise<Customer | null>;
  findCustomerById(id: string): Promise<Customer | null>;
  updateCustomer(id: string, changes: NewCustomer): Promise<Customer | null>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
