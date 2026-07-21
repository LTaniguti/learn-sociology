# Task Brief — Phase 4.1: Self-Check Quiz System (Testing Q/A, v1) — Revised

**Destination:** `docs/tasks/phase-4.1-self-check-quizzes.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 4.1 — first learner-assessment feature. Each concept node may carry a **self-check quiz**: a small set of questions rendered below the lesson, graded client-side with immediate per-question feedback and explanations. Open-book by design — on a static export the answers ship in the bundle, and that is correct for this phase: this is *self-assessment*, not certification. Stakes, identity, and anti-cheat belong to the deferred verification-system phase; nothing in 4.1 may anticipate them.

**Revision note (v2 of this brief):** the priority is a **working framework**; quiz *content* is expected to lag by design. The seed set is therefore placeholder drafts plus exactly **two real quizzes** as schema stress-tests — the Stage 0 lesson applies (the node schema only reached v0.2 because it was tested against real nodes, not skeletons), and a `status` field keeps drafts off the live site.

**Sanctioned scope:** new `content/quizzes/` directory + seed quiz files, new `docs/quiz-schema.md`, new `src/lib/quiz-progress.ts`, new `SelfCheck` component (+ its CSS), the render hookups in `NodeArticle`'s two host pages, `scripts/lint-content.mjs` extension, `package.json` script if a separate lint entry is cleaner, docs sync (`components.md`, `CONTRIBUTING.md`, `schema.md` cross-reference). Node frontmatter, `course.yaml`, `progress.ts`, all canvases, themes: **untouched** — tripwire applies outside this set. (Progression-visibility work is Phase 4.2, a separate brief — do not reach into it.)

## Standing rules (inherited)

Tokens + hex grep (`public/giscus` exempt); improvisations reported for `components.md`; determinism (question and option order render exactly as authored — no shuffling anywhere in v1); localStorage read only after mount so hydration never mismatches (the `LessonCheck` pattern); environment quirks verbatim; queued-runner patience.

---

## Item 0 — Constitutional constraints this design answers (record, don't relitigate)

1. **Schema design principle 3:** the ten-field frontmatter budget is spent. Quizzes therefore live in **companion files**, not frontmatter — `content/quizzes/<slug>.yml`, where `<slug>` is the node's filename ID. "The filename is the ID" extends: a quiz belongs to exactly the node whose slug it bears. Quizzes are optional per node.
2. **Design principle 4:** a quiz file must make sense viewed raw on GitHub — plain YAML, prose-like prompts, no encoding tricks.
3. **Multi-perspective by design, at the question level:** **no question may grade a paradigm-contested claim as simply correct.** Contested content must either carry paradigm attribution in the prompt ("According to conflict theory, …" — structurally, via the `paradigm:` field) or be posed as an ungraded `reflect` question. This is the quiz-level counterpart of the body's `## Perspectives` heading. The linter cannot verify it mechanically; it is an authoring rule enforced editorially (Item 1's checklist) and at review.
4. **`progress.ts` is the sole owner of its storage shape.** Quiz state gets its own module and key. **Quiz results never auto-mark a lesson complete** — completion remains the learner's manual act (`MarkCompleteButton`); the quiz informs, it does not gate. **[Partially reversed in 4.3 by owner decision:** a published quiz now **gates** completion in course mode — but only by *unlocking* `MarkCompleteButton`; it still never *auto-marks*, and quiz state still has its own module/key (the gate is derived, no storage change). The storage-ownership half of this constraint stands; the "does not gate" half was deliberately overturned. See `phase-4.3-quiz-gate-and-seal.md`.**]**

## Item 1 — Quiz schema (`docs/quiz-schema.md` + the format itself)

File: `content/quizzes/<slug>.yml`.

```yaml
version: 1
status: draft             # draft | published — only published quizzes render (see Item 2)
adapted_from: "OpenStax Introduction to Sociology 3e, Section 1.1 review"   # when applicable, same convention as node frontmatter
questions:
  - type: choice            # single-correct multiple choice
    prompt: >-
      According to Mills, the sociological imagination connects which two things?
    paradigm: null          # or functionalism | conflict-theory | symbolic-interactionism — REQUIRED when the graded claim is paradigm-specific
    options:
      - text: Personal troubles and public issues
        correct: true
        why: >-
          Mills's core move: biography meets history — private experience read
          against social structure.
      - text: Quantitative and qualitative methods
        correct: false
        why: >-
          A real distinction in research design, but it is methodological, not
          Mills's pairing.
      - text: In-groups and out-groups
        correct: false
        why: >-
          Group-boundary language belongs to Sumner's group concepts, a
          different lineage.
  - type: reflect           # ungraded free-response prompt; no options, no correct answer
    prompt: >-
      Pick one personal routine and trace it to a social structure. Where does
      your biography meet history?
```

