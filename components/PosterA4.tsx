"use client";

import { useEffect, useState } from "react";
import StyledQr from "./StyledQr";
import { toGrayscaleDataUrl } from "@/lib/image";
import type { PublicSettings } from "@/lib/db/types";

/**
 * פריסת פוסטר בגודל עמוד A4 אמיתי (210×297mm) — מידות פיזיות להדפסה מושלמת.
 * מוצג רק בהדפסה; גרסת mono = שחור-לבן עם מסגרת קלאסית, גרסת הצבע = עמוד כהה יוקרתי.
 */
export default function PosterA4({
  settings,
  link,
  menuLink,
  mono = false,
}: {
  settings: PublicSettings;
  link: string;
  menuLink: string;
  mono?: boolean;
}) {
  const [logo, setLogo] = useState(settings.logo);

  useEffect(() => {
    let alive = true;
    if (mono) {
      void toGrayscaleDataUrl(settings.logo).then((gray) => {
        if (alive) setLogo(gray);
      });
    }
    return () => {
      alive = false;
    };
  }, [settings.logo, mono]);

  return (
    <div
      dir="rtl"
      style={{ width: "210mm", height: "296mm" }}
      className={mono ? "bg-white text-black" : "bg-crust-950 text-cream-50"}
    >
      <div
        className={`flex h-full w-full flex-col items-center justify-between ${
          mono ? "m-[8mm] border-[0.9mm] border-black p-[8mm]" : "p-[14mm]"
        }`}
      >
        {/* כותרת — הלוגו במרכז הבמה */}
        <div className="flex flex-col items-center pt-[6mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt=""
            style={{ width: "52mm", height: "52mm" }}
            className={`rounded-full object-cover ${
              mono ? "grayscale border-[0.9mm] border-black" : "shadow-2xl ring-[0.9mm] ring-cheese-400/60"
            }`}
          />
          <h1 style={{ fontSize: "40pt", lineHeight: 1.15 }} className="mt-[8mm] text-center font-extrabold">
            {settings.businessName}
          </h1>
          <p style={{ fontSize: "22pt" }} className="mt-[2.5mm] font-bold opacity-80">
            מועדון הלקוחות
          </p>
          {mono && (
            <div aria-hidden="true" className="mt-[6mm] w-[72mm]">
              <div className="border-t-[1mm] border-black" />
              <div className="mt-[1.4mm] border-t-[0.3mm] border-black" />
            </div>
          )}
        </div>

        {/* שני קודי QR זה לצד זה — הצטרפות למועדון + התפריט (קנבס 850px, ~240 DPI) */}
        <div className="flex w-full items-start justify-center gap-[10mm]">
          <div className="flex flex-col items-center">
            <StyledQr data={link} logo={logo} size={850} displaySize="70mm" mono={mono} />
            <p
              style={{ fontSize: "15pt" }}
              className={`mt-[3.5mm] font-extrabold ${mono ? "text-black" : "text-cheese-300"}`}
            >
              🎁 הצטרפות למועדון
            </p>
            <p style={{ fontSize: "10.5pt" }} className="font-semibold opacity-60">
              {settings.discountPercent}% הנחה לחברים
            </p>
          </div>
          <div className="flex flex-col items-center">
            <StyledQr data={menuLink} logo={logo} size={850} displaySize="70mm" mono={mono} />
            <p
              style={{ fontSize: "15pt" }}
              className={`mt-[3.5mm] font-extrabold ${mono ? "text-black" : "text-cheese-300"}`}
            >
              🍕 התפריט שלנו
            </p>
            <p style={{ fontSize: "10.5pt" }} className="font-semibold opacity-60">
              צפייה והזמנה מהטלפון
            </p>
          </div>
        </div>

        {/* תחתית — קריאה לפעולה והנחה */}
        <div className="flex flex-col items-center pb-[4mm]">
          <p style={{ fontSize: "30pt" }} className="font-extrabold">
            סרקו והזמינו עכשיו
          </p>
          <div
            style={{ fontSize: "24pt" }}
            className={`mt-[5mm] rounded-[3mm] px-[13mm] py-[4mm] font-extrabold ${
              mono
                ? "border-[0.6mm] border-black"
                : "bg-cheese-400/15 text-cheese-300 ring-[0.35mm] ring-cheese-400/50"
            }`}
          >
            {settings.discountPercent}% הנחה לחברי המועדון
          </div>
          <p style={{ fontSize: "14pt" }} className="mt-[4mm] font-semibold opacity-60">
            ההצטרפות חינם · לוקחת 10 שניות
          </p>
        </div>
      </div>
    </div>
  );
}
