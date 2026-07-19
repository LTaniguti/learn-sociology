// Syllabus sidebar collapse — device-local, one key, mirroring progress.ts.
// Deliberately not part of progress.ts: a layout preference is a different
// concern from lesson completion and must not share its storage shape.

const STORAGE_KEY = "learn-sociology:syllabus-collapsed:v1";

export function getSyllabusCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSyllabusCollapsed(collapsed: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
}
