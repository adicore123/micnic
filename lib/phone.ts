import { z } from "zod";

/** מנרמל כל פורמט טלפון ישראלי ל-05XXXXXXXX, או null אם לא תקין */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("972")) digits = `0${digits.slice(3)}`;
  return /^05\d{8}$/.test(digits) ? digits : null;
}

/** 05XXXXXXXX → 050-123-4567 לתצוגה */
export function displayPhone(phone: string): string {
  return phone.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
}

/** 05XXXXXXXX → 9725XXXXXXXX (לקישורי wa.me) */
export function toInternational(phone: string): string {
  return `972${phone.slice(1)}`;
}

export const PHONE_HINT = "לדוגמה: 050-1234567";

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizePhone(v) !== null, {
    message: `מספר הטלפון לא נראה תקין. ${PHONE_HINT}`,
  })
  .transform((v) => normalizePhone(v) as string);

export const joinSchema = z.object({
  name: z.string().trim().min(2, "השם קצר מדי (לפחות 2 תווים)").max(40, "השם ארוך מדי (עד 40 תווים)"),
  phone: phoneSchema,
});

/** יום הולדת בפורמט DD/MM — מנורמל עם אפסים מובילים */
export const birthdaySchema = z
  .string()
  .trim()
  .regex(/^\d{1,2}[\/.]\d{1,2}$/, "תאריך לידה לא תקין. לדוגמה: 25/03")
  .refine((v) => {
    const [d, m] = v.split(/[\D]/).map(Number);
    return m >= 1 && m <= 12 && d >= 1 && d <= 31;
  }, "תאריך לידה לא תקין. לדוגמה: 25/03")
  .transform((v) => {
    const [d, m] = v.split(/[\D]/).map((n) => Number(n).toString().padStart(2, "0"));
    return `${d}/${m}`;
  });

/** הצטרפות למועדון — מחייבת אישור מפורש של הלקוח */
export const joinWithConsentSchema = joinSchema
  .extend({ consent: z.boolean(), birthday: z.optional(z.union([z.literal(""), birthdaySchema])) })
  .refine((v) => v.consent === true, {
    message: "נדרש אישור ההצטרפות למועדון הלקוחות",
    path: ["consent"],
  });
