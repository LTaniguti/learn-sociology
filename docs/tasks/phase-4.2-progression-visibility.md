# Task Brief — Phase 4.2: Progression Visibility + the Derived-Completion Invariant

**Destination:** `docs/tasks/phase-4.2-progression-visibility.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 4.2 — make progress *felt*. Completion currently surfaces as a bare checkmark in the syllabus and nothing anywhere else; a learner's map looks identical at 0 and 40 lessons. This phase: (1) completed nodes read as complete in the **hierarchy and network canvases**, (2) the **course view's** completion treatment is upgraded from the bare check, (3) the completion model is pinned down as an **invariant** so future courses and disciplines are a manifest away, not a storage migration. Runs independently of 4.1 — disjoint files; either order.

**Sanctioned scope:** `HierarchyCanvas.tsx` + `hierarchy-canvas.css`, `NetworkCanvas.tsx` + `network-canvas.css` (node treatment + legend only — **layout, zoom, and edge logic untouched**), `Syllabus.tsx` / `LessonCheck.tsx` / `ProgressCount.tsx` / `course.css`, `src/lib/progress.ts` (additive derivation helper only — the storage shape and key are frozen), `docs/schema.md` (invariant note), `components.md`. Everything else: tripwire.

## Standing rules (inherited)

Tokens + hex grep; improvisations reported for `components.md`; determinism (progress overlay must not perturb layout — coordinates identical with and without progress); localStorage read only after mount so hydration never mismatches (the `LessonCheck` pattern); `prefers-reduced-motion` respected for anything that moves; environment quirks verbatim; queued-runner patience.

---

## Item 1 — Completed-node treatment in both canvases

### Mechanics

Both canvases are client components behind mount gates, so this is the established wiring, not new architecture: on mount, read completion via `lib/progress`, subscribe to `PROGRESS_EVENT`, hold a `Set<string>` of complete slugs in state, and add an `is-complete` class to matching pills. Zero layout consequence — this is paint only; the deterministic-fingerprint check must pass with progress present and absent.

### Treatment (the design decision)

- Use the existing **`--state-complete-*` token family** — it is defined in all three themes and already means "done" on prerequisite chips and the lesson check. Do **not** mint new tokens or a second green: one meaning, one family, every surface. Expected mapping: pill fill → `--state-complete-bg`, border → `--state-complete-border`, label → `--state-complete-text`; tune against each theme's canvas background and report if any theme needs its own adjustment (that is a theme-file finding to flag, not silently patch).
- **Colour never carries the meaning alone** — the house CVD rule from the edge work applies. Pair the tint with one small non-hue cue on the pill: a `--state-complete-mark` check glyph at the pill's leading edge (matching the syllabus check's vocabulary) or a corner dot. Pick one, use it identically on both canvases, record it in `components.md`.
- Interplay to verify explicitly: complete × non-published dash (both can be true; must remain distinguishable), complete × selected, complete × focus ring, complete pill on the amber lineage path. None of these may become ambiguous; screenshots in the report.
- **Legends** on both canvases gain a "completed" entry. Hierarchy view: completed state must also survive the collapsed/expanded transitions.
- The overlay is presentational: no completion filtering, no "hide completed", no counts on the canvases in this phase.

Commit: `Feature: completed nodes read as complete in hierarchy and network views (4.2)`

## Item 2 — Course view: completion that feels like something

The bare `✓` is the floor, not the ceiling. Upgrade, staying inside the restrained house register:

1. **Completed syllabus rows** get the state-complete treatment: row background tinted `--state-complete-bg`, title in `--state-complete-text`, with the check integrated at the row's leading edge in `--state-complete-mark` rather than appended as an afterthought. `LessonCheck` may be absorbed into the row treatment or remain as the glyph renderer — executor's call, reported.
2. **Per-module progress**: each module header gets a quiet "n of m" count and a thin fill bar — this is the existing `ProgressCount` track/fill pattern (course footer) scaled down and reused per module, not a new element. The course-level footer bar stays.
3. **The satisfying moment**: on mark-complete, the row transitions to its complete state and the module fill advances, both over `--transition-fast`. Under `prefers-reduced-motion`, states swap instantly. That is the entire animation budget — no confetti, no pulses; the reward register stays with gamification's future phase.
4. `MarkCompleteButton` itself: verify its completed state uses the same family; adjust only if it currently diverges.

Commit: `Feature: course view completion — tinted rows, per-module fill, marked moment (4.2)`

## Item 3 — The derived-completion invariant (the multi-discipline door)

The audit that motivates this: per-learner state is already stored **per node** (`learn-sociology:progress:v1`, flat slug → bool; 4.1's quiz key follows the same rule), node slugs are global IDs carrying `discipline/` tags, and course completion is **derived** — manifest ∩ progress — never stored. That shape is exactly what future courses and adjacent disciplines need: expansion = more manifests + more derivation, **zero storage migration**. The risk is a future phase storing a course-level or discipline-level "complete" flag and silently closing that door. So:

1. **Centralize the derivation.** Add to `lib/progress.ts` (additively — shape and key frozen) one rollup function, e.g. `completionFor(slugs: string[]): { done: number; total: number }`, and route the existing consumers (`ProgressCount`, Item 2's per-module counts, anything else found counting) through it. One derivation, every rollup — course, module, and, later, discipline (a discipline rollup is `completionFor(nodes tagged discipline/x)`, already expressible with zero new storage).
2. **Write the invariant down** where future phases will trip over it, in `docs/schema.md` under *Where Mode 1's course order lives*:
   > **Completion invariant.** Per-learner state is stored per **node**, never per course, module, or discipline. Every rollup — course %, module counts, a future discipline's progress — is *derived* at read time from a manifest (or tag query) intersected with node progress. A future phase adding courses or disciplines adds manifests and derivations; it must not add stored rollup state. Phases that violate this reopen a storage-migration problem this note exists to prevent.
3. **Do not build multi-course machinery now.** No `content/courses/` restructure, no course IDs in storage, no discipline rollup UI — "every field powers a feature" applies to infrastructure too. The invariant plus the centralized derivation *is* the future-proofing; the rest is a later phase's one-manifest edit.

Commit: `Refactor: single completion-rollup derivation + invariant recorded in schema (4.2)`

## Item 4 — Docs sync

- `components.md`: completed-pill treatment (tokens, the non-hue cue, state-interplay notes) for both canvases; course-view row/module-fill treatment; the animation budget and reduced-motion behaviour.
- `docs/schema.md`: the Item 3 invariant note (verbatim or tightened — meaning preserved).

Commit: `Docs: progression visibility treatments + completion invariant (4.2)`

---

## Explicitly deferred

Filtering or hiding completed nodes in any view; completion counts on the canvases; streaks, badges, or any reward beyond Item 2's transition; discipline rollup UI; multiple course manifests; any change to storage shapes or keys.

## Verification (the whole gate, in order)

1. `npm run lint:content` green; `npm run lint` clean; `npm run build` all pages.
2. Deterministic fingerprint on the network canvas identical with zero progress and with several nodes complete (paint only, never layout).
3. Manual, desktop + 390px, all three themes: mark a lesson complete → the syllabus row tints and the module fill advances with the transition (and instantly under forced `prefers-reduced-motion`); the same node reads complete on the hierarchy canvas and the network canvas without reload (`PROGRESS_EVENT` propagation); unmark → all three surfaces revert. Verify each state-interplay pair from Item 1 visually. Non-hue cue legible at fit zoom and 1:1.
4. Hydration: no mismatch warnings with progress present in localStorage before load (the pre-seeded case is the one that catches mount-gate mistakes).
5. Grep confirms no consumer counts completion outside the Item 3 rollup function.
6. Push, deploy green, live spot-check: complete a lesson on the phone, watch the network view reflect it.

## Report back

The chosen non-hue cue with screenshots of the interplay cases; any theme needing a `--state-complete-*` adjustment against canvas backgrounds (theme-file findings, flagged not patched); whether `LessonCheck` was absorbed or kept; consumers routed through the rollup function; confirmation the storage shape and key are untouched; improvisations for `components.md`.
