"use client";

import { useEffect, useState } from "react";
import {
  applyTextSize,
  getTextSize,
  setTextSize,
  TEXT_SIZES,
  type TextSize,
} from "@/lib/textsize";

// Article chrome, not content structure (Step 2.10). Scales reading
// typography only — mono metadata, sidebar and tabs never move.

const LABELS: Record<TextSize, string> = { sm: "A−", md: "A", lg: "A+" };
const NAMES: Record<TextSize, string> = {
  sm: "Small text",
  md: "Default text",
  lg: "Large text",
};

export default function TextSizeControl() {
  const [size, setSize] = useState<TextSize>("md");

  useEffect(() => {
    // Mount-time read of device-local state, same pattern as progress.ts
    // consumers: the static HTML must render the default so hydration agrees.
    const stored = getTextSize();
    // localStorage is only readable client-side; this mount-only read is how a
    // device-local preference reaches a static export, and the re-render is
    // intentional (same justification as the 2.6 hash read).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSize(stored);
    applyTextSize(stored);
  }, []);

  return (
    <div className="textsize" role="group" aria-label="Reading text size">
      {TEXT_SIZES.map((step) => (
        <button
          key={step}
          type="button"
          className={
            step === size ? "textsize-step textsize-step-active" : "textsize-step"
          }
          aria-pressed={step === size}
          aria-label={NAMES[step]}
          onClick={() => {
            setSize(step);
            setTextSize(step);
          }}
        >
          {LABELS[step]}
        </button>
      ))}
    </div>
  );
}
