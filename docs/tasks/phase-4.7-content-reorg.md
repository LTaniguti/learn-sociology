# Task Brief — Phase 4.7: Content Folder Reorganization + Roadmap Entries

**Destination:** `docs/tasks/phase-4.7-content-reorg.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** owner-directed. The flat `/content` folder is fine at 53 files and one discipline; it will be overwhelming at 150 files and three. Reorganize **now**, while one discipline exists and zero external PRs are in flight — the cheapest this move will ever be. Also: two owner-directed README roadmap additions (Item 4).

**The structure decision (made — record, don't reopen): discipline-deep only.**

```
content/
  sociology/
    <slug>.md            (all 53 nodes)
    quizzes/<slug>.yml   (all 8 quiz files)
  course.yaml            (stays at content root for now — it is Mode 1's manifest, not a discipline's property; when a second discipline arrives, manifests move/multiply in that phase)
```

No module subfolders: modules are curriculum, curriculum lives in `course.yaml`, and encoding today's module list into the filesystem means re-migrating files every time the content push reorders a unit. One discipline level solves the stated problem — a future `content/anthropology/` lands as a sibling — and nothing else.

**Invariants this move must not bend:**
1. **The filename is the ID, at any depth.** Slug = basename, directory carries zero meaning to the system (it is for humans browsing the repo). No slug prefixing, no path-derived identity.
2. **Slugs are globally unique across all of `content/`**, present and future — this is the assumption the completion invariant, both localStorage stores, prerequisites, and cross-references all stand on. Make it mechanical (Item 2).
3. **Nothing URL-facing changes.** Routes are `/node/<slug>` and `/course/<slug>`; Giscus threads key on pathname. A learner's bookmarks, progress, and discussion threads must be bit-for-bit unaffected. The deployed site before and after this phase should be indistinguishable.

**Sanctioned scope:** `content/` (moves only — **zero content edits**; `git mv` so history survives), `lib/content.ts` (recursive loading), `scripts/lint-content.mjs` + `lint-quizzes.mjs` (paths + the uniqueness rule), any hardcoded `content/` path in code or config (audit: `next.config.ts`, scripts, CI workflow), docs-sync (Item 3), `README.md` (Item 4). Components, CSS, tokens, schema *rules*: tripwire.

## Standing rules (inherited)

Improvisations reported; determinism; the promoted screenshot quirk (little visual verification here); queued-runner patience. **The three-file maintenance note fires:** `schema.md` and the tutorial both describe `/content` — same-commit updates required (Item 3).

---

## Item 1 — The move + loader

1. `git mv` every node to `content/sociology/` and every quiz to `content/sociology/quizzes/`. Verify history follows (`git log --follow` on a sample of both file types).
2. `lib/content.ts`: `getAllNodes` and `getQuiz` walk `content/` recursively (or glob `content/**/`), slug = basename, quiz lookup = "the `quizzes/` dir sibling to the node's own location" — not a hardcoded `sociology/` path, so the next discipline needs zero loader changes. `course.yaml` loading unchanged.
3. Audit for other `content/` path assumptions: linter scripts, `tsconfig`/`next.config` file tracing, the deploy workflow, `templates/` references. Fix what the move breaks; list what was touched.

Commit: `Refactor: content moves to discipline folders — sociology/ + its quizzes/ (4.7)`

## Item 2 — Uniqueness made mechanical

- New lint rule: **duplicate basename anywhere under `content/` is an error** (nodes against nodes, quizzes against quizzes), message naming both paths. Today it cannot fire; it exists so the first `anthropology/culture.md` collides loudly at PR time instead of silently splitting one slug's identity across two files.
- Quiz orphan rule updates naturally: a quiz must match a node *somewhere* under `content/` (same-discipline pairing is convention, not code — don't enforce directory pairing; enforce slug existence).
- Scratch regression: fixture a duplicate slug, confirm the error, revert (tree clean).

Commit: `Lint: global slug uniqueness across content subdirectories (4.7)`

## Item 3 — Docs-sync (the maintenance note's first live firing)

- `docs/schema.md`: `/content` references → the new structure, plus one sentence on the two rules that matter to authors (directory is for humans; slug is the basename and globally unique).
- `docs/writing-a-lesson.md`: sections 1–4 reference paths (`/content`, the template, where quizzes go) — update; the browser-flow screenshots-in-prose ("navigate to content/…") must match reality step for step.
- `CONTRIBUTING.md` + `templates/` references: same pass.
- `components.md`: loader note if it documents content loading.

Commit: `Docs: content structure — discipline folders, slug rules, tutorial paths (4.7)`

## Item 4 — README roadmap additions (owner-directed)

Add to **Further out** (tune to the list's voice, keep substance):
- *End-of-unit tests — module-level assessments for completing course units, paired with the sound & motion pass so finishing a unit feels like something.*
- *Homepage redesign — a proper front door that orients new visitors, surfaces the navigation modes, and shows a returning learner their progress at a glance.*

Touch nothing else in the README.

Commit: `Docs: roadmap — end-of-unit tests, homepage redesign (4.7)`

---

## Explicitly deferred

Module subfolders (rejected, not deferred — say so); moving/multiplying `course.yaml` (arrives with discipline #2); any discipline-aware UI; content edits of any kind.

## Verification (the whole gate, in order)

1. `npm run lint:content` green (all 53 + 8 found at new paths; count printed matches); `npm run lint` clean; `npm run build` **all 112 pages** — the page count is the headline number; a drop means the loader missed files.
2. **Zero content diffs:** `git diff` shows renames only (`-M` detection 100% on every content file); no byte changed in any node or quiz.
3. Route stability: the built export's page set is identical pre/post (diff the output directories' HTML file lists); spot-check `/node/labeling-theory` and a course lesson render identically.
4. Duplicate-slug scratch regression fired and reverted.
5. Every path mentioned in the tutorial's browser walkthrough exists as written.
6. README diff is exactly Item 4's two lines.
7. Push, deploy green, live spot-checks: a lesson page, its Giscus thread still attached to its existing discussion, and (with prior progress in the browser) completion state intact — the invisible-move proof.

## Report back

The audit list of every touched path assumption; `git log --follow` proof on samples; the pre/post page-set diff (empty); the uniqueness rule's message verbatim; docs files updated under the maintenance note; the README lines as merged; improvisations.
