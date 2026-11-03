/**
 * מודול התפריט הדיגיטלי — עורך התפריט במסך מלא, לצוות בלבד.
 * העורך (menu-editor.html) מוגן ב-proxy; הלקוחות מקבלים אך ורק את
 * הגרסה הנעולה לצפייה ב-/menu — שם אין שום אפשרות עריכה.
 */
export const dynamic = "force-dynamic";

export default function MenuPage() {
  return (
    <div className="-mx-4 -my-6 flex h-dvh flex-col sm:-mx-6 sm:-my-8">
      <div className="no-print flex items-center gap-3 border-b border-crust-700/10 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-extrabold text-crust-900">עורך התפריט הדיגיטלי</h1>
        <span className="hidden rounded-full bg-basil-500/10 px-3 py-1 text-xs font-bold text-basil-600 sm:inline">
          לצוות בלבד · ללקוחות מוגשת גרסה נעולה לצפייה
        </span>
        <div className="ms-auto flex items-center gap-2">
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-crust-700/15 bg-white px-4 py-2 text-sm font-bold text-crust-800 shadow-sm transition hover:bg-cream-100"
          >
            👁️ צפייה כלקוח
          </a>
          <a
            href="/admin"
            className="rounded-xl bg-gradient-to-br from-tomato-400 to-tomato-600 px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-tomato-600/25 transition hover:brightness-110"
          >
            חזרה לניהול
          </a>
        </div>
      </div>

      <iframe
        src="/menu-editor.html"
        title="עורך התפריט"
        className="w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
