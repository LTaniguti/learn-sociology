# Self-Check Quiz Schema

**Status:** v1 — Phase 4.1. Stress-tested against two real quizzes
(`sociological-imagination`, `labeling-theory`); findings for a future v1.1 are
recorded at the end of this file.

**Docs-sync:** any phase that changes this file, `docs/schema.md`, or
`docs/taxonomy.md` must check [`docs/writing-a-lesson.md`](writing-a-lesson.md)
for staleness **in the same commit** — the contributor tutorial paraphrases these
three contracts for teachability and rots if they drift.

A **self-check quiz** is an optional companion to a concept node: a small set of
questions rendered below the lesson body, graded client-side with immediate
per-question feedback and explanations. It is **self-assessment, not
certification** — on a static export the answers ship in the bundle, and that is
correct for this phase. Stakes, identity, and anti-cheat belong to the deferred
verification-system phase; nothing here anticipates them.

## Why a companion file, not frontmatter

The node schema's ten-field frontmatter budget is spent (`docs/schema.md`,
design principle 3). A quiz therefore lives in its **own file**, never in node
frontmatter:

```
content/quizzes/<slug>.yml
```

`<slug>` is the node's filename ID. "The filename is the ID" (schema principle
2) extends here: a quiz belongs to exactly the node whose slug it bears.
Quizzes are optional — most nodes have none — and the node schema is left
completely untouched (`docs/schema.md` cross-references this file).

Like a node, a quiz file must **make sense viewed raw on GitHub** (schema
principle 4): plain YAML, prose-like prompts, no encoding tricks.

## File format

```yaml
version: 1
status: draft             # draft | published — only published quizzes render
adapted_from: "OpenStax Introduction to Sociology 3e, Section 1.1 review"   # when applicable
questions:
  - type: choice            # single-correct multiple choice
    prompt: >-
      According to Mills, the sociological imagination connects which two things?
    paradigm: null          # or functionalism | conflict-theory | symbolic-interactionism
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

## Field rules (the linter's spec)

These are enforced by `scripts/lint-quizzes.mjs` (run under `npm run
lint:content`). Each rule below has a distinct error message so an author knows
*which* rule they broke without reading the linter.

### File level

- `version: 1` — **required**. Any other value is a lint error (forward-compat
  discipline from day one — a v2 reader must refuse a version it cannot honour).
- `status: draft | published` — **required**. The vocabulary is a deliberate
  **subset** of the node status ladder: `stub`/`review` have no meaning for a
  quiz. The semantics match the node's — `draft` is honest work-in-progress,
  `published` is learner-ready. **Only `published` quizzes render** (the loader
  filters; draft content never ships in the page payload).
- `adapted_from` — **optional**, same string format as node frontmatter.
  OpenStax section reviews are CC BY 4.0 and may be adapted with attribution,
  exactly like lesson prose.
- `questions` — **required**, **1–8** entries.
- Unknown keys at any level are a lint error (the allowlist discipline applied
  to a second file family).

### `choice` questions

- `prompt` — required.
- `options` — **3–5** entries.
- **Exactly one** option has `correct: true`.
- **Every** option carries a `why`. The distractor rationale is where the
  teaching happens; it is not optional. Wrong-answer `why` text is **content,
  not a secret** — the UI reveals every option's `why` after an answer.
- `paradigm` — **required key**, may be `null`. When non-null it must be one of
  `functionalism` | `conflict-theory` | `symbolic-interactionism`, and the
  prompt should carry the attribution in prose too ("According to conflict
  theory, …").

### `reflect` questions

- `prompt` only. No `options`, no correct answer.
- Rendered with a free-text box whose content is **never stored or
  transmitted** — it is a thinking surface, and the UI says so.

### Two types only in v1

`choice` and `reflect`. **Multi-select, true/false, and ordering are not in
v1.** True/false is *explicitly rejected*: it is where contested claims sneak in
as bare facts.

## The contested-claim rule (multi-perspective, at the question level)

This is the quiz-level counterpart of the body's `## Perspectives` heading, and
the most important editorial rule here:

> **No question may grade a paradigm-contested claim as simply correct.**

A contested claim must either:

1. carry **paradigm attribution** — structurally via the `paradigm:` field, and
   in the prompt prose ("According to functionalism, …"), so the graded answer
   is "what this paradigm holds," not "what is true"; **or**
2. be posed as an **ungraded `reflect` question**, where there is no answer key
   at all.

The linter validates the *shape* (a non-null `paradigm` is a valid slug) but
**cannot verify the rule itself** — whether a given claim is contested is a
judgement. It is enforced editorially (the checklist below) and at review.

## Placeholder convention

Framework-first means most quizzes are placeholders while content lags. A
placeholder is:

- a valid `status: draft` file,
- with **one** schema-complete `choice` question whose prompt begins
  `PLACEHOLDER —`,
