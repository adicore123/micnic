"use client";

import { useState } from "react";
import JoinForm, { type JoinResult } from "./JoinForm";
import SuccessView from "./SuccessView";
import type { PublicSettings } from "@/lib/db/types";

/** הזרימה הציבורית בעמוד הבית: טופס ← מסך הצלחה עם הכרטיס וההודעה */
export default function JoinFlow({ settings }: { settings: PublicSettings }) {
  const [result, setResult] = useState<JoinResult | null>(null);

  return result ? (
    <div className="w-full">
      <SuccessView result={result} settings={settings} mode="self" onReset={() => setResult(null)} resetLabel="רישום אדם נוסף" />
    </div>
  ) : (
    <JoinForm onDone={setResult} />
  );
}
