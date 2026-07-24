# Task Brief — Phase 6.0: People Registry (data contract)

**Destination:** `docs/tasks/phase-6.0-people-registry.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** `docs/people-mode-roadmap.md` §5. This phase builds the contract and the registry. **Nothing renders.** No route, no page, no tab change, no component. A reviewer pulling this branch should see identical pixels on every existing screen.

**Read first:** `docs/schema.md` (Frontmatter fields table, Design principles, the directory-meaning paragraph, Reserved fields), `docs/taxonomy.md`, `docs/quiz-schema.md` (the precedent this phase follows — a whole feature added with the node schema untouched), `scripts/lint-content.mjs`, `lib/content.ts` (top ~50 lines: `walkFiles` / `getNodePaths`), `docs/writing-a-lesson.md`, `docs/design/tokens.css`. Documents win over this brief's prose, as always.

## Binding context

- **The node schema does not change.** Design principle 3's ten-field budget is spent. `thinkers:` is *renamed*, not joined by a sibling. People are a second entity type with their own files and their own schema doc, exactly as quizzes are.
- **`KNOWN_FIELDS` is parsed from `docs/schema.md`** at `scripts/lint-content.mjs:60` — the Frontmatter fields table *is* the linter's allowlist. Renaming the row renames the allowed key. This is why Item 1's doc edit and content edits must land in one commit: either alone fails lint.
- **No new hex anywhere in the diff.** No new dependencies. No client components.
- **Person entries ship as stubs.** A stub is the same thing it is for nodes: complete, valid frontmatter and a real `summary`, no body prose. Do not write biographies in this phase.

---

## Item 0 — Decouple the accent from interactionism

All three themes set `--paradigm-interactionism` to the same literal as `--color-accent`:

| File | Line | Value |
|---|---|---|
| `docs/design/tokens.css` | 119 | `#e08a3c` (comment reads `amber (== brand accent)`) |
| `docs/design/theme-light.css` | 95 | `#8a4a15` |
| `docs/design/theme-midnight.css` | 94 | `#f0983f` |

**Values stay exactly as they are. Only the coupling breaks.** Replace the `== brand accent` comment with a note that the identity is coincidental and deliberately not inherited — a future discipline override layer will move `--color-accent` and interactionism must not follow it. Mirror a short version of that comment into the other two theme files.

**Verification is that nothing changed:** computed values for `--color-accent` and `--paradigm-interactionism` are identical to `main` in all three themes; no visual diff on the node page or Perspectives cards.

Own commit: `Design: decouple --paradigm-interactionism from --color-accent (values unchanged) (6.0)`

---

## Item 1 — Rename `thinkers:` → `people:`

One commit, all sites together.

- `docs/schema.md` — the `thinkers` row in the Frontmatter fields table becomes `people`. Rewrite the Purpose cell: it seeds the People mode, values are display names resolved against the person registry, still optional. Update the example frontmatter block at the bottom (it is a copy of `content/sociology/sociological-imagination.md` — both must agree). Note the rename rationale in one sentence: "thinker" strains for practitioners and for disciplines whose canon is not person-organized.
- `lib/content.ts` — `NodeFrontmatter.thinkers?: string[]` → `people?: string[]` (line ~60).
- `docs/writing-a-lesson.md` — lines ~112 and ~140. **Same commit**, per the docs-sync rule.
- **14 content files** carry a non-empty list; the other 39 carry `thinkers: []`. All 53 change. The 14 populated ones, for cross-checking: `theoretical-paradigms`, `social-norms`, `strain-theory`, `labeling-theory`, `symbolic-interactionism`, `social-construction-of-reality`, `intersectionality`, `development-of-the-self`, `sociological-imagination`, `functionalism`, `conflict-theory`, `bureaucracy`, `power-and-authority`, `primary-and-secondary-groups` — verify against `grep -l` rather than trusting this list.

