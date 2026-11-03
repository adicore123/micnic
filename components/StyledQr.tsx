"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

type Props = {
  data: string;
  logo: string;
  size?: number;
  /** יחס גודל הלוגו במרכז הקוד (0-1) */
  logoRatio?: number;
  /** שחור-לבן טהור — מותאם להדפסה על מדפסות מונו */
  mono?: boolean;
  onReady?: (qr: QRCodeStyling) => void;
  className?: string;
};

/** קוד QR מעוצב — בגרסת הצבע: נקודות מעוגלות בגרדיאנט פחם-אדום; בגרסת mono: שחור חד על שקוף */
export default function StyledQr({ data, logo, size = 280, logoRatio = 0.42, mono = false, onReady, className }: Props) {
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
      dotsOptions: mono
        ? { type: "square", color: "#000000" }
        : {
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
      cornersSquareOptions: { type: mono ? "square" : "extra-rounded", color: "#000000" },
      cornersDotOptions: { type: mono ? "square" : "dot", color: mono ? "#000000" : "#E23B2E" },
      backgroundOptions: { color: "transparent" },
    });

    ref.current.innerHTML = "";
    qr.append(ref.current);
    onReady?.(qr);
    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [data, logo, size, logoRatio, mono, onReady]);

  return <div ref={ref} className={className} style={{ width: size, height: size }} />;
}
