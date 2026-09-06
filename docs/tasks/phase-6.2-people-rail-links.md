# Task Brief — Phase 6.2: Node → Person Surfacing

**Destination:** `docs/tasks/phase-6.2-people-rail-links.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** `docs/people-mode-roadmap.md` §5. 6.0 built the registry, 6.1 gave it pages, this phase gives those pages their first way in. **One existing rail section changes from inert text to links.** No new route, no index, no tab change, no new data. After this phase the registry is useful even if the index were never built.

**Read first:** `src/components/NodeArticle.tsx` (the `rail-people` block, lines ~255–261, and the `rail-related` block above it — the row vocabulary this phase reuses), `src/app/node/[slug]/node-page.css` (`.rail-related ul`, `.related-item` and its `::before` swatch, `.rail-people p:first-of-type`, `.rail-note`), `src/components/PersonArticle.tsx` (the concept rows — the identical move in the other direction), `lib/content.ts` (`Person`, `getAllPeople`, `resolvePeople`), `src/lib/paradigm.ts`, `docs/design/components.md` (*Related-links list*, *Rail — Perspectives chips*, *Person profile page*), `docs/person-schema.md`, `docs/writing-a-lesson.md` (the `people` bullet, ~line 142). Documents win over this brief's prose, as always.

## Binding context

- **No node changes, no person changes.** `people:` stays a list of display names; frontmatter in `content/` is not edited. Person entries stay stubs.
- **No new hex anywhere in the diff.** No new dependencies. No client components — `NodeArticle` is a server component and stays one; the only client code the rail touches is `NodeRail`, which is untouched.
- **People are not completable** (`person-schema.md`). The rows carry no `LessonCheck`, no seal, no visited state. The row is a link, nothing more.
- **Still no `/people` index, no nav entry, no eyebrow link on the profile.** 6.3 owns all three. The Shell's disabled *Sociologists* tab and the homepage's disabled fourth card are **untouched** — their copy is 6.3's problem, and changing one line of it now would make them half-honest.
- **`docs/wireframes.md` is not updated** (6.1 precedent — Stage 0 historical document). Its Frame 3 note that people are "plain text, not yet links" is now historically accurate and stays. `components.md` is where the rail is specified.
- **Course view inherits this for free.** `CourseView.tsx` hosts `NodeArticle`; the rail is rendered inside it. Verify, do not re-implement.

---

## Item 0 — Roadmap file (carry-forward)

`docs/people-mode-roadmap.md` is cited as "Roadmap reference" by the 6.0 and 6.1 briefs and by this one, and does not exist on `main` — it was drafted in the July design session and never committed. The file is supplied alongside this brief. Place it at `docs/people-mode-roadmap.md` unchanged. Its progress table already records 6.1 as done and 6.2 as this brief.

Commit: `Docs: people-mode roadmap — the file 6.0 and 6.1 cite (6.2)`

---

## Item 1 — People rows in the node rail

One commit: `NodeArticle.tsx`, `node-page.css`, `components.md`.

**Resolution.** In `NodeArticle`, when `node.people` is non-empty, resolve each name to its `Person` via `resolvePeople()` → slug, then `getAllPeople()` → entry (build a slug → `Person` map once; both loaders are cached). A name that fails to resolve **throws** with the node slug and the name in the message — `lint:people` guarantees it cannot happen, so reaching it is a loader/linter disagreement, the same posture `getConceptsForPerson` takes. No lenient fallback to plain text.

**Rendering.** Replace the `<p>` + `.rail-note` caption with a list in the *Related-links row vocabulary* (`components.md`), the third host after the rail's *Related concepts* and the profile's *Concepts they cover*:

```tsx
<section className="rail-section rail-people">
  <h2 className="rail-heading">People</h2>
  <ul>
    {people.map((person) => (
      <li key={person.slug} className={/* see swatch rule */}>
        <Link href={`/people/${person.slug}`}>{person.name}</Link>
      </li>
    ))}
  </ul>
