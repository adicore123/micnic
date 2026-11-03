"use client";

import WhatsAppIcon from "./WhatsAppIcon";

type Props = {
  href: string;
  label: string;
  sub?: string;
  /** lg = הכפתור הגדול והמרכזי, sm = אייקון עגול קטן לטבלאות */
  size?: "sm" | "lg";
  className?: string;
};

export default function WhatsAppButton({ href, label, sub, size = "lg", className = "" }: Props) {
  if (size === "sm") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        aria-label={label}
        className={`inline-flex shrink-0 rounded-full transition-transform duration-150 hover:scale-110 active:scale-95 ${className}`}
      >
        <WhatsAppIcon size={34} />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-wa wa-pulse inline-flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#58E07F] via-[#25D366] to-[#1BA94C] px-6 py-4 text-white shadow-xl shadow-emerald-600/40 ${className}`}
    >
      <WhatsAppIcon size={40} plain />
      <span className="relative z-10 flex flex-col items-start">
        <span className="text-lg font-extrabold leading-snug">{label}</span>
        {sub ? <span className="text-sm text-white/85">{sub}</span> : null}
      </span>
    </a>
  );
}