- and **one** `reflect` question.

A placeholder **must pass the full linter** — placeholders exercise the
pipeline, they do not get a pass from it. And the linter's **placeholder guard**
makes a `published` quiz containing a `PLACEHOLDER —` prompt an error: the
convention that keeps drafts honest is also the tripwire that keeps them off the
live site.

## Node-status coupling

- A quiz slug must match an **existing** content node (a quiz for a nonexistent
  node is a lint error).
- A **`published`** quiz on a **`stub`** node is a lint error — a stub has no
  lesson body to check against. A **`draft`** quiz on a stub node is *allowed*:
  a placeholder is meant to exist before its lesson does, and a draft never
  ships. (Refined in v1: the original rule barred *any* quiz on a stub; that
  made the framework-first seed set impossible, since nearly every node is
  currently a stub. The "cannot ship" intent is preserved by scoping the error
  to `published`.)

## Authoring checklist (editorial — mirrors the linter where it can't reach)

- [ ] **Contested-claim rule.** Every graded claim is either paradigm-attributed
      (prose + `paradigm:` field) or the question is `reflect`. No paradigm's
      reading is graded as neutral fact.
- [ ] **Distractors are plausible misconceptions**, not jokes. A wrong option a
      learner would never pick teaches nothing.
- [ ] **Every `why` explains, never just restates.** "Because it is correct" is
      not a rationale.
- [ ] **Prompts are self-contained.** A learner arriving from a graph click may
      not have read the whole lesson; the question must stand on its own.
- [ ] **Attribution.** If the quiz adapts an OpenStax section review, set
      `adapted_from`.

## What is deliberately deferred

Multi-select and true/false question types; option shuffling (question and
option order render exactly as authored — no shuffling anywhere in v1); attempt
history and spaced repetition (v1 stores the last attempt only); cross-node
review decks; points, streaks, and badges; **quiz reset / re-take** (with
sticky-correct and 4.4's mastery mode, this is now the *only* path to
un-completing a mastery-mode lesson — see the doctrine trail below); any server
or account dependency. (Quiz-gated completion was *itself* deferred at 4.1; it
shipped in 4.3 and became derived-from-mastery in 4.4.) See the Phase 4.1 brief
for the full original deferred list.

## Schema findings (for a future v1.1)

Recorded from writing the two real stress-test quizzes, per the Stage 0
discipline (a schema proven only against placeholders is unproven):

1. **The stub-node rule was too strict for framework-first.** As originally
   specified, *any* quiz on a stub node was a lint error. But at Phase 4.1 the
   corpus is almost entirely stubs, so that rule made the requested six
   placeholder quizzes impossible to place. Resolved in v1 by scoping the error
   to `published` quizzes (see *Node-status coupling*). A v1.1 might reconsider
   whether "stub" is even the right gate, versus "has a lesson body."
2. **`paradigm` is per-question, but attribution sometimes wants to be
   per-option.** In the `labeling-theory` quiz, a single prompt can pose "how do
   functionalists vs. conflict theorists read this?" where *different options*
   belong to *different paradigms*. v1 forces one paradigm per question, so such
   a question must either pick one paradigm and attribute the whole prompt, or
   become `reflect`. v1.1 could allow an optional per-option `paradigm`. For
   now the workaround (one paradigm per prompt) held, at the cost of splitting
   one comparison into two attributed questions.
3. **No place to attribute a `reflect` prompt's framing.** Reflect questions
   carry no `paradigm` field, which is correct (nothing is graded), but a
   reflect prompt can still lean on one paradigm's language. Not a defect —
   noted only so a v1.1 reviewer does not "fix" it by adding a field the
   ungraded case does not need.

No rule had to *bend* to ship the two real quizzes beyond finding (1), which was
resolved rather than worked around. Findings (2) and (3) are shape observations,
not blockers.

**Doctrine trail (schema unchanged throughout).** The completion doctrine has
three states, each an owner decision — recorded here in order so none reads as
accidental:

- **4.1 — informs.** A quiz result never marks a lesson complete; the quiz
  informs, it does not gate.
- **4.3 — gates with a click.** A `status: published` quiz **gates** its lesson's
  completion in course mode: it *unlocks* the mark-complete button once every
  `choice` question is answered correctly, but never auto-marks — the learner
  still clicks.
- **4.4 — derived from mastery.** For a `status: published` quiz with ≥1 `choice`
  question, completion is **derived**: the moment every `choice` question is
  correct the lesson **auto-marks complete** (on both hosts), and the manual
  button is removed. A reflect-only published quiz (`choiceCount === 0`) is
  exempt — it keeps the lesson in manual mode.

The schema itself is untouched across all three — but `status: published` now
carries a second meaning worth naming: for a quiz with choice questions it is the
**completion mechanism** for its lesson. Publishing such a quiz makes mastery of
it *the* way that lesson gets completed. Publish deliberately.