Semantics are unchanged: still optional, still display names, still no consumer. After this item `grep -rn "thinkers" src/ lib/ content/ docs/ scripts/` returns nothing.

Commit: `Schema: rename thinkers: to people: across nodes, docs and loader (6.0)`

---

## Item 2 — Non-node directory allowlist

Both walkers treat every `.md` under `content/` except `README.md` as a concept node at any depth — `walkFiles` in `lib/content.ts` and `walkNodeFiles` in `scripts/lint-content.mjs`. `content/people/` would be ingested as malformed nodes and fail lint immediately. Quizzes escape only by being `.yml`.

Add a shared notion of non-node directories (`quizzes`, `people`) to both walkers. Two small independent constants is acceptable — `scripts/` is plain Node and `lib/` is TypeScript, and cross-importing for a two-element list is worse than duplicating with a comment pointing at the other.

**Amend the directory-meaning sentence in `docs/schema.md`.** It currently says the directory carries no meaning to the platform. That has been quietly inaccurate since `quizzes/` shipped. Restate precisely: the directory carries no meaning **for node identity**; a short allowlist of non-node directory names marks sibling entity types, which the node walkers skip and their own loaders claim. Note that this is a clarification of long-standing behaviour, not a new exception — a future executor must not "restore" the original wording.

Verify: a scratch file at `content/people/test.md` does not appear in `getAllNodes()`, does not trip concept-list registry coverage, and does not fail `npm run lint:content`. Delete the scratch file before committing.

Commit: `Content: allowlist non-node directories in both walkers (6.0)`

---

## Item 3 — `docs/person-schema.md`

The fourth contract document. Add it to the docs-sync note at the top of `schema.md`, `taxonomy.md`, and `quiz-schema.md` — that note becomes **four** documents checking `writing-a-lesson.md` for staleness, not three. Give `person-schema.md` the same note.

Proposed fields — you own the final table, but do not exceed it without stopping:

| Field | Req | Notes |
|---|---|---|
| `name` | yes | Display name, diacritics intact (`Émile Durkheim`). |
| `aliases` | yes | Every string any node uses in `people:`, plus obvious variants (`Durkheim`, `E. Durkheim`). May include `name` itself or not — state which and be consistent. |
| `summary` | yes | 1–2 sentences. Card blurb, preview, search result. |
| `lived` | yes | `1858–1917`, or `b. 1959` for the living. Drives era banding later. |
| `active` | no | Period of principal work, only when it diverges sharply from lifespan. |
| `disciplines` | yes | One **or more** `discipline/` values from `taxonomy.md`. |
| `traditions` | no | Zero or more `paradigm/` values. Empty is common and correct. |
| `works` | no | 1–5 principal works, title + year. Not a separate entity. |
| `sources` | yes | Where the entry's claims come from. CC BY attribution travels with the material, same rule as `adapted_from`. |
| `status` | yes | `stub` / `draft` / `review` / `published`, mirroring nodes. |

Three rules the document must state explicitly, each with its reasoning, because each is the kind of thing a future phase would otherwise "fix" in the wrong direction:

1. **`concepts` is derived, never stored.** Computed by inverting every node's `people:`. Storing it creates two sources of truth that drift the moment a lesson is edited.
2. **A person carries multiple disciplines; a node carries exactly one.** The asymmetry is deliberate: a node must pick one home to keep Mode 2's hierarchy a true tree, and no such constraint applies to people. This is what makes the person registry the platform's natively interdisciplinary layer. Retrofitting single→multi later would be a data migration.
3. **Living people.** Sourced claims only; no characterization of anyone's current views; no personal detail that is not professionally relevant. One short paragraph.

Also record what is deliberately **absent**: no `influences` field (it only paid for graph edges, and the graph was cut), no work-level entity, no citation metrics. Say why, so the omissions read as decisions rather than gaps.

**People are not completable.** No progress key, no rollup, no seal. State it — "add a visited-people tracker" is exactly the plausible improvisation the completion invariant exists to prevent.

