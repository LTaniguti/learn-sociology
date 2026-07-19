// Mode 1 progress storage — resolves wireframe open question 3: on a
// statically hosted site, progress lives in browser localStorage, device-local
// by design (accounts and the verification system are later phases).
//
// This module is the sole owner of the storage shape. No other file may touch
// localStorage. Keys are the same content slugs the lint script validates;
// unknown keys found in storage are ignored, never thrown on.

const STORAGE_KEY = "learn-sociology:progress:v1";

// Client components listen for this on `window` to re-read progress after any
// write, so a mark-complete click updates every checkmark without a reload.
export const PROGRESS_EVENT = "learn-sociology:progress";

type ProgressMap = Record<string, boolean>;

export function getProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ProgressMap;
  } catch {
    // Corrupt storage reads as zero progress; it gets rewritten on next toggle.
    return {};
  }
}

export function isComplete(slug: string): boolean {
  return getProgress()[slug] === true;
}

export function setComplete(slug: string, complete: boolean): void {
  const progress = getProgress();
  if (complete) {
    progress[slug] = true;
  } else {
    delete progress[slug];
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function countComplete(slugs: string[]): number {
  const progress = getProgress();
  return slugs.filter((slug) => progress[slug] === true).length;
}