Rules (these are the linter's spec — Item 3):

- `version: 1` required; unknown versions are a lint error (forward-compat discipline from day one).
- `status: draft | published` required. The status vocabulary is deliberately a **subset** of the node status ladder (`stub`/`review` have no meaning for a quiz); the semantics match — `draft` is honest work-in-progress, `published` is learner-ready.
- `questions`: 1–8 entries. Two types in v1: `choice`, `reflect`. Multi-select, true/false, ordering: **not in v1** — true/false is explicitly rejected (it is where contested claims sneak in as facts).
- `choice`: 3–5 options; **exactly one** `correct: true`; **every option carries `why`** — the distractor rationale is where the teaching happens, and it is not optional. `paradigm` present (may be `null`); when non-null it must be one of the three paradigm slugs and the prompt should carry the attribution in prose too.
- `reflect`: `prompt` only. Rendered with a free-text box whose content is **never stored or transmitted** — it is a thinking surface; note this in the UI copy.
- `adapted_from` optional at file level, same string format as node frontmatter — OpenStax's section reviews are CC BY 4.0 and may be adapted with attribution, exactly like lesson prose.
- Unknown keys at any level: lint error (the 3.5 allowlist discipline, applied to a second file family).
- **Placeholder convention:** a placeholder is a valid `status: draft` file with one schema-complete `choice` question whose prompt begins `PLACEHOLDER —` and one `reflect`. It must pass the full linter — placeholders exercise the pipeline, they do not get a pass from it.
- Authoring checklist in `docs/quiz-schema.md` (editorial, mirrors the linter where it can't reach): contested-claim rule; distractors must be plausible misconceptions, not jokes; `why` explains, never just restates; prompts self-contained (a learner arriving from a graph click may not have read the whole lesson).

Commit: `Docs: quiz schema v1 — companion files, choice + reflect, status, paradigm attribution (4.1)`

## Item 2 — `SelfCheck` component + quiz progress storage

### Storage — `src/lib/quiz-progress.ts`

- Sibling of `progress.ts`, same doctrine verbatim: sole owner of its shape, key `learn-sociology:quiz:v1`, corrupt reads as empty, its own `QUIZ_EVENT` for cross-component updates.
- Shape: per node slug, per question index → `{ answered: optionIndex, correct: boolean }`, plus a derived-on-read score. Store last attempt only in v1 (no history — spaced repetition is a later phase and must not have data debt designed for it prematurely).
- Keys are **node slugs** — the same global IDs `progress.ts` uses. This matters for Phase 4.2's derivation invariant: all per-learner state is per-node, so future courses and disciplines roll up from the same storage with no migration.
- `reflect` answers are **not stored** (Item 1). Nothing here touches `progress.ts` or its key.

### Component — `SelfCheck`

- Client component rendered below the lesson body on **both** hosts of `NodeArticle` — `/node/[slug]` and the course lesson view — so Mode 1 and graph-arrival learners get the same surface. Quiz data is server-loaded at build (a `getQuiz(slug)` in `lib/content.ts` or a sibling module — report the placement) and passed down; no client fetching on a static export.
- **Only `status: published` quizzes render.** No quiz file, or a `draft` quiz → no section, no placeholder UI. The filter belongs in the server loader, not the component — draft quiz content should not ship in the page payload at all. A quiz for a `stub` node is a lint error (Item 3), so that case cannot ship.
- Interaction, per `choice` question: options are real buttons (keyboard reachable, focus-visible per house tokens); selecting one grades immediately — the chosen option marks correct/incorrect, the correct one is revealed, and **every option's `why` becomes readable** (the wrong-answer rationales are content, not secrets). A "try again" affordance resets that question. Answered state persists via `quiz-progress` and rehydrates after mount (the `LessonCheck` no-mismatch pattern).
- Per `reflect`: prompt + plain textarea + the not-stored notice. No grading UI.
- A quiet per-quiz summary line ("3 of 4") once all `choice` questions are answered. **No confetti, no badges, no gating** — gamification is a separate roadmap item and must not leak in here as improvised rewards.
- Visual language: existing tokens only; the component should read as kin to the prerequisite chips / syllabus rows, not as a new design island. Any genuinely new treatment is an improvisation for `components.md`.

Commit: `Feature: self-check quizzes — SelfCheck component + quiz progress storage (4.1)`

## Item 3 — Linter extension

Extend the content gate (inside `lint-content.mjs`, or a `lint-quizzes.mjs` merged into `npm run lint:content` — report the choice) to validate every `content/quizzes/*.yml`:

1. Filename slug must match an existing content node; a quiz for a nonexistent or `stub` node is an error (stubs have no lesson to check against).
2. Full schema of Item 1: version, status enum, question count, types, option counts, exactly-one-correct, `why` on every option, `paradigm` enum, unknown-key rejection with the file and path named.
3. **Placeholder guard:** a `published` quiz containing a `PLACEHOLDER —` prompt is a lint error — the convention that keeps drafts honest is also the tripwire that keeps them off the live site.
4. Distinct error messages per failure class, consistent with the 3.5 style (an author must know *which* rule they broke without reading the linter source).
5. Scratch regression: temporarily break one rule of each class, confirm each fires distinctly, revert.

Commit: `Lint: validate quiz companion files against quiz schema v1 (4.1)`

## Item 4 — Seed set: placeholders + two real stress-tests

Framework first, content later — but not content never, because a schema proven only against placeholders is unproven:

1. **Placeholder drafts** (`status: draft`, per the Item 1 convention) for 6 nodes across the spread: `culture`, `social-norms`, `scientific-method`, `deviance`, `agents-of-socialization`, `bureaucracy` (substitute for stubs; report substitutions). These exercise the linter and the loader's draft-filtering, nothing else.
2. **Two real quizzes** as schema stress-tests, written with full care:
   - `sociological-imagination` — an ordinary concept node, 3–4 questions incl. one `reflect`. **`status: published`** — this is the live-verification quiz.
   - `labeling-theory` — a theory node that **must** exercise non-null `paradigm` attribution on at least two questions. `status: draft` (real content, held back until the content phase reviews it — the point here is stress-testing the schema, not shipping it).
3. **Report schema findings** exactly as the Stage 0 stress test did: anything the two real quizzes revealed about the schema — a field that fought the content, a rule that had to bend, a question that could not be written without becoming `reflect` — is a finding for a schema v1.1, listed, not silently patched around.

Commit: `Content: quiz seed set — six placeholders, two schema stress-tests (4.1)`

## Item 5 — Docs sync

- `docs/schema.md`: one cross-reference line under *Body structure* pointing to `docs/quiz-schema.md` (quizzes are companion files precisely so the node schema is untouched — say so).
- `components.md`: SelfCheck entry — interaction grammar, storage key, the no-gating rule, the published-only render rule, any improvised treatments.
- `CONTRIBUTING.md`: how to add a quiz (file location, schema doc link, the contested-claim rule in one sentence, the placeholder convention, lint command).

Commit: `Docs: quiz system — schema cross-refs, components entry, contributor guide (4.1)`

---

## Explicitly deferred (name them in the report so they stay deferred)

Multi-select and true/false question types; option shuffling; attempt history and spaced repetition; cross-node review decks; points/streaks/badges; ~~quiz-gated completion~~ **(implemented in 4.3 — owner reversed the deferral; the gate unlocks, never auto-marks)**; any server or account dependency; completing the placeholder quizzes (that is the content phase's work, tracked there).

## Verification (the whole gate, in order)

1. `npm run lint:content` — green, including all seed quiz files; the scratch regression for each new error class (including the placeholder guard) confirmed and reverted.
2. `npm run lint` — clean. 3. `npm run build` — all static pages.
4. Manual, desktop + 390px, Midnight + Light: the published quiz renders on both its node page and its course lesson page; answer flow (select → grade → reveal `why` → retry) works by mouse and keyboard; state survives reload; `reflect` textarea stores nothing (verify localStorage by hand); a draft-quiz node and a no-quiz node both show nothing, and **draft quiz content is absent from the built page payload** (grep the export); marking a lesson complete and answering quiz questions are visibly independent acts.
5. Hydration: no mismatch warnings in console on either host page.
6. Push, deploy green, live spot-check the published quiz at phone width.

## Report back

Placement of `getQuiz` and the lint-entry choice; the seed set as shipped with any substitutions; the schema findings from the two real quizzes (the v1.1 list, even if empty — say so explicitly); which questions used `paradigm` attribution; any prompts that had to become `reflect` under the contested-claim rule; improvisations for `components.md`; confirmation of every deferred item left untouched.
