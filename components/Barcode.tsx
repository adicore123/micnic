"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type Props = {
  value: string;
  lineColor?: string;
  height?: number;
  barWidth?: number;
  className?: string;
};

/** ברקוד Code128 מרונדר כ-SVG מסוגנן בצבעי המותג */
export default function Barcode({ value, lineColor = "#FCF7EE", height = 44, barWidth = 2, className }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    JsBarcode(ref.current, value, {
      format: "CODE128",
      lineColor,
      height,
      width: barWidth,
      displayValue: false,
      margin: 0,
      background: "transparent",
    });
  }, [value, lineColor, height, barWidth]);

  return <svg ref={ref} className={className} role="img" aria-label={`ברקוד ${value}`} />;
}
