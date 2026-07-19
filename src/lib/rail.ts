// Node-page right rail collapse — device-local, one key, mirroring
// syllabus.ts. Deliberately its own key rather than sharing the syllabus one:
// the two rails live on different frames and a reader who hides one has said
// nothing about the other.

const STORAGE_KEY = "learn-sociology:rail-collapsed:v1";

export function getRailCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRailCollapsed(collapsed: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
}
