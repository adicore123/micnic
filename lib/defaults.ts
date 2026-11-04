import type { Settings } from "./db/types";

export const DEFAULT_SETTINGS: Settings = {
  businessName: "מיקניק פיצה",
  logo: "/logo.svg",
  discountPercent: 10,
  messageTemplate: [
    "🍕 {business} — מועדון הלקוחות",
    "",
    "היי {name}! 🎉",
    "תודה שהצטרפת למועדון הלקוחות שלנו!",
    "",
    "מעכשיו מגיעה לך הנחה קבועה של {discount}% על כל הזמנה 🎁",
    "הצג את ההודעה הזו בקופה או פשוט תגיד שאתה חבר מועדון — וההנחה מופעלת מיד.",
    "",
    "נשמח לראותך בקרוב 🍕❤️",
  ].join("\n"),
  inviteTemplate: [
    "היי! 🍕 רוצים הנחה של {discount}% על כל הזמנה ב{business}?",
    "הצטרפו חינם למועדון הלקוחות שלנו ותקבלו הטבות ומבצעים לחברי המועדות 👇",
    "{link}",
  ].join("\n"),
  businessPhone: "",
  kitchenPin: "",
  adminPassword: "micnic2026",
};
