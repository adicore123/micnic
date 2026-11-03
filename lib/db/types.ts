export type Customer = {
  id: string;
  name: string;
  /** טלפון מנורמל בפורמט 05XXXXXXXX */
  phone: string;
  cardNumber: number;
  createdAt: string;
  /** מועד אישור ההצטרפות של הלקוח (הסכמה מפורשת) */
  consentAt?: string;
  /** נקודות (חותמות) בכרטיס המועדון */
  points?: number;
  /** מונה ביקורים/הזמנות */
  visits?: number;
  /** מועד הביקור האחרון */
  lastVisitAt?: string;
  /** יום הולדת בפורמט DD/MM */
  birthday?: string;
  /** תגיות כמו VIP, אלרגיה */
  tags?: string[];
  /** הערה חופשית לצוות */
  note?: string;
};

export type NewCustomer = { name: string; phone: string; birthday?: string };

export type CustomerChanges = { name: string; phone: string; birthday?: string; tags?: string[]; note?: string };

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
  /** יעד נקודות לפרס בכרטיס המועדון */
  stampGoal: number;
  /** תיאור הפרס */
  stampReward: string;
  /** הודעת יום הולדת — תומך ב-{name}, {business}, {reward} */
  birthdayTemplate: string;
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
  updateCustomer(id: string, changes: CustomerChanges): Promise<Customer | null>;
  /** חותמת — נקודה + ביקור ללקוח; מחזיר האם הושג יעד הפרס */
  stampCustomer(id: string): Promise<{ customer: Customer; rewardReady: boolean } | null>;
  /** מימוש הפרס — איפוס הנקודות */
  redeemReward(id: string): Promise<Customer | null>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
