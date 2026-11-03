import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מועדון הלקוחות | מיקניק פיצה",
  description: "מועדון הלקוחות של מיקניק — הצטרפו וקבלו הנחה קבועה על כל הזמנה 🍕",
};

export const viewport: Viewport = {
  themeColor: "#1b120c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
