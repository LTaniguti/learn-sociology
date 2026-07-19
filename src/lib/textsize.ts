// Reading text size — device-local, same rationale as progress.ts: on a
// statically hosted site there is nowhere else to put a preference.
//
// This module is the sole owner of its storage key and of the
// `data-textsize` attribute on <html>. Unknown stored values read as the
// default; nothing here ever throws.

const STORAGE_KEY = "learn-sociology:textsize:v1";

export const TEXTSIZE_EVENT = "learn-sociology:textsize";

export type TextSize = "sm" | "md" | "lg";

export const TEXT_SIZES: TextSize[] = ["sm", "md", "lg"];

const DEFAULT: TextSize = "md";

function isTextSize(value: unknown): value is TextSize {
  return value === "sm" || value === "md" || value === "lg";
}

export function getTextSize(): TextSize {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isTextSize(raw) ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setTextSize(size: TextSize): void {
  window.localStorage.setItem(STORAGE_KEY, size);
  applyTextSize(size);
  window.dispatchEvent(new Event(TEXTSIZE_EVENT));
}

// The attribute drives the CSS overrides (node-page.css). Applied on mount by
// the control; the static HTML ships without it, i.e. at the `md` default.
export function applyTextSize(size: TextSize): void {
  document.documentElement.setAttribute("data-textsize", size);
}
