import type { PublicSettings } from "./db/types";
import { toInternational } from "./phone";

type WithMessageVars = Pick<PublicSettings, "businessName" | "discountPercent">;

/** ממלא את המציינים {name} {business} {discount} בתבנית ההודעה */
export function renderMessage(template: string, name: string, settings: WithMessageVars): string {
  return template
    .replaceAll("{name}", name)
    .replaceAll("{business}", settings.businessName)
    .replaceAll("{discount}", String(settings.discountPercent));
}

/** קישור שפותח צ'אט וואטסאפ עם ההודעה מולאה מראש */
export function waLink(phone: string, message: string): string {
  return `https://wa.me/${toInternational(phone)}?text=${encodeURIComponent(message)}`;
}

/** ממלא את המציינים {business} {discount} {link} בתבנית ההזמנה */
export function renderInvite(template: string, settings: WithMessageVars, link: string): string {
  return template
    .replaceAll("{business}", settings.businessName)
    .replaceAll("{discount}", String(settings.discountPercent))
    .replaceAll("{link}", link);
}

/** ההודעה שלקוח שנרשם לבד שולח לעסק */
export function selfJoinMessage(businessName: string): string {
  return `היי ${businessName}! 🍕 הצטרפתי כרגע למועדון הלקוחות`;
}

/** כתובת התפריט הדיגיטלי */
export function menuUrl(origin: string): string {
  return `${origin}/menu`;
}

/** הודעת שליחת התפריט — עם שם הלקוח כשנשלחת ממודול הלקוחות */
export function menuMessage(businessName: string, link: string, customerName?: string): string {
  const greeting = customerName ? `היי ${customerName}!` : "היי!";
  return `${greeting} 🍕 התפריט הדיגיטלי של ${businessName} מחכה לכם — עיינו, בחרו והזמינו 👇\n${link}`;
}
