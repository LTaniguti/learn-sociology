# Task Brief — Phase 6.3: The People Index

**Destination:** `docs/tasks/phase-6.3-people-index.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** `docs/people-mode-roadmap.md` §3 (presentation) and §5. This is the phase that makes People a **mode**: the `/people` index ships, the disabled *Sociologists* tab comes down and a live *People* tab goes up, the homepage's fourth card goes live. Everything a reader could reach is real; nothing is "coming soon" after this phase.

**Preconditions — verify before starting, stop if either fails:**

1. `git log --oneline -3 main` shows 6.2's two commits (`Feature: rail people become links into /people (6.2)`, `Docs: writing-a-lesson — people links are visible on the lesson (6.2)`) on `main`. 6.2 was executed on a branch; it must be ff-merged before this phase starts.
2. `docs/people-mode-roadmap.md` exists in the working tree (untracked is fine — Item 0 commits it). The owner places it there before the session. If it is absent, stop; do not author a substitute (the 6.2 report's reasoning stands).

**Read first:** `docs/people-mode-roadmap.md` §3 and §4 (the presentation and colour decisions this phase implements — they are binding), `docs/person-schema.md` (`lived` is free text; people are not completable), `lib/content.ts` (`Person`, `getAllPeople`), `src/components/Shell.tsx`, `src/app/node/[slug]/node-page.css` (`.shell-tab*`, `.breadcrumb`, `.tag-chip`), `src/components/PersonArticle.tsx` and `src/app/people/[slug]/person-page.css` (`.person-eyebrow`, `.person-life`), `src/app/page.tsx` and `src/app/home.css` (the fourth card), `src/app/hierarchy/page.tsx` (the server-enriches / client-renders pattern), `src/components/preview/preview-card.css` (the canvas preview card — the closest existing card vocabulary), `docs/design/components.md` (*Mode tabs*, *Homepage*, *Person profile page*), `README.md` (mode table and the sentence under it). Documents win over this brief's prose, as always.

## Binding context

- **Roadmap §3 is the spec for the index.** Era-band grouping default; alphabetical is the one alternate toggle; tradition is a chip on the card, not a grouping axis; **no filter rail, no discipline facet, no search field on the page** — one control, the sort toggle. A filter with one value is the inert control the project does not ship.
- **Everything is derived at build time from `content/people/*.md`.** No new frontmatter field, no manifest, no `people.yaml`, no ordering file. Birth year is parsed from `lived`; surname is parsed from `name`. Rule 1 of `person-schema.md` extends: nothing about a person is stored twice.
- **People are not completable.** No progress, no "visited", no seal, no counts of "profiles read". The index is a reference surface.
- **No new hex anywhere in the diff.** No new dependencies. One client component is permitted and named below; everything else is server-rendered.
- **`docs/wireframes.md` is not updated** (6.1/6.2 precedent).
- **Person entries stay stubs.** No bios, no frontmatter edits, no backfilling `traditions` or `active` to make cards look fuller. The index must look right at 16 stubs, because that is what it will be for a while.
- **Search does not index people in this phase** (6.4). Do not touch `SearchBox` or the index Shell builds.

---

## Item 0 — Roadmap file (carry-forward, second attempt)

`git add docs/people-mode-roadmap.md` — the owner has placed it in the working tree. Commit it unchanged.

Commit: `Docs: people-mode roadmap — the file 6.0–6.3 cite (6.3)`

---

## Item 1 — Index data: era bands and surname order, derived

`lib/content.ts` gains the data the index needs, in one function (`getPeopleIndex()` or similar) so the ordering rules live in exactly one server-side place and the client component never sorts anything.

**Birth year.** The first four-digit run in `lived`. `1858–1917` → 1858; `b. 1959` → 1959; `c. 1820–1895` → 1820. No four-digit run → **throw** with the slug (`<slug>: lived '<value>' has no four-digit year — see docs/person-schema.md`). The build gate, not a lenient fallback.

**Era bands — by birth year, three bands.** The boundaries are editorial and the roadmap says they are ours to defend, so they are recorded once in a governing document and mirrored in code with a citation. Add to `docs/person-schema.md` a short section **"Era bands (derived)"** with this table and the two sentences of reasoning below it:

| Band | Birth year | Today |
|---|---|---|
| Classical | before 1880 | Marx, Sumner, Durkheim, Mead, Cooley, Weber (6) |
| Twentieth century | 1880–1929 | Blumer, Parsons, Merton, Lemert, Mills, Goffman, Luckmann, Becker, Berger (9) |
| Contemporary | 1930 onward | Crenshaw (1) |

Reasoning to record: banding is by **birth** year because it is the one date every entry has in a parseable form; `active` is optional and sparse, so it cannot drive grouping. The bands describe *when people were born, not when ideas were superseded* — classical theory is live, and the index's own lede says so (Item 2). Add the table's "Today" column as an illustration that is expected to go stale, and say so.

Within a band: birth year ascending, then surname. Empty bands are **omitted**, not rendered as a heading over nothing.

**Surname.** The last whitespace-separated token of `name`. `C. Wright Mills` → Mills; `George Herbert Mead` → Mead; `Kimberlé Crenshaw` → Crenshaw. Alphabetical order is surname (locale compare, base sensitivity so diacritics do not reorder), then full name. Today's expected order: Becker, Berger, Blumer, Cooley, Crenshaw, Durkheim, Goffman, Lemert, Luckmann, Marx, Mead, Merton, Mills, Parsons, Sumner, Weber. If a future name breaks the last-token rule (suffixes, particles) that is a stop-and-report, not a special case.

**Return shape** — serialisable, both orderings precomputed:

```ts
type PersonCard = { slug; name; summary; lived; status; traditions: string[] };
type PeopleIndex = {
  cards: Record<string, PersonCard>;
  byEra: { band: string; slugs: string[] }[];   // non-empty bands only, in table order
  alphabetical: string[];                        // surname order
};
```

`aliases`, `sources`, `works`, `disciplines`, `active` are **not** in the card — the card is a doorway, and the profile already renders what belongs on the profile. `disciplines` in particular: one value across the whole roster is a chip that says nothing (roadmap §3, no inert facets); it returns when a second discipline exists.

**Docs-sync:** `person-schema.md` changed, so read `docs/writing-a-lesson.md` against all four contracts; it likely needs nothing (it describes lessons, and this section describes derivation), say so in the report.

Commit: `Content: people index data — era bands and surname order, derived (6.3)`

---

## Item 2 — `/people`

`src/app/people/page.tsx`, sibling of `[slug]`; static export produces `out/people/index.html`. Metadata: `People — learn-sociology`. Per-frame stylesheet `src/app/people/people-index.css` (the post-2.9 convention), importing `node-page.css` for the Shell, chips and type roles it reuses, as the other routes do.

**Anatomy** (`<Shell active="people" />` then `<main class="people-page">`):

1. **Header.** `h1` "People" in `.node-title`. A one-line lede (`.lede`) that does the framing the roadmap requires: something close to *"The people behind the concepts, grouped by when they were born. Earlier is not superseded — classical theory is still in use."* The count of profiles is **derived** (`Object.keys(cards).length`), never typed, if it appears at all. Keep it to one sentence.
2. **Sort toggle** — the page's only control. Two options, **By era** (default) / **A–Z**, as a `role="group"` of two buttons with `aria-pressed`, in the tab-chip vocabulary (`--type-tab-size` mono, `--radius-sm`, the `.shell-tab` active/idle treatment is the reference — reuse its tokens, not its class). **Session-only state** (`useState`), not persisted: a returning reader lands on the teaching view. This is a deliberate departure from the rail/syllabus collapse pattern (which persist) — it is a view choice, not a layout preference — record it in the source comment and in `components.md`. No URL hash, no `localStorage` key.
3. **The grid.** By era: one `section` per band with an `h2` band label in the `.rail-heading` eyebrow vocabulary, then the cards. A–Z: one flat grid, no headings. Grid: `repeat(auto-fit, minmax(min(100%, 260px), 1fr))`, `--space-4` gap — the homepage modes-grid mechanism.

**Card** (`.person-card`) — the **whole card is one `Link`** to `/people/<slug>` (the homepage live-card precedent): framed surface (`--color-surface`, `--color-border-input` hairline, `--radius-lg`, `--space-5` padding; hover `--color-surface-hover` + `--color-border-accent`, focus the global ring). Inside, top to bottom:

- **Name** — serif, `--type-card-title-size`, 600, `--color-text-heading`, diacritics intact.
- **Life line** — `lived` exactly as written, in the `.person-life` vocabulary (mono `--type-tag-*`, `--color-text-meta-warm`). Free text renders as written; never reformat it.
- **Summary** — serif `--type-card-summary-size`, `--color-text-muted`.
- **Tradition chips** — `traditions` as `.tag-chip.tag-chip-paradigm` (the rail's chip: the `paradigm/` value keeps its accent for free). **Absent when empty** — no placeholder, no "—". Weber, Sumner and Crenshaw show no chip row; that is the roadmap's point about chips versus grouping.
- **Status** — when not `published`, a small marker in the `--type-badge` mono treatment reading the status word (`stub` today on all 16), muted, top-right of the card or trailing the name. Reuse whatever the canvas preview card does for status if it renders one (read `preview-card.css`); otherwise the homepage's retired `.home-card-planned` treatment is the right register (see Item 4 — it is retired there and may be re-homed here under a new name).

No discipline chip (Item 1). No concept count (a number that is 1 on twelve cards is noise). No image slot — the schema has no portrait field and this phase does not add one.

**The client component.** `src/components/people/PeopleIndex.tsx`, `"use client"`, receives `PeopleIndex` as a prop and renders header-toggle-grid. Justification (record in the file's header comment): the toggle re-orders and re-groups the cards, which requires the data client-side; both orderings are precomputed server-side so the component **never sorts** — it selects one of two prepared lists. Precedent: `HierarchyCanvas` receives an enriched tree the same way. At 16 entries the prop inlines into the static page.

**Reduced motion / no motion.** Toggling swaps DOM order; no transition is added.

**`components.md`**, same commit: new section **"People index (6.3)"** specifying the above in the document's register — anatomy, card, toggle (including the session-only decision and why), band vocabulary, what is deliberately absent (filters, discipline chips, counts, portraits, progress). Cross-reference the era-band table in `person-schema.md` rather than copying it.

Commit: `Feature: /people index — era-grouped cards with A–Z toggle (6.3)`

---

## Item 3 — The People tab goes live; the disabled tab comes down

This is a **doctrine reversal** and must be recorded as one everywhere the old rule is written.

**`Shell.tsx`:** replace the disabled `span` with a `Link` to `/people` labelled **People**, in the same position (fourth). Extend `active` to `"course" | "hierarchy" | "network" | "people"`. Rewrite the header comment: the shell no longer has an honest-disabled tab; that pattern is retired as of 6.3 because every advertised mode now exists.

**Active state on person pages.** `/people` passes `active="people"`. `/people/[slug]` **also** passes `active="people"`: a person belongs to exactly one mode, unlike a node (which is why `/node/[slug]` highlights nothing). Record the asymmetry in a comment on the profile route.

**Profile eyebrow → breadcrumb.** 6.1 rendered "People" as plain text because `/people` did not exist. It exists now: replace `.person-eyebrow` with the node page's `.breadcrumb` vocabulary — `<Link href="/people">People</Link>` `/` `<span aria-current="page">{name}</span>` — in the toolbar's left slot, exactly where the node breadcrumb sits. Delete `.person-eyebrow` from `person-page.css` (no consumer) and rewrite its comment block's successor. Update `components.md` *Person profile page* anatomy item 1 and the "Reachable by…" paragraph (now: from the tab, the index, and every lesson that names the person).

**CSS.** `.shell-tab-disabled` and its `:hover` rule in `node-page.css` lose their only consumer. Delete them, and the `--tab-disabled-text` token **stays** (tokens are a vocabulary; an unused token is not drift the way an unused selector is — and deleting it from three theme files for no visual gain is churn). Note this in the report.

**`components.md` *Mode tabs*:** four live tabs; delete the *Disabled* bullet and its "Never removed" line, replacing it with one sentence recording the reversal: the honest-disabled tab pattern (3.3–6.2) was retired in 6.3 when the fourth mode shipped; a future planned mode may reinstate it, but nothing currently uses it.

**`README.md`, same commit** (it describes the tab, so it lands with the tab — the docs-with-feature rule; the roadmap had assigned README to 6.4 and is corrected): mode table row 4 becomes **People** — *profiles of the people behind the concepts, and the lessons that name them* — status **Live**; delete the sentence beneath the table about the visible disabled tab; in the roadmap section replace "Mode 4: sociologist profiles and citation network" with the remaining 6.4 work in one line ("People mode: search integration and the contributor guide for person entries"). Leave the rest of the README alone.

Verify with `grep -rn "Sociologists\|Coming soon\|shell-tab-disabled\|honest-disabled" src/ README.md docs/design/components.md` → the only hits are the recorded reversals (components.md's one sentence; the Shell/homepage comments that name the retired pattern).

Commit: `Feature: People tab goes live; the honest-disabled tab pattern retires (6.3)`

---

## Item 4 — The homepage fourth card goes live

`src/app/page.tsx`: the disabled `div` becomes a `Link` to `/people`, same anatomy as the three live cards. Title **People**, no "planned" marker. Body copy: *"Profiles of the people behind these concepts, and every lesson that names them."* (the current copy promises "linked into the graph", which is the superseded plan).

**Chip colour — a decision, recorded here so it is not re-litigated.** The three live cards use the paradigm trio, in the site's standing order; the trio is spent and roadmap §4 says colour means school of thought, so the fourth card gets **no paradigm colour**. The chip keeps `--color-surface-sunken` and promotes its ink from `--color-text-faint` (the disabled register) to `--color-text-muted` — the same "neutral for everything outside the encoded set" rule the roadmap precedents. Keep the existing person glyph. Do **not** reach for `--color-accent` or an accent wash: the homepage's one amber action is the primary CTA.

**CSS.** `.home-card-disabled` (and its two descendants) and `.home-card-planned` lose their only consumer. Delete them from `home.css` — unless Item 2 re-homed the badge treatment for the card status marker, in which case it lives in `people-index.css` under its new name and `home.css` still loses it.

**`components.md` *Homepage*,** same commit: the modes-grid bullet becomes four live cards; strike "Sociologists is honest-disabled…" and record the reversal in one clause pointing at Item 3's.

Commit: `Feature: homepage fourth card goes live — People (6.3)`

---

## Verification checklist

- `npm run lint:content` (all three), `npm run lint`, `tsc`, `npm run build` pass. `lint:people`: 16 entries, 21 references (unchanged — no content edits).
- `out/people/index.html` exists. It contains exactly 16 `<a>` elements with `href` under `/people/` (excluding the Shell and breadcrumb), each resolving to an existing `out/people/<slug>/index.html`.
- **By era (default render):** three `h2` band headings in the order Classical → Twentieth century → Contemporary; DOM order of cards under each matches Item 1's table, and within Classical: Marx (1818), Sumner (1840), Durkheim (1858), Mead (1863), then Cooley/Weber (both 1864, surname order Cooley → Weber).
- **A–Z:** after a dispatched click on the A–Z button, no `h2` band headings remain and card DOM order is the sixteen-name sequence in Item 1. `aria-pressed` flips on both buttons. Reload → back to By era (nothing persisted; `localStorage` has no new key).
- Chips: Durkheim's card has one `.tag-chip-paradigm` reading `paradigm/functionalism` with computed colour `--paradigm-functionalism` in all three themes; Weber's, Sumner's, Crenshaw's cards contain no `.tag-chip`.
- Every card carries the `stub` marker (all 16 are stubs); its computed type values match the `--type-badge-*` tokens.
- `lived` on each card is the frontmatter string verbatim (`b. 1959` on Crenshaw, en dash intact on the rest).
- Grid geometry: at 1280px viewport the grid has ≥3 columns; at 390px exactly 1. Whole card is the link (click the summary text → navigates).
- **Shell:** every page in `out/` has a fourth tab `<a href="/people">People</a>`; `grep -r "shell-tab-disabled\|Coming soon" out/` → empty. `/people` and `/people/durkheim`… all 16 profiles carry `aria-current="page"` on the People tab; `/node/*` pages carry it on no tab; `/course/*`, `/hierarchy`, `/network` unchanged.
- **Profile breadcrumb:** `out/people/karl-marx/index.html` toolbar contains `<a href="/people">People</a>` then a separator then `Karl Marx` with `aria-current="page"`; `.person-eyebrow` absent from `out/`.
- **Homepage:** fourth card is `<a href="/people">`; `home-card-disabled`, `home-card-planned`, and the word "planned" absent from `out/index.html`; chip ink computed = `--color-text-muted` in all three themes.
- No new hex in the diff. No `localStorage` key added (`grep -rn "learn-sociology:" src/lib` lists the same keys as `main`).
- **Normalised HTML comparison** (the 6.2 method — resolved RSC trees): every pre-existing page differs, because the Shell changed on all of them; assert the differences are confined to the `shell-tabs` nav on every page, **plus** the modes grid on `/`, **plus** the toolbar on the 16 profiles. Anything outside those three subtrees is a regression.
- Deliberate failure, then revert: set `lived: unknown` on `william-graham-sumner.md` → `npm run build` fails naming the slug and pointing at `person-schema.md`. Restore. (Consider whether `lint-people.mjs` should carry the same four-digit-year check so authors hit it before the build does; if it is a five-line addition, add it in Item 1 and say so — if it needs a schema-doc rule change, stop and report.)

## Stop and report — do not improvise past these

- Either precondition fails.
- A person's `lived` has no four-digit year, or a `name` whose last token is not the surname (suffix, particle, mononym).
- Any band is empty (it should be omitted — report that it was, since the doc's "Today" column then needs a note).
- You want to persist the sort choice, add a filter, a search field, a discipline chip, a concept count, a portrait slot, or any progress/visited state.
- The card status marker has no existing vocabulary to reuse and needs new tokens.
- `--tab-disabled-text` or any token seems to need deleting or renaming.
- The normalised comparison shows a difference outside the three expected subtrees.
- Anything in this brief conflicts with `person-schema.md`, `schema.md`, `components.md` or the roadmap's §3/§4. The documents win; report the conflict rather than resolving it.

## Noted, not fixed (carried from 6.2)

`paradigmOf` has three bodies (`src/lib/paradigm.ts`, `hierarchy/layout.ts:90`, `network/graph.ts:47`). This phase does not touch either canvas file; the note stands for whichever phase does.
