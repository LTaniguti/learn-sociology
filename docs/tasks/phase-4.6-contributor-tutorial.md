# Task Brief — Phase 4.6: The Contributor Tutorial — Writing a Lesson

**Destination:** `docs/tasks/phase-4.6-contributor-tutorial.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** owner-directed docs phase ahead of the content push. A new step-by-step tutorial teaches a potential contributor how to write a lesson node end to end — markdown formatting, the frontmatter contract, the tag system, the Perspectives conventions, attribution, quizzes, and the PR flow. `CONTRIBUTING.md` links it prominently. This document is the front door for the content phase; its quality directly gates how many strangers can help.

**The one design rule — "the tutorial shows, the schema governs":** the tutorial must be concrete enough to follow without opening another file, but it must **not become a second normative source**. Exact contracts (field rules, tag vocabulary, quiz schema) are *linked* at the moment they're needed, never restated in full; where the tutorial paraphrases for teachability, it says once, near the top: *on any conflict, `docs/schema.md`, `docs/taxonomy.md`, and `docs/quiz-schema.md` win.* Drift is the failure mode this rule exists to prevent.

**Audience calibration:** a sociology student or enthusiast who has never used GitHub — browser-only workflow throughout (edit via github.com, no local environment assumed), with CI lint as their safety net. Local commands (`npm run lint:content`) appear once, clearly marked optional. This mirrors how the project itself was built in Stage 0, and it is the honest profile of the contributor the content push wants.

**Sanctioned scope:** new `docs/writing-a-lesson.md`, `CONTRIBUTING.md` (link + trim of anything the tutorial now covers better), one line in `docs/README.md`'s index if one exists, and the maintenance note below. Everything else — content, schema, taxonomy, code, linter: **tripwire**. This phase ships prose only.

## Standing rules (inherited)

Docs voice consistent with the existing `docs/` register; improvisations reported; the promoted screenshot quirk (irrelevant here — no visual verification); queued-runner patience. No code, no tokens, no content-file diffs.

---

## Item 1 — `docs/writing-a-lesson.md`

Structure it as a walkthrough a contributor follows top to bottom, writing one lesson as they go:

1. **Before you start** — what a concept node is (one Markdown file = one concept = one graph node), where lessons live (`/content`), the status ladder in one breath (you will submit a `draft`; `stub → draft → review → published` and who moves what), and the governs-rule sentence with the three normative links.
2. **Set up in the browser** — fork, edit, and open a PR entirely on github.com, step by step with the actual UI actions named (the project was built this way; say so — it's encouraging). One marked-optional aside: running the linter locally if you have Node.
3. **Pick your concept** — how to find a stub worth writing (the course view's stub banners, the network view's dashed pills), and the ask-first convention if any exists (open an Issue claiming the node — verify what `CONTRIBUTING.md` currently says and stay consistent with it rather than inventing policy).
4. **The frontmatter, field by field** — walk all ten fields on a **fictional worked example** (an invented but realistic slug, clearly marked *"illustrative — this node doesn't exist"*; a real stub would go stale the day someone writes it). For each field: what it does *in the product* (e.g. `parent` places you on the hierarchy canvas; `prerequisites` draw the amber path; `tags` power the network view and the paradigm accents), one filled-in example line, and the link to `schema.md` for the exact rule. The ten-field budget gets one sentence of lore — contributors should know fields are precious, not propose new ones.
5. **The tag system** — how to read `taxonomy.md`, the tag families that matter most to authors (`paradigm/*` especially — it drives the pill dot and relates to Perspectives), how many tags is normal, and the linter-will-catch-you reassurance.
6. **The body, heading by heading** — `Definition / In depth / Perspectives / Examples / Further reading`, with the *why* of each (Definition serves the graph-arrival reader; Examples because sociology lands through cases), length norms drawn from the real lessons, and basic Markdown formatting notes inline where each construct first appears (bold key terms, backticked slug cross-references like `` `strain-theory` ``, links) — no separate "markdown syntax" appendix; teach it in situ.
7. **Perspectives, properly** — the section's purpose (multi-perspective by design), the **two legitimate shapes** (`###` subsections for concept nodes; bold-led bullets + optional intro for theory nodes, per the pattern note in `schema.md`), the lead-with-the-paradigm-name rule that earns the accent, the neutral-card fallback (anything else still renders, unaccented — you cannot break the page), and pointers to **`content/social-norms.md`** (concept shape) and **`content/labeling-theory.md`** (theory shape) as the living exemplars to imitate.
8. **Attribution** — when `adapted_from` is required, the OpenStax CC BY 4.0 conventions in plain words, the by-contributing-you-license-CC-BY sentence, and the link to `LICENSE-CONTENT.md`.
9. **Quizzes (optional)** — companion file location and the link to `quiz-schema.md`; the contested-claim rule in one sentence; and the **publish-deliberately warning stated plainly**: a `published` quiz makes mastering it the only way to complete that lesson — submit quizzes as `draft` and let review publish them.
10. **Submitting and what happens next** — opening the PR, what CI lint checks and how to read a failure message (one real-shaped example error), the review flow, and the tone-setting close: imperfect drafts are welcome; the ladder exists so nothing has to be perfect on arrival.

Length discipline: this is a tutorial, not a treaty — target the length it needs and no more; every section earns its place by answering something a first-time contributor would actually stall on.

Commit: `Docs: writing-a-lesson tutorial — the contributor front door (4.6)`

## Item 2 — `CONTRIBUTING.md` integration

- Link the tutorial in the first screenful as the primary path for content contributions ("Want to write a lesson? Start here").
- Trim, don't duplicate: where `CONTRIBUTING.md` currently explains things the tutorial now covers better, replace the explanation with the link; keep `CONTRIBUTING.md`'s non-content material (code contributions, conduct, anything else present) untouched.
- Verify every cross-link in both directions resolves (relative paths, on GitHub *and* on the deployed site if docs render there — check which is true rather than assuming).

Commit: `Docs: CONTRIBUTING routes content contributors to the tutorial (4.6)`

## Item 3 — The maintenance note (drift-proofing)

Add one line to wherever docs-sync expectations live (`components.md` conventions preamble, or the schema's own header — executor reports the placement): **any phase that changes `schema.md`, `taxonomy.md`, or `quiz-schema.md` must check `docs/writing-a-lesson.md` for staleness in the same commit.** The tutorial joins the sync list the day it's born, or it rots.

Commit: `Docs: tutorial added to the docs-sync maintenance list (4.6)`

---

## Explicitly deferred

Video/GIF walkthroughs; a lesson template file (`templates/` exists — if a node template is already there, *link* it in Item 1.4 rather than creating one; if absent, creating one is deferred, not smuggled in); translations; a web-based "new lesson" wizard; any linter change.

## Verification

1. `npm run lint:content`, `npm run lint`, `npm run build` — all green (nothing should have changed them; the run proves it).
2. Zero diffs outside `docs/` and `CONTRIBUTING.md`.
3. Every link in the tutorial resolves (schema, taxonomy, quiz-schema, both exemplar nodes, licenses, CONTRIBUTING and back).
4. Read-through test: the tutorial's steps, followed literally in the browser-only flow, would produce a lint-passing draft node — walk the fictional example against the actual linter rules mentally and confirm no step teaches something the linter rejects (the worked example's frontmatter must itself be schema-valid apart from its fictional slug).
5. The governs-rule sentence and the publish-deliberately warning are present verbatim-in-spirit.
6. Push, deploy green (docs-only, but the gate is the gate).

## Report back

The tutorial's final section list with word count; what was trimmed from `CONTRIBUTING.md`; the maintenance-note placement; whether a node template existed in `templates/` (linked) or not (deferred noted); any point where the tutorial had to paraphrase a normative rule and how the governs-rule covers it; improvisations.
