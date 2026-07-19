"use client";

import { useEffect, useRef, useState } from "react";
import { getTheme, setTheme, THEMES, type Theme } from "@/lib/theme";

// Top-bar theme switcher (Step 3.1). Site chrome, not content: it sits at the
// far right of the shell and never moves with the tab group.
//
// themes.md names the three characters "Open Commons", "Midnight Draft" and
// "Light" — too long for a 58px bar beside the search pill, so the brief's
// fallback labels are used.
const LABELS: Record<Theme, string> = {
  default: "Dark",
  midnight: "Midnight",
  light: "Light",
};

const NAMES: Record<Theme, string> = {
  default: "Open Commons dark theme",
  midnight: "Midnight Draft theme",
  light: "Light theme",
};

export default function ThemeControl() {
  const [theme, setThemeState] = useState<Theme>("default");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Mount-time read of device-local state, same pattern as TextSizeControl:
    // the static HTML must render the default so hydration agrees. The boot
    // script in layout.tsx has already painted the right theme by now — this
    // read only syncs the control's own highlight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(getTheme());
  }, []);

  const choose = (next: Theme) => {
    setThemeState(next);
    setTheme(next);
  };

  // Arrow keys move within the radiogroup and take the selection with them
  // (standard radiogroup behaviour — roving focus, selection follows focus).
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = (index + delta + THEMES.length) % THEMES.length;
    choose(THEMES[next]);
    refs.current[next]?.focus();
  };

  return (
    <div className="themectl" role="radiogroup" aria-label="Colour theme">
      {THEMES.map((option, index) => {
        const active = option === theme;
        return (
          <button
            key={option}
            type="button"
            ref={(el) => {
              refs.current[index] = el;
            }}
            className={active ? "themectl-seg themectl-seg-active" : "themectl-seg"}
            role="radio"
            aria-checked={active}
            aria-label={NAMES[option]}
            // Roving tabindex: the group is one tab stop, arrows move inside.
            tabIndex={active ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => choose(option)}
          >
            {LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
