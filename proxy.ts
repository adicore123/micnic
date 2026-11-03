import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * שומר על עורך התפריט — זמין לצוות בלבד.
 * הקובץ public/menu-editor.html הוא גרסת העריכה של התפריט; בלי חיבור צוות תקין
 * מבקרים מועברים למסך הכניסה. לקוחות מקבלים תמיד את הגרסה הנעולה ב-/menu.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("micnic_admin")?.value;
  // פורמט הטוקן: exp.fingerprint.signature — בדיקת נוכחות ותוקף זמני בלבד,
  // האימות המלא מול הסיסמה מתבצע בעמודי הניהול עצמם.
  const parts = token?.split(".");
  const isValidSession = Boolean(
    token && parts?.length === 3 && Number(parts[0]) > Date.now(),
  );

  if (!isValidSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/menu-editor.html",
};