Commit: `Docs: add person schema (fourth contract doc) (6.0)`

---

## Item 4 — 16 stub person entries

`content/people/<slug>.md`, one per name currently in the corpus:

Max Weber · Robert Merton · George Herbert Mead · Charles Horton Cooley · Émile Durkheim · William Graham Sumner · Thomas Luckmann · Talcott Parsons · Peter Berger · Kimberlé Crenshaw · Karl Marx · Howard Becker · Herbert Blumer · Erving Goffman · Edwin Lemert · C. Wright Mills

Slugs are lowercase kebab-case, diacritics folded (`emile-durkheim`), and **globally unique across all of `content/`** — nodes and people share one namespace so cross-references are never ambiguous and a future unified search never disambiguates by type.

Each entry: valid frontmatter, a real `summary`, `lived` filled, `disciplines` filled, `aliases` covering the exact strings the nodes use. `status: stub`. **No body prose.**

On `disciplines`: `discipline/sociology` is currently the only valid taxonomy value, so every entry gets exactly that for now even where a second discipline is obviously true (Marx, Weber). The multi-value *capability* ships; the values wait for the taxonomy to grow. Do not invent taxonomy values.

**Do not create a `concept-list.md` equivalent for people.** That 1:1 registry exists for nodes because `concept-list.md` was the planning document; the person files are their own registry, and a parallel doc would be two sources of truth by construction.

Commit: `Content: 16 person stubs seeded from the corpus (6.0)`

---

## Item 5 — `scripts/lint-people.mjs`

Wire into `npm run lint:content` alongside the existing two scripts, so CI (`.github/workflows/deploy.yml:28`) gates deploys on it without workflow changes.

Checks:

- Person frontmatter validates against `person-schema.md` — required fields present, unknown keys rejected by name. **Parse the field table from the doc** the way `lint-content.mjs` does, so the document stays the allowlist.
- Slug uniqueness across all of `content/` — people *and* nodes, one namespace.
- Every value in every node's `people:` resolves to **exactly one** person, by `name` or `aliases`. Zero matches and multiple matches are both failures, with distinct messages.
- No alias collides across two people.
- `disciplines` and `traditions` values exist in `taxonomy.md`.
- `status` is one of the four.

Error message style follows `lint-content.mjs`: `<slug>: <what's wrong> (<which doc to read>)`.

Commit: `Tooling: lint:people — registry validity and people: resolution (6.0)`

---

## Verification checklist

- `npm run lint:content` passes (all three scripts), `npm run lint` passes, `npm run build` succeeds.
- `grep -rn "thinkers" src/ lib/ content/ docs/ scripts/` → no results.
- Computed `--color-accent` and `--paradigm-interactionism` unchanged from `main` in all three themes.
- No route added, no file under `src/app/`, no component touched.
- Node page, course view, hierarchy, network, homepage: visually identical to `main`.
- Breaking a person file's frontmatter fails lint; adding an unresolvable name to a node's `people:` fails lint; duplicating a slug across `content/sociology/` and `content/people/` fails lint. Verify each by deliberately breaking, then reverting.
- `docs/writing-a-lesson.md` checked for staleness against all four contract docs.

## Stop and report — do not improvise past these

- `KNOWN_FIELDS` fails to parse after the `schema.md` table edit (line 73 emits its own error for this).
- Any name in `people:` cannot be resolved to exactly one person, or two people claim the same alias.
- A person slug collides with an existing node slug.
- Item 0 changes any computed colour value anywhere.
- A `thinkers` reference turns up outside the files enumerated in Item 1.
- The person schema wants an eleventh field, or a person entry seems to need a field not in Item 3's table.
- Anything in this brief conflicts with `schema.md`, `taxonomy.md`, `quiz-schema.md`, or `person-schema.md` once written. The documents win; report the conflict rather than resolving it.