</section>
```

Four rules, each of which a future run would otherwise "improve" in the wrong direction:

1. **Label is the registry `name`, never the string the node authored.** The registry is the one place a display form is decided (diacritics, initials, ordering); a node's `people:` value is a resolution key that may legitimately be an alias like `Durkheim`. All 21 node references use the canonical name today, so this is a no-op on screen and a rule for the future.
2. **Order is the node's authored order.** `people:` order is the author's one editorial signal about relative weight for that lesson (`labeling-theory` lists Becker before Lemert deliberately). Do not sort. This differs from the profile page's concept list, which is course order because the person has no authored order — the asymmetry is correct, note it in the source comment.
3. **Swatch by tradition, only when unambiguous.** The `.related-item::before` colour tag denotes school of thought — the one meaning colour carries (roadmap §4). A person row takes `paradigm-<x>` when `traditions` has **exactly one** entry; zero or two-plus entries → no class → the existing neutral `--color-border-input` bar, exactly as a concept row without a `paradigm/` tag renders. `paradigmOf(person.traditions ?? [])` already implements this: it reads the `paradigm/` prefix and returns the first match — **but** the exactly-one guard is yours to add in the caller, since `paradigmOf` returns the first of many. Today: 13 people carry one tradition, Weber/Sumner/Crenshaw carry none, nobody carries two.
4. **Stub profiles are linked.** Every person is a stub today; every link lands on a page whose status banner says so. That is the same contract stub *nodes* have had since 2.4 — a link to honest content is not a dead link. Do not gate rows on `status`.

**CSS.** Add `.rail-people ul { list-style: none; }` mirroring `.rail-related ul` (the list reset is container-scoped by design — see `person-page.css`'s `.person-concepts` comment). Delete `.rail-people p:first-of-type` (no `<p>` remains). Delete `.rail-note`: `NodeArticle.tsx:260` is its only consumer in `src/` and `docs/` (verify with `grep -rn rail-note`), and a vocabulary with no host is drift waiting to happen. If a second consumer turns up, stop and report instead.

**Rail width.** The rows add no width demand: `.related-item` already lives in the 288px rail. Longest name today is `William Graham Sumner`; confirm it does not wrap at the rail's default width, and if it does, it wraps the same way a long related-concept title does — no special case.

**`components.md`**, same commit:

- *Related-links list*: "used in **two places** as of 6.1" → three, adding the rail's *People*. Replace the "People list … plain serif text, not links" bullet with the four rules above in the document's own register (swatch = tradition when exactly one, else neutral; label = registry name; authored order; stubs linked). Record the reversal explicitly: the 2.4 "plain text — links arrive with Mode 4" caption is retired as of 6.2, so a future run cannot restore it.
- *Rail — Perspectives chips*: the anatomy line "after Related concepts, before People" is still true; leave it.
- *Person profile page*: "Reachable by direct URL only in 6.1 … no link into it from anywhere" → reachable from every lesson that names the person (node page and course view), as of 6.2; still no index and no nav entry until 6.3. The eyebrow paragraph (`/people` does not exist) stays true and stays.

Commit: `Feature: rail people become links into /people (6.2)`

---

## Item 2 — `writing-a-lesson.md` staleness pass

The docs-sync rule: this phase touches no contract table, but the tutorial's `people` bullet (~line 142) describes what naming a person does on the page. Read it against the shipped behaviour. It already says the name "resolves to that person's profile page at `/people/<slug>`" — as of 6.2 that link is visible on the lesson page itself, and the bullet may say so in one clause. If the bullet is already accurate as written, make no edit and say so in the report.

Commit only if changed: `Docs: writing-a-lesson — people links are visible on the lesson (6.2)`

---

## Verification checklist

- `npm run lint:content` (all three), `npm run lint`, `tsc`, `npm run build` pass. `lint:people` still reports 16 entries, 21 references.
- `out/node/labeling-theory/index.html`: the `.rail-people` section contains exactly two `<a>` elements, `href` `/people/howard-becker` then `/people/edwin-lemert` in that order, labels `Howard Becker` / `Edwin Lemert`; both `href`s correspond to files that exist under `out/people/`.
- `out/node/functionalism/`: three rows, authored order Durkheim → Parsons → Merton; all three `li` carry `paradigm-functionalism`.
- `out/node/bureaucracy/`: one row, Weber, `li` carries **no** `paradigm-*` class; computed `::before` background = `--color-border-input` in all three themes.
- Becker/Lemert rows: computed `::before` background = `--paradigm-interactionism` in all three themes; row `padding`, `border-bottom`, `gap` computed values identical to a `.rail-related .related-item` on the same page.
- `grep -rn "rail-note" src/ docs/ out/` → empty. `grep -rn "links arrive with Mode 4" src/ docs/design/ out/` → empty (`docs/wireframes.md` is allowed to keep its historical note).
- The 39 nodes with `people: []` render no `.rail-people` section (unchanged from 6.1).
- Course view: open `/course` at `labeling-theory`; the same two links render in the rail, same hrefs. Click-through lands on `/people/howard-becker` with the stub banner.
- **Normalised HTML comparison** (the 6.1 method — buildId, RSC chunk boundaries, hashed chunk names normalised): of the 128 pre-existing pages, every difference is inside a `.rail-people` subtree; pages whose node has `people: []` and all 16 `/people/` pages are byte-identical after normalisation.
- No new hex in the diff. No file under `src/app/` added. `NodeRail.tsx`, `Shell.tsx`, `src/app/page.tsx` untouched.
- Deliberate failure, then revert: set `people: [Nobody Real]` on any node → `lint:people` fails with the resolution message **and** `npm run build` fails with the node slug and the name in the error. Restore.

## Stop and report — do not improvise past these

- Any node reference resolves through an **alias** rather than `name` (none should today) — proceed, but list which, since rule 1 then changes what the reader sees.
- Any person carries **two or more** `traditions` (none should today) — the row goes neutral per rule 3; report it so the owner can decide whether that is the intended reading.
- `.rail-note` has a consumer other than `NodeArticle.tsx:260`.
- A person name wraps in the rail at the default width in a way a long related-concept title does not.
- The normalised comparison shows a difference **outside** a `.rail-people` subtree on any pre-existing page.
- You find yourself wanting to add a link to `/people` anywhere, edit the Shell tab, the homepage card, or `writing-a-person.md` — all 6.3/6.4.
- Anything in this brief conflicts with `person-schema.md`, `schema.md`, or `components.md` as they stand on `main`. The documents win; report the conflict rather than resolving it.

## Noted, not fixed (log for the next phase that touches these files)

`paradigmOf` now exists in **three** places: `src/lib/paradigm.ts` (6.1, shared by `NodeArticle` and `PersonArticle`), `src/components/hierarchy/layout.ts:90`, and `src/components/network/graph.ts:47`. The 6.1 lift resolved the article-side pair; the two canvas copies predate it and were out of 6.1's scope. Same rule, three bodies — the `masteryMode` hazard shape. Whichever phase next touches either canvas file should point it at `src/lib/paradigm.ts`. Not this phase: the canvas fingerprint is untouched here and stays that way.
