export type Customer = {
  id: string;
  name: string;
  /** טלפון מנורמל בפורמט 05XXXXXXXX */
  phone: string;
  cardNumber: number;
  createdAt: string;
  /** מועד אישור ההצטרפות של הלקוח (הסכמה מפורשת) */
  consentAt?: string;
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
  /** קוד כניסה למטבח הטבחים (4-6 ספרות) — ריק = מושבת */
  kitchenPin: string;
  adminPassword: string;
};

/** הגדרות שמותר לחשוף ללקוח (בלי הסיסמה ובלי קוד המטבח) */
export type PublicSettings = Omit<Settings, "adminPassword" | "kitchenPin">;

/** הוראות הכנה + תמונת המנה לפי מזהה */
export type RecipeEntry = { steps: string; image?: string };

export interface Store {
  listCustomers(): Promise<Customer[]>;
  addCustomer(input: NewCustomer): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  findCustomerByPhone(phone: string): Promise<Customer | null>;
  findCustomerById(id: string): Promise<Customer | null>;
  updateCustomer(id: string, changes: NewCustomer): Promise<Customer | null>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  /** הוראות הכנה ותמונות לפי מזהה מנה */
  getRecipes(): Promise<Record<string, RecipeEntry>>;
  /** עדכון חלקי — image: null מסיר את התמונה */
  saveRecipe(dishId: string, patch: { steps?: string; image?: string | null }): Promise<void>;
}
