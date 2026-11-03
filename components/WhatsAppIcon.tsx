"use client";

import { useId } from "react";

type Props = {
  size?: number;
  /** plain = רק הגליף ללא עיגול רקע — לשימוש בתוך כפתור ירוק */
  plain?: boolean;
  className?: string;
};

/** אייקון וואטסאפ מקורי — עיגול בגרדיאנט ירוק, בועת צ'אט לבנה ושפורפפת טלפון */
export default function WhatsAppIcon({ size = 28, plain = false, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const circleGrad = `${uid}-c`;
  const phoneGrad = `${uid}-p`;

  const defs = (
    <defs>
      <linearGradient id={circleGrad} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6BED93" />
        <stop offset="1" stopColor="#1BA94C" />
      </linearGradient>
      <linearGradient id={phoneGrad} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2FBE66" />
        <stop offset="1" stopColor="#12833F" />
      </linearGradient>
    </defs>
  );

  const bubble = (
    <path
      d="M32 15c-9.4 0-17 7-17 15.7 0 3.1.93 6 2.54 8.43L15 49l10.3-2.4c2.05.94 4.33 1.4 6.7 1.4 9.4 0 17-7 17-15.7S41.4 15 32 15z"
      fill="#fff"
    />
  );

  const phone = (
    <g transform="translate(19.7 18.2) scale(1.03)">
      <path
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
        fill={`url(#${phoneGrad})`}
      />
    </g>
  );

  if (plain) {
    return (
      <svg width={size} height={size} viewBox="13 13 38 38" className={className} aria-hidden="true">
        {defs}
        {bubble}
        {phone}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      {defs}
      <circle cx="32" cy="32" r="31" fill={`url(#${circleGrad})`} />
      <circle cx="32" cy="32" r="30" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.6" />
      <ellipse cx="23" cy="17" rx="15" ry="8.5" fill="#fff" opacity="0.13" transform="rotate(-28 23 17)" />
      {bubble}
      {phone}
    </svg>
  );
}
