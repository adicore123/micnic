"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

type Props = {
  data: string;
  logo: string;
  size?: number;
  /** יחס גודל הלוגו במרכז הקוד (0-1) */
  logoRatio?: number;
  onReady?: (qr: QRCodeStyling) => void;
  className?: string;
};

/** קוד QR מעוצב במיוחד — נקודות מעוגלות בגרדיאנט פחם-אדום, לוגו העסק במרכז */
export default function StyledQr({ data, logo, size = 280, logoRatio = 0.42, onReady, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data) return;

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      data,
      image: logo || undefined,
      margin: 0,
      qrOptions: { errorCorrectionLevel: "H" },
      imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: logoRatio },
      dotsOptions: {
        type: "rounded",
        gradient: {
          type: "linear",
          rotation: Math.PI / 4,
          colorStops: [
            { offset: 0, color: "#26190F" },
            { offset: 1, color: "#C72F23" },
          ],
        },
      },
      cornersSquareOptions: { type: "extra-rounded", color: "#26190F" },
      cornersDotOptions: { type: "dot", color: "#E23B2E" },
      backgroundOptions: { color: "transparent" },
    });

    ref.current.innerHTML = "";
    qr.append(ref.current);
    onReady?.(qr);
    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [data, logo, size, logoRatio, onReady]);

  return <div ref={ref} className={className} style={{ width: size, height: size }} />;
}
