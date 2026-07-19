// Theme selection — device-local, same rationale as progress.ts and
// textsize.ts: on a statically hosted site there is nowhere else to put a
// preference.
//
// This module is the sole owner of its storage key and of the `data-theme`
// attribute on <html>. The default (Open Commons dark) is represented by the
// *absence* of the attribute, so unknown or missing stored values simply read
// as "default" and nothing here ever throws.
//
// Deliberately no prefers-color-scheme handling: the default is the default
// regardless of OS setting (product decision, Step 3.1).

const STORAGE_KEY = "learn-sociology:theme:v1";

export const THEME_EVENT = "learn-sociology:themechange";

// "default" is the shipped dark; it is not a stored attribute value.
export type Theme = "default" | "midnight" | "light";

export const THEMES: Theme[] = ["default", "midnight", "light"];

const DEFAULT: Theme = "default";

function isTheme(value: unknown): value is Theme {
  return value === "default" || value === "midnight" || value === "light";
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(raw) ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setTheme(theme: Theme): void {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

// The attribute drives the token overrides (docs/design/theme-*.css). The
// default removes it rather than writing a third value, keeping the shipped
// static HTML — which has no attribute — identical to the default state.
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "default") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}
