import { getStore } from "@/lib/db";
import JoinFlow from "@/components/JoinFlow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { adminPassword: _hidden, ...settings } = await (await getStore()).getSettings();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* זוהר חם ברקע */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-tomato-500/20 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-cheese-400/10 blur-[120px]" />
      <span aria-hidden="true" className="anim-float pointer-events-none absolute top-16 left-8 select-none text-5xl opacity-10">
        🍕
      </span>
      <span aria-hidden="true" className="anim-float pointer-events-none absolute bottom-24 right-10 select-none text-6xl opacity-10 [animation-delay:1.5s]">
        🍕
      </span>

      <main className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-10 px-4 py-12">
        <header className="anim-fade-up text-center">
          <div className="relative mx-auto w-fit">
            <div aria-hidden="true" className="absolute inset-0 -m-3 rounded-full bg-cheese-400/20 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.logo} alt="" className="relative h-28 w-28 rounded-full object-cover shadow-2xl ring-4 ring-cheese-400/50" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight text-cream-50">מועדון הלקוחות</h1>
          <p className="mt-1 text-xl font-extrabold text-cheese-300">{settings.businessName}</p>
          <div className="mx-auto mt-5 w-fit rounded-full bg-cheese-400/15 px-6 py-2.5 font-bold text-cheese-300 ring-1 ring-cheese-400/30">
            🎁 {settings.discountPercent}% הנחה לחברי המועדון
          </div>
        </header>

        <div className="anim-fade-up w-full [animation-delay:0.15s]">
          <JoinFlow settings={settings} />
        </div>

        <footer className="text-center text-xs text-cream-200/35">
          מגישים אהבה ופיצה · {settings.businessName} 🍕 ·{" "}
          <a href="/menu" className="underline underline-offset-4 transition hover:text-cheese-300">
            התפריט הדיגיטלי
          </a>{" "}
          ·{" "}
          <a href="/admin" className="underline underline-offset-4 transition hover:text-cheese-300">
            כניסת צוות
          </a>
        </footer>
      </main>
    </div>
  );
}
