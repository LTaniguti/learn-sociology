// Self-check quiz state (Phase 4.1). Sibling of progress.ts, same doctrine:
// this module is the SOLE owner of its storage shape, under its OWN key, with
// its OWN cross-component event. It never touches progress.ts or its key —
// answering a quiz question is a different concern from completing a lesson,
// and the two must not share storage. Quiz results NEVER auto-mark a lesson
// complete; completion stays the learner's manual act (MarkCompleteButton).
//
// Keys are node slugs — the same global IDs progress.ts uses — so all
// per-learner state is per-node and future courses/disciplines roll up from the
// same storage with no migration (the Phase 4.2 completion invariant).

const STORAGE_KEY = "learn-sociology:quiz:v1";

// Client components listen for this on `window` so a graded answer updates the
// per-quiz summary (and any other mounted SelfCheck) without a reload.
export const QUIZ_EVENT = "learn-sociology:quiz";

// Last attempt only in v1 — no history. Spaced repetition is a later phase and
// must not have data debt (an attempts array) designed for it prematurely.
export type QuizAnswer = { answered: number; correct: boolean };

// slug → question index → last attempt. reflect answers are NEVER stored.
type QuizMap = Record<string, Record<string, QuizAnswer>>;

function read(): QuizMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as QuizMap;
  } catch {
    // Corrupt storage reads as no answers; it gets rewritten on next attempt.
    return {};
  }
}

function write(map: QuizMap): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(QUIZ_EVENT));
}

// The stored attempt for one question, or null if unanswered.
export function getAnswer(slug: string, index: number): QuizAnswer | null {
  return read()[slug]?.[index] ?? null;
}

export function setAnswer(
  slug: string,
  index: number,
  answer: QuizAnswer
): void {
  const map = read();
  const forSlug = map[slug] ?? {};
  forSlug[index] = answer;
  map[slug] = forSlug;
  write(map);
}

// "Try again" for a single question — clears its stored attempt.
export function clearAnswer(slug: string, index: number): void {
  const map = read();
  const forSlug = map[slug];
  if (!forSlug || !(index in forSlug)) return;
  delete forSlug[index];
  if (Object.keys(forSlug).length === 0) delete map[slug];
  else map[slug] = forSlug;
  write(map);
}

// Derived-on-read score for a quiz: how many choice questions have a stored
// attempt, and how many of those were correct. The caller knows the total
// choice count; this only reports what is stored.
export function scoreFor(slug: string): { answered: number; correct: number } {
  const forSlug = read()[slug] ?? {};
  let answered = 0;
  let correct = 0;
  for (const key of Object.keys(forSlug)) {
    answered += 1;
    if (forSlug[key].correct) correct += 1;
  }
  return { answered, correct };
}
