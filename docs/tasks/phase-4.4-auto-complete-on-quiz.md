# Task Brief — Phase 4.4: Auto-Completion on Mastery — Two-Mode Lessons

**Destination:** `docs/tasks/phase-4.4-auto-complete-on-quiz.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 4.4 — owner-directed refinement of the 4.3 gate. Lessons now run in one of **two modes**:

- **Manual mode** (no published quiz — currently 52 of 53): `MarkCompleteButton` exactly as today; the learner marks and unmarks freely.
- **Mastery mode** (published quiz): the manual button is **removed entirely**. Completion is driven by the quiz — the moment every `choice` question is answered correctly, the lesson **auto-marks complete**. The learner cannot mark or unmark by hand.

**Doctrine note (third revision, record it):** 4.1 said the quiz never gates; 4.3 made it gate but kept completion a deliberate click; 4.4 makes completion **derived from mastery** for published-quiz lessons. Owner decision. For manual-mode lessons the deliberate-act doctrine still holds unchanged. Update the docs trail so all three states are legible in order.

**Consequence the owner has accepted — state it plainly in the docs:** with sticky-correct (4.3), a mastery-mode completion is **effectively permanent** — the quiz cannot regress and there is no unmark control. The only future escape hatch is the deferred quiz reset/re-take feature; do not improvise one here.

**Unchanged, absolutely:** storage invariant — no new keys, no shape changes, no stored "finished" flag. Auto-marking **writes through the existing `lib/progress` public setter** (completion stays readable from one store by `completionFor`, both canvases, and the syllabus with zero changes to any of them). `progress.ts` itself: no diff.

**Sanctioned scope:** `SelfCheck.tsx` (+ CSS), `CourseView.tsx` / the lesson host (conditional render of button vs. status line), `MarkCompleteButton.tsx` (only if its removal path needs a touch), copy strings, docs sync. Canvases, `progress.ts`, `quiz-progress.ts` storage, linter, content: **untouched** — tripwire.

## Standing rules (inherited)

Tokens + hex grep; improvisations reported; determinism (paint only — fingerprint check stands); post-mount localStorage reads, no hydration mismatch; `prefers-reduced-motion`; environment quirks verbatim (the Node 20→24 annotation is known and pre-existing); queued-runner patience.

---

## Item 1 — The mastery invariant and its two triggers

The rule, stated as an invariant: **for a published-quiz lesson, `isQuizFinished` ⇒ marked complete.** Enforced at two points in `SelfCheck`:

1. **The flip:** when the final `choice` question goes correct (finished transitions false→true), call the existing `lib/progress` setter for the slug. `PROGRESS_EVENT` then propagates as it always has — the syllabus row tints, module fill advances, both canvases seal, all in-frame with no reload. Idempotent: marking an already-complete slug is a no-op.
2. **Mount reconciliation:** on mount (post-hydration, the established pattern), if finished but not marked, mark. This heals every historical hole — a 4.3-era learner who finished but never clicked, or finished-then-unmarked — so the invariant holds unconditionally, not just for interactions that happen after deploy.

Notes to record:

- `SelfCheck` renders on **both hosts**, so mastery completion now works from the node page too — a graph-arrival learner can complete a lesson without opening the course view. This is new (the button lived only in the course view) and intended; add it to `components.md`.
- **Grandfathering is one-directional:** a lesson manually completed before its quiz was published stays complete — publishing content never retroactively unmarks anyone. (`reconcile` only writes completion, never removes it.) The quiz UI simply shows its own answered/unanswered state independently.
- Reflect-only quizzes (`choiceCount === 0`): finished is vacuously true — such a lesson would auto-complete on mount. That is almost certainly wrong; **a reflect-only published quiz keeps the lesson in manual mode** (button stays). Record the rule; the linter need not change (no such file exists yet — if one appears, this rule governs).

Commit: `Feature: mastery-mode lessons auto-complete on all-correct — flip + mount reconciliation (4.4)`

## Item 2 — The two-mode lesson host

- The lesson host (course view; the node page has no button today and gains none) branches on `hasPublishedQuiz` **and** the reflect-only exception:
  - **Manual mode:** `MarkCompleteButton` exactly as shipped in 4.3, minus the 4.3 lock (the lock is obsolete — a manual-mode lesson by definition has no published quiz to lock on). Strip the dead locked-state path and its caption from the button; report what was removed.
  - **Mastery mode:** no button. In its place a **status line**, same position, house register:
    - Not yet finished: *"Complete the self-check below to finish this lesson."* — caption vocabulary, not a banner, not a disabled button (a control that can never be clicked is not a control).
    - Finished: the completion seal + *"Lesson complete."* in `--state-complete-label`/`-text` vocabulary. Transition between the two over `--transition-fast`; instant under reduced motion.
- The `SelfCheck` summary line updates its 4.3 copy: "…you can mark this lesson complete" is now wrong in mastery mode — on the final correct it should read as the completion moment (e.g. *"3 of 3 — lesson complete."*). Keep it text; the animation budget from 4.2 still stands (row tint + fill advance are the celebration).
- Verify precedence interplay: the aria-current ● vs. seal rule from 4.2/4.3 is unchanged on the syllabus.

Commit: `Feature: two-mode lesson host — button for manual, status line for mastery (4.4)`

## Item 3 — Docs sync

- `components.md`: SelfCheck + lesson-host sections rewritten — the two modes, the mastery invariant with both triggers, node-page completion as a new capability, one-directional grandfathering, the reflect-only exception, the permanence consequence, the removed lock path.
- `docs/quiz-schema.md`: v1.1 trail gains the 4.4 entry — the three-state doctrine history (informs → gates-with-click → derived), one line each.
- `CONTRIBUTING.md`: update the 4.3 sentence — publishing a quiz now makes mastery of it *the* completion mechanism for that lesson; publish deliberately.
- The 4.3 brief's echo: annotate its "unlock, never auto-mark" as superseded by 4.4 (same convention used when 4.3 annotated 4.1).

Commit: `Docs: mastery-mode doctrine — the two-mode model and its history (4.4)`

---

## Explicitly deferred (unchanged)

Quiz reset/re-take (now the *only* path to un-completing a mastery-mode lesson — say so in its entry), multi-select/true-false, shuffling, attempt history / spaced repetition, cross-node decks, points/streaks/badges, server/account anything, completing the placeholders.

## Verification (the whole gate, in order)

1. `npm run lint:content` green; `npm run lint` clean; `npm run build` all pages.
2. Canvas fingerprint identical with and without progress.
3. Manual, desktop + 390px, all three themes:
   - **Mastery flow (course view):** fresh state on `sociological-imagination` → status line shows the pre-finish caption, no button anywhere → answer to all-correct → in the same frame: summary reads the completion copy, status line flips to seal + "Lesson complete.", syllabus row tints, module fill advances, both canvases seal — no reload, no click.
   - **Mastery flow (node page):** clear state → finish the quiz on `/node/sociological-imagination` → course view and canvases show complete on next visit (and live if open — `PROGRESS_EVENT` crosses components, verify within one page at minimum).
   - **Reconciliation:** pre-seed quiz-finished-but-unmarked in localStorage → load the lesson → auto-marks on mount, no hydration warning.
   - **Grandfather:** pre-seed marked-complete with an unfinished quiz → stays complete; quiz shows unanswered; nothing unmarks.
   - **Manual mode:** any other lesson — button present, marks and unmarks exactly as before, no caption, no dead lock state.
   - **Permanence:** on a mastered lesson, confirm no UI path unmarks it.
4. No hydration warnings with both stores pre-seeded.
5. Grep: no new keys, no writes to progress outside the `lib/progress` setter, no stored finished flag, `progress.ts` diff empty.
6. Push, deploy green, live phone spot-check: full mastery flow on the deployed site from a clean browser profile.

## Report back

The flip + reconciliation implementation points; what the dead-lock removal deleted from `MarkCompleteButton`; the status-line copy as shipped; confirmation of the reflect-only rule's placement; the docs-trail entries verbatim; zero-storage confirmation; deferred list untouched with the reset/re-take entry updated; any improvisations.
