# Task Brief — Phase 6.1: Person Profile Pages

**Destination:** `docs/tasks/phase-6.1-person-profiles.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** `docs/people-mode-roadmap.md` §5. 6.0 built the contract and the registry; this phase makes it visible. One new route, `/people/[slug]`, statically generated, reusing the article shell and the prose measure. **The registry is the only new data source — nothing about a node changes.**

**Read first:** `docs/person-schema.md` (all of it — it governs over this brief), `docs/schema.md` (*Discipline scoping and future expansion*, *Network placement*, the Completion invariant note), `docs/taxonomy.md`, `lib/content.ts`, `src/components/NodeArticle.tsx`, `src/app/node/[slug]/page.tsx`, `src/app/node/[slug]/node-page.css` (the `.node-main` grid block and its comments), `src/components/course/CourseView.tsx` (lines 1–15 — the established cross-route CSS reuse), `docs/design/components.md` (*Article panel*, *Related-links list*, *Draft-status banner*, *CC BY attribution footer*), `docs/design/tokens.css`. Documents win over this brief's prose, as always.

## Binding context

- **`concepts` is derived, never stored** (`person-schema.md` rule 1). Every concept on a profile comes from inverting nodes' `people:` at build time. Do not add a field, a cache file, or a manifest.
- **People are not completable** (`person-schema.md`). No progress key, no rollup, no seal, no `LessonCheck` on the concept rows, no "visited" state of any kind.
- **No new hex anywhere in the diff.** No new dependencies. No client components — the profile page is server-rendered end to end; the only client code it touches is `NodeRail`, which already exists.
- **The person entries stay stubs.** No biography prose is written in this phase, and no frontmatter is edited. `traditions` stays exactly as 6.0 executed it — empty for Weber, Sumner and Crenshaw. Do not backfill it to make the page look fuller.
- **These pages are reachable only by direct URL in this phase.** 6.2 wires the lesson-page entry points; 6.3 decides the tab. **Do not add a temporary link, a `/people` index, a nav entry, or a "coming soon" surface** — an index route with nothing behind it is exactly the inert control the project does not ship. Verify by typing the URL.
- **`docs/wireframes.md` is not updated.** It is a Stage 0 historical document (Frames 1–3); the homepage and network phases did not add frames to it and neither does this one. `components.md` is where this page is specified.

---

## Item 0 — `person-schema.md` status line (carry-forward from 6.0)

The doc's Status paragraph says the registry ships as 16 stubs and "nothing renders yet." That stops being true in Item 2. Update it in **this phase**, and because `person-schema.md` is one of the four contract docs, the docs-sync rule fires: check `docs/writing-a-lesson.md` for staleness **in the same commit**.

Two things to check in `writing-a-lesson.md` specifically: its `people` field description (line ~142) says the name "seeds the future People view" — after this phase the view exists for profiles, so state what a name now does (it resolves to a profile page that lists this lesson among the person's concepts). And confirm nothing there implies a person page is completable or writeable in this phase.

Nothing else in `person-schema.md` changes. If the page seems to need an eleventh field, stop (see below).

Commit: `Docs: person schema status — the registry renders as of 6.1 (6.1)`

---

## Item 1 — Person loader

`lib/content.ts` only. **No route, no component, no visible change.** This item is separable so a build failure in it is unambiguous.

Add, mirroring the node section's shapes and naming:

- `PEOPLE_DIR` = `content/people`, and a person path cache keyed by basename slug, skipping `README.md`. The node walkers already skip `people/` via `NON_NODE_DIRS` (6.0 Item 2) — **do not touch `walkNodeFiles` or `NON_NODE_DIRS`.**
- `PersonFrontmatter` — the ten fields from `person-schema.md`'s table, with `active`, `traditions`, `works` optional and the rest required. `status` reuses the same four-value union as nodes.
- `Person = PersonFrontmatter & { slug: string; html: string }`. Body prose renders through the existing shared `mdProcessor`; a stub's empty body yields `""`. **No Perspectives split** — people have no `## Perspectives` section, and `extractPerspectives` is not called here.
- `getAllPersonSlugs()`, `getPerson(slug)`, `getAllPeople()` (cached, exactly as `allNodesCache` is). `getPerson` validates required-field presence and throws with the slug in the message, matching `getNode`'s posture — lint is the authoring gate, the loader is the build gate.
- `resolvePeople()` — a `Map<string, string>` from every claimed form (a person's `name`, then each entry in `aliases`) to that person's slug. **Mirror `scripts/lint-people.mjs`'s `claims` logic exactly**: `name` first, then aliases; a form claimed by two people and a name matching none are both build-breaking errors with distinct messages. Add a comment on both sides pointing at the other, the way `NON_NODE_DIRS` does.
- `getConceptsForPerson(slug)` → `ConceptNode[]`, derived by walking `getAllNodes()` and resolving each node's `people:` through the map. **Ordering:** flattened `course.yaml` order, `Infinity` for nodes outside the manifest, falling back to `slug.localeCompare` — the same comparator `getTree`'s child sort already uses. Course order is the pedagogically meaningful sequence and the project already has exactly one way to express it; do not invent a second.

Nothing consumes any of this yet. `npm run build` must produce a byte-identical site.

Commit: `Content: person loader and derived concept inversion (6.1)`

---

## Item 2 — The profile page

Three new files, one small refactor, plus `components.md` **in this same commit** (project rule: the spec lands with the thing it specifies).

**Files**

- `src/app/people/[slug]/page.tsx` — `export const dynamicParams = false`; `generateStaticParams()` from `getAllPersonSlugs()`; `generateMetadata` → `` `${person.name} — learn-sociology` `` with `description: person.summary`. Imports `@/app/node/[slug]/node-page.css` **and** its own `./person-page.css`, with the same comment CourseView carries — the article styles live with the `/node` route and this is the third host reusing them; the bundler deduplicates.
- `src/components/PersonArticle.tsx` — server component, sibling to `NodeArticle.tsx`. In `src/components/` rather than inline in the route for symmetry with `NodeArticle`, which is the file a future executor will read first when changing either.
- `src/app/people/[slug]/person-page.css` — **only** the selectors that do not already exist. Everything listed under *Reuse verbatim* below is imported, not re-declared.

**Refactor (same commit):** `paradigmOf(tags)` is currently private to `NodeArticle.tsx` and `PersonArticle` needs the identical rule. Move it to a new `src/lib/paradigm.ts` (pure function, no I/O) and import it in both. The `NodeArticle` diff must be import-only — no markup change, no behaviour change. This is drift prevention, not tidying: two copies of a tag-prefix rule is how the `masteryMode` hazard started.

**Anatomy**, top to bottom in `.node-main`:

1. **Toolbar** — `.article-toolbar` with `<TextSizeControl />` on the right, as on the node page. On the left, a mono eyebrow reading `People` in the breadcrumb vocabulary (`--type-breadcrumb-*`, `--color-text-muted`). **Not a link, and not a breadcrumb** — `/people` does not exist until 6.3, and a crumb pointing nowhere is a dead link. 6.3 owns promoting it. Record that one-line reason in the component comment so it is not "fixed" early.
2. **Status banner** — the same `.status-banner` frame and the same rule (`published` hides it), with **person copy, not lesson copy**. Write a `PERSON_STATUS_BANNERS` map beside the component; do not import or generalise `STATUS_BANNERS`. Suggested: stub → "This profile is a stub — the entry is valid, but no biography has been written yet." Draft and review parallel the lesson wording with "profile" for "lesson".
3. **Title block** — `.title-block` + `<h1 className="node-title">{person.name}</h1>`. Diacritics intact: the display name is the canonical form and the folded slug never appears on screen.
4. **Life line** — `lived`, and `active` when present, as a single mono meta line (`--type-tag-*`, `--color-text-meta-warm`). Deliberately **not** a pill: the difficulty badge's pill vocabulary belongs to controlled-vocabulary states, and `lived` is free text by design (`c. 1820–1895` must render as written).
5. **Lede** — `summary` in `.lede`, unchanged.
6. **Body** — `.node-body` with the rendered prose, **rendered only when the body is non-empty**. A stub emits no empty `<article>`.
7. **Concepts they cover** — an `h2` in the `.node-body h2` vocabulary and a list of the derived concepts, **in the main column, not the rail**. This placement is the point of the page: "one person, many concepts" is the payoff that cannot be assembled anywhere else, and for a stub entry — which is every entry today — the rail placement would leave the main column empty. Each row reuses the `.related-item` vocabulary (paradigm colour tag + serif label + hover `→`) inside a `.person-concepts` list container. When the list is empty, render one honest line — "No lesson in the corpus names this person yet." — not a hidden section.
8. **Sources footer** — the `.attribution` vocabulary (top hairline, mono, muted) with `sources` as a list and the standing CC BY line linking to `LICENSE-CONTENT.md`. Sources are this entry's attribution surface, which is why the schema requires them; they belong at the page foot with the licence line, not in the rail.

**Rail** (`<NodeRail>`, unchanged component): `Disciplines` and, when non-empty, `Traditions` as `.tag-chip` lists — the same chips the node page uses, so `paradigm/*` values keep their accent treatment for free. Then `Works` when present, as a plain list in the related-row type. `aliases` is resolution machinery and is **never rendered**.

**Explicitly not on this page:** Giscus (`LessonComments` is per-lesson; whether people get discussion threads is an unmade decision, not an omission), search indexing (6.4), any completion or progress UI, any edit to `NodeArticle`'s rail People section (6.2 owns that, including retiring its "links arrive with Mode 4" caption).

**components.md**, same commit: a `## Person profile page (6.1)` section documenting the anatomy above, the stub-banner copy, and the eyebrow's deliberate non-linkness. Also amend two existing lines — *Article panel* says `.node-main` has **two** hosts; it now has three, and the one-panel-bound rule extends to the third unchanged. *Related-links list* now describes a vocabulary used in two places (rail related concepts, main-column person concepts).

Commit: `Feature: person profile pages at /people/[slug] (6.1)`

---

## Item 3 — Cross-discipline marking

The interdisciplinary claim in the roadmap has to be visible somewhere, and this is the only surface where two disciplines can meet. `components.md` lands in this commit too.

**The rule, stated once:** for a person, let `D` be the set of `discipline/` tags across the concepts derived in Item 1. **When `|D| > 1`, every concept row carries its discipline as a small mono label; when `|D| == 1`, no marks render at all.** The mark is comparative — it carries information only when there is something to compare, and a `discipline/sociology` label on every row of every profile today would be pure noise.

Two constraints on the derivation:

- It reads **only node `tags`**, never the person's own `disciplines` list. `schema.md` is explicit that cross-discipline relationships are derived from data that already exists, and a node's single `discipline/` tag is that data. The person's list is authored and may legitimately disagree.
- There is **no "primary discipline"** for a person. `person-schema.md` gives an unordered list; do not treat the first entry as primary, and do not mark rows as "outside their home discipline."

Grouping the list under discipline subheadings is **deferred** — flat list plus per-row mark is the smallest thing that cannot be wrong, and the grouping decision is better made when a real second discipline exists to look at.

**Verification is a scratch test, then a full revert** — the pattern 6.0 used for `content/people/test.md`. Temporarily add one `discipline/` row to `docs/taxonomy.md` (the linter parses that table, so this is enough to make the value valid), retag one node that an existing person covers, build, confirm the marks appear on that person's profile and nowhere else, then revert every scratch edit. **Nothing from the scratch test may appear in the commit** — `git status` clean of it, and `grep` the new value across the repo before committing.

Commit: `Design: mark cross-discipline concepts on person profiles (6.1)`

---

## Verification checklist

- `npm run lint:content` (all three scripts), `npm run lint`, and `npm run build` pass. `lint:people` still reports 16 entries and 21 node references.
- 16 profile pages emitted under `/people/`, one per registry entry, each reachable by direct URL under the `/learn-sociology` basePath. No `/people/index.html`.
- **The node page, course view, hierarchy, network and homepage are visually identical to `main`.** The only diff in `NodeArticle.tsx` is the `paradigmOf` import.
- Prose measure on a profile matches the node page exactly: `.node-main` computed prose track 618.75px at default and panel content 816.75px, with the A−/A/A+ steps scaling both. Report these as computed-style and geometry evidence rather than below-fold screenshots (established CI environment behaviour).
- A stub profile renders banner → title → life line → lede → concepts → sources, with **no empty article element** and no empty rail sections in the DOM.
- Concept lists are correct against the corpus: Max Weber shows 3 concepts, Robert Merton 2, George Herbert Mead 2, Charles Horton Cooley 2, and every other entry 1. `resocialization` appears under Erving Goffman (the 6.0 report's correction to the earlier brief); `theoretical-paradigms` appears under nobody.
- Concepts appear in `course.yaml` order on a person who covers concepts from different modules.
- Cross-discipline marks are absent on all 16 profiles as shipped, and appear under the scratch test.
- All three themes: no new hex in the diff (`grep -n '#[0-9a-fA-F]\{3,6\}' ` over the changed files under `src/` returns nothing), and the profile page reads correctly in classic, light and midnight.
- Breaking a person file's frontmatter fails the **build** with the slug named, not just lint. Verify by deliberately breaking, then reverting.
- `components.md` landed in the same commits as Items 2 and 3.
- `docs/writing-a-lesson.md` checked for staleness in Item 0's commit.

## Stop and report — do not improvise past these

- The page seems to want an eleventh person field, or a field `person-schema.md` does not have. The ten-field ceiling is a contract; report the need rather than adding it.
- Any name in a node's `people:` fails to resolve to exactly one person at build time (lint passes today, so this would mean the loader and the linter disagree — report the disagreement, do not make the loader lenient).
- The concept inversion wants to be stored, cached to disk, or written into a manifest to make the build fast enough.
- Reusing `.node-main` or `.related-item` appears to require changing them for the node page's sake. The one-panel-bound rule and the node page's pixels both hold; a conflict means the person page needs its own selector, not an edit to a shared one.
- The cross-discipline rule seems to need a notion of a person's primary discipline, or a second `discipline/` taxonomy value beyond the scratch test.
- Anything here conflicts with `person-schema.md`, `schema.md`, `taxonomy.md`, or `quiz-schema.md`. The documents win; report the conflict rather than resolving it.
- The page feels like it needs Giscus, search entries, a `/people` index, or a link from anywhere in the existing UI. All four belong to 6.2–6.4 and each is a decision, not an oversight.
