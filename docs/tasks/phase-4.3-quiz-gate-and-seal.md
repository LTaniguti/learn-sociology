# Task Brief — Phase 4.3: Quiz-Gated Completion, the Completion Seal, Sticky-Correct

**Destination:** `docs/tasks/phase-4.3-quiz-gate-and-seal.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 4.3 — three owner-directed tweaks closing out the quiz system's first pass: (1) node completion becomes **dependent on finishing the self-check** where a published quiz exists, (2) the completion checkmarks shipped in 4.2 are **redesigned** into a single drawn mark shared by every surface, (3) correctly-answered questions lose their retry affordance (**sticky-correct**).

**Doctrine reversal — record it as such:** 4.1 established "quiz results never auto-mark a lesson complete; the quiz informs, it does not gate," and listed quiz-gated completion as deferred. **The owner has deliberately reversed this.** The gate below is the new doctrine. Update `components.md` and the 4.1 brief's deferred-list echo accordingly — this is a decision, not scope drift, and a future phase must not "restore" the old rule.

**Unchanged doctrine:** completion remains the learner's deliberate act (the gate *unlocks* the button; it never auto-marks — Item 1), and the storage invariant holds absolutely: no new keys, no shape changes, the gate is **derived** from the two existing stores.

**Sanctioned scope:** `SelfCheck` + its CSS, `src/lib/quiz-progress.ts` (additive derivation helper only), `MarkCompleteButton.tsx`, `LessonCheck.tsx`, the mark rendering in `Syllabus`/`course.css` and both canvases' CSS/markup (**mark visuals only — canvas layout, zoom, edges, and the 4.2 progress wiring untouched**), a new shared mark component/asset, `lib/content.ts` (expose `hasPublishedQuiz` if `getQuiz` truthiness doesn't already serve), docs sync. Everything else: tripwire.

## Standing rules (inherited)

Tokens + hex grep; improvisations reported for `components.md`; determinism (layout coordinates identical — mark is paint only, fingerprint check with and without progress); post-mount localStorage reads (no hydration mismatch); `prefers-reduced-motion`; environment quirks verbatim; queued-runner patience.

---

## Item 1 — The conditional quiz gate

### The rule

- A lesson **with a published quiz**: `MarkCompleteButton` is locked until the quiz is finished. **Finished = every `choice` question's stored state is `correct: true`.** (`reflect` questions never gate — they are ungraded by design.) With Item 3's sticky-correct, finished is monotonic: once reached it cannot regress within the stored attempt.
- A lesson **without** a published quiz (currently 52 of 53): manual completion exactly as today. The gate strengthens node-by-node as the content phase publishes quizzes — zero future rework.
- **Unlock, never auto-mark.** Reaching finished enables the button live (via `QUIZ_EVENT`); the learner still clicks. Rationale recorded: completion stays a deliberate act, no lesson silently completes mid-quiz, and unmarking stays coherent.
- **Grandfathering:** a lesson already marked complete in storage stays complete and its button stays usable (for unmarking) regardless of quiz state. The gate governs the *act of marking*, not stored history.
- Unmarking is always allowed. Re-marking a grandfathered-then-unmarked lesson goes through the gate like anyone else — acceptable and simpler than tracking provenance; note it in `components.md`.

### Mechanics

- `quiz-progress.ts` gains one derivation, e.g. `isQuizFinished(slug, questionCount): boolean` — read-time, no stored rollup (the completion invariant applies to quiz state too).
- The course lesson page passes `hasPublishedQuiz` (server-known at build) into the button; the locked state renders the button disabled with a quiet one-line caption — suggested copy: *"Finish the self-check below to mark this lesson complete."* House register: a caption in `--state-*-label` vocabulary, not a warning banner.
- When the final question goes correct, the button enables in the same interaction frame (`QUIZ_EVENT` already fires on every write — verify ordering). The `SelfCheck` summary line may acknowledge it (e.g. "3 of 3 — you can mark this lesson complete"); keep it text, no celebration.
- Draft quizzes do not gate (they don't render — the loader filter from 4.1 already guarantees the client can't see them; the gate must key off the same loader, never off file existence).

Commit: `Feature: published quiz gates lesson completion — unlock, never auto-mark (4.3)`

## Item 2 — The completion seal (checkmark redesign)

### Diagnosis

The 4.2 marks are text `✓` glyphs (canvas corner stamp, syllabus leading check). A raw font character reads cheap against designed surfaces and renders inconsistently across platforms/font stacks. The concept (a non-hue completion cue — the CVD rule) is right; the glyph is the defect.

### Primary direction — one drawn seal, one source

- A single **drawn SVG mark**: a small disc filled `--state-complete-mark`, carrying a stroked check in the surface's background token (paper on the syllabus, canvas fill on the pills), **rounded caps and joins**, consistent check geometry at every size. A seal, not a character.
- **One source of truth**: a shared component (or a single symbol/def) consumed by all four surfaces — hierarchy pills, network pills, syllabus rows, and `MarkCompleteButton`'s completed state. "Done" gets exactly one face. Sized variants (canvas-stamp small, row-mark medium) scale the same geometry; report the sizes.
- Placement holds from 4.2 where it worked: top-trailing corner on canvas pills (the leading-edge collision with paradigm dot / collapse glyph stands), leading edge on syllabus rows.
- Re-verify the 4.2 interplay set with the new mark: complete × dashed non-published, × selected (amber wins fill, seal persists), × focus ring, × lineage path, and legibility at fit zoom and 1:1 in all three themes. The midnight faint-tint finding from 4.2 stands as flagged — the seal carrying the meaning there is by design; do not patch the token in this phase.
- `LessonCheck` remains the row glyph renderer (per 4.2's absorption decision) — it now renders the seal.

### Option B — fallback only

If the seal still reads poorly (screenshot evidence required), fall back to a **filled pip** (plain disc, no check) — the CVD rule demands *a* non-hue cue, not a check specifically. Take the seal first; Option B only on documented visual failure.

Commit: `Design: completion seal — one drawn mark across canvases, syllabus, and button (4.3)`

## Item 3 — Sticky-correct

- The "try again" affordance renders **only on incorrectly-answered questions**. A correct answer is terminal for the stored attempt: options disable, the `why` set stays readable, state persists as-is.
- Consequence to record in `components.md`: a learner cannot re-test a question already answered correctly. Intentional — re-take/reset belongs to the deferred spaced-repetition work and must not be improvised here as a "reset quiz" button.
- Verify with the gate: answer wrong → retry available; answer right → retry gone, state sticky across reload; final correct flips `isQuizFinished` and unlocks the button without reload.

Commit: `Fix: correct answers are terminal — retry only on misses (4.3)`

## Item 4 — Docs sync

- `components.md`: SelfCheck section rewritten — the gate rule (with the reversal note and its rationale), finished-definition, grandfathering, sticky-correct, the seal (geometry, sizes, per-surface backgrounds), locked-button treatment and copy.
- `docs/quiz-schema.md`: one line under the v1.1 findings — the no-gating rule was reversed by owner decision in 4.3 (schema itself unchanged; `status: published` is now also the gate trigger, worth naming).
- `CONTRIBUTING.md`: one sentence — publishing a quiz makes it required for that lesson's completion; publish deliberately.

Commit: `Docs: quiz gate doctrine, completion seal, sticky-correct (4.3)`

---

## Explicitly deferred (unchanged plus one addition)

Multi-select/true-false, shuffling, attempt history / spaced repetition, **quiz reset/re-take**, cross-node decks, points/streaks/badges, server/account anything, completing the placeholder quizzes.

## Verification (the whole gate, in order)

1. `npm run lint:content` green (content untouched — confirm no drift); `npm run lint` clean; `npm run build` all pages.
2. Canvas fingerprint identical with and without progress (seal is paint only).
3. Manual, desktop + 390px, all three themes:
   - Gated lesson (`sociological-imagination`): button locked with caption → answer one wrong (retry present, `why` revealed) → correct it (retry gone) → finish all → button enables in-frame without reload → mark complete → seal appears on the row, both canvases, and the button.
   - Ungated lesson: marks complete exactly as before, no caption, no gate.
   - Grandfathering: pre-seed a completed gated lesson in localStorage → still shows complete, button usable to unmark; re-marking requires the quiz.
   - Sticky-correct survives reload; `reflect` still stores nothing.
   - Seal interplay set (Item 2) screenshotted per theme; legibility at fit zoom and 1:1.
4. No hydration warnings with both stores pre-seeded before load.
5. Grep: no new localStorage keys, no changes to either `STORAGE_KEY`, no stored rollup or "finished" flag anywhere — `isQuizFinished` is derived at read.
6. Push, deploy green, live phone spot-check: run the full gated flow on the deployed site.

## Report back

Seal geometry and sizes with screenshots across the interplay set (or Option B with the failure evidence); the locked-button copy as shipped; confirmation the reversal is recorded in all three docs; `isQuizFinished` signature and its consumers; confirmation of zero storage changes and an untouched deferred list (including the new reset/re-take entry); any improvisations.
