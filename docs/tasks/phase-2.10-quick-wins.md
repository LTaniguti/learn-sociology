# Task Brief — Phase 2.10: Quick Wins

**Destination:** `docs/tasks/phase-2.10-quick-wins.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Post-2.9 polish batch. Five small, independent items plus a README rewrite. Each item is its own commit; if one item hits a blocker, skip it, report, and continue with the rest — no item here is allowed to stall the others.

---

## Preconditions

- 2.9 is merged and the deployed site renders the Open Commons theme (CI green on `main`).
- Logo assets from the Claude Design session exist at `docs/design/logo/` (`logo-lockup.svg`, `logo-mark.svg`, `logo-mark-mono.svg`, `favicon-32.png`, `favicon-16.png`). **If absent, skip Item 5 only** — everything else proceeds.

## Standing rules (inherited from 2.9)

- Every visual value is a token from `docs/design/tokens.css`. New semantic needs get a new token in the correct group, flagged in the report. The hex-literal grep guard from 2.9 still applies.
- `docs/design/components.md` governs states; the global focus-ring rule applies to every new interactive element.
- No changes to the content pipeline, lint script, schema, or `progress.ts` storage shape. New persisted client state follows the `progress.ts` pattern: one small module owns each `localStorage` key.
- Direction rule 5 (honesty is styled): no new inert controls. Everything added here works.

---

## Item 1 — Eyebrow color correction

Body-section eyebrows (DEFINITION / IN DEPTH / EXAMPLES…) currently render amber, following the hi-fi PNGs. This violates direction rule 3 (amber is wayfinding only). Change them to the eyebrow spec: `--color-text-muted`, per the `--type-eyebrow-*` tokens. One-line change; the serif "Perspectives"-style headings are unaffected.

Commit: `Design: eyebrows muted per direction rule 3 (2.10)`

## Item 2 — Working search (lesson titles only)

Replace the disabled search input in `Shell.tsx` with a working title search.

**Data:** no fetch, no JSON file. The pages that render `Shell` are server components with pipeline access — build a `{ title, slug }[]` array (all nodes, any status) at render time and pass it as a prop. At 53 nodes this is trivially small and inlines into the static export.

**Component:** a client `SearchBox` inside the existing pill styling:
- Typing filters by case-insensitive substring match on **title only** (deliberate scope decision — update the old `title + summary` TODO comment in `Shell.tsx` to record it).
- Results render in a popover under the pill: `--color-surface-raised`, `--border-thin var(--color-border)`, `--radius-lg`, `--shadow-pop`. Each row: serif title, mono slug caption. Max ~8 rows, scroll beyond.
- Row activation navigates to `/node/[slug]` (the page both modes land on).
- Keyboard: ↑/↓ move, Enter opens, Esc closes and clears; rows show the focus ring. Popover closes on outside click.
- Empty query → no popover. No matches → single muted mono row "no matching titles".
- Accessibility: `role="listbox"` / `role="option"`, `aria-expanded` on the input.

Non-published nodes appear in results — their pages already carry the status banner, which is the honest treatment.

Commit: `Feature: working title search in shell (2.10)`

## Item 3 — Working text-size control

Locate the text-size control specified in `components.md` / present in the hi-fi node page. If it exists in the markup as inert, wire it; if it was never added, add it in the node-page toolbar position shown in the hi-fi (this is a sanctioned addition — it is article chrome, not content structure).

- Three steps: **A− / A / A+** mapping to a `data-textsize="sm|md|lg"` attribute on `<html>`.
- CSS: attribute selectors override **reading typography only** — `--type-body-size`, `--type-lede-size`, `--type-related-size` (sm = the existing mobile values; lg ≈ +10%, defined as tokens, e.g. `--type-body-size-lg`). UI chrome (mono metadata, sidebar, tabs) never scales.
- Persistence: new `src/lib/textsize.ts` module owning one `localStorage` key, mirroring `progress.ts`. Apply on mount; default `md`. If this needs the same mount-time-read `eslint-disable` pattern as the 2.6 hash read, reuse that justification comment style.
- The control shows the active step (mono, `--color-accent` on the current one is acceptable — it is wayfinding).

Commit: `Feature: working text-size control, device-local (2.10)`

## Item 4 — Hideable course sidebar

Desktop course view only (mobile already stacks).

- A toggle button at the top edge of the sidebar (mono glyph `⟨` / `⟩` or similar, with `aria-label` "Hide syllabus" / "Show syllabus" and `aria-expanded`).
- Collapsed: sidebar width animates to a slim rail (just the toggle), content column recenters. `--transition-fast`; honor the existing `prefers-reduced-motion` block.
- Persistence: one `localStorage` key via a small owner module or an extension of the textsize module's pattern — but **not** inside `progress.ts` (different concern, different key).
- Collapsed state must not trap focus or hide the current-lesson context entirely — the Prev/Next cards below the article still provide sequence navigation, which is sufficient.

Commit: `Feature: collapsible course sidebar (2.10)`

## Item 5 — Logo integration (skip if assets absent)

- Copy `logo-lockup.svg` and `logo-mark.svg` into `public/`.
- In `Shell.tsx`, replace the wordmark text with the lockup inside the existing home `Link`: inline `<img>` at 28px height (`alt="learn-sociology"`). The link behavior and focus ring are unchanged.
- Replace the scaffold `favicon.ico`: use the exported PNGs via Next metadata `icons` (16 + 32), and delete the old scaffold favicon.
- Add the usage note from the design session as `docs/design/logo/README.md` if it isn't already a file.

Commit: `Design: logo lockup in shell, real favicons (2.10)`

## Item 6 — README replacement

Replace the root `README.md` **verbatim** with the text between the markers below. Do not editorialize; if something in it is factually wrong against the repo state (e.g., an item shipped/skipped differently in this very brief), fix that one fact and flag it in the report.

<!-- BEGIN README -->
# learn-sociology

An open-source, graph-navigable platform for self-learning sociology.

**Live proof of concept:** https://ltaniguti.github.io/learn-sociology/

## What this is

Most sociology courses are linear: one syllabus, one order, one voice. This project treats introductory sociology as what it actually is — a connected graph of concepts with multiple valid paths through it, and multiple theoretical lenses on every topic.

Every lesson is a Markdown file with YAML frontmatter in this repository. The repo **is** the database: the site is statically generated from these files, contributions are pull requests, and every change is lint-checked in CI before it can deploy.

## Navigation modes

| Mode | View | Status |
|---|---|---|
| 1 | **Course** — a linear, university-style path with progress tracking | Live |
| 2 | **Hierarchy** — a collapsible concept tree from core to niche | Live |
| 3 | **Network** — a navigable graph of how concepts interrelate | Planned |
| 4 | **Sociologists** — a citation-weighted network of thinkers and their work | Planned |

The two planned modes appear in the interface as visible, disabled tabs on purpose: the roadmap is part of the project's identity.

## How it works

- **Content:** `/content` holds one Markdown file per concept node (53 seed concepts across 11 modules, drawn from OpenStax *Introduction to Sociology 3e*). `content/course.yaml` defines the Mode 1 sequence. `docs/schema.md` and `docs/taxonomy.md` define the frontmatter contract and tag vocabulary.
- **Validation:** `npm run lint:content` checks every node (slugs, parents, prerequisites, tags, status, ordering). It runs on every push and pull request, and a failing lint blocks deployment.
- **Site:** Next.js static export, deployed to GitHub Pages by Actions on every merge to `main`. Progress and preferences are device-local (`localStorage`) — there are no accounts and no tracking.
- **Design:** the visual system ("Open Commons") lives in `docs/design/` — direction, tokens, and component specs. Every visual value in the app is a token; the token file itself is imported as live code.
- **Discussion:** each lesson embeds a Giscus thread backed by this repo's GitHub Discussions.
- **Multi-perspective by design:** contested topics present sociology's paradigms side by side rather than flattening them into one narrative. This is a design principle, not an afterthought.

## Status

The proof of concept is live with Modes 1 and 2. The current focus is **content**: replacing stub nodes with full published lessons.

## Roadmap

Near term:
- Content push — stub nodes → published lessons (the PoC exit criterion)
- Structured "Perspectives" rendering — paradigm columns driven by content-pipeline hooks

Further out:
- Mode 3: concept network view (graph visualization), including a node-and-edge canvas upgrade for the Hierarchy view
- Theme switcher — current dark as default, plus an alternate dark and a light theme
- A testing/QA system for course content quality
- Mode 4: sociologist profiles and citation network
- Token-matched custom Giscus theme

## Contributing

Contributions are welcome — see `CONTRIBUTING.md`. Lessons are Markdown files; proposing one is a pull request, and the content linter will tell you if the frontmatter is off.

## Licensing

Dual-licensed: **code** under MIT ([LICENSE](LICENSE.md)), **content** under CC BY 4.0 ([LICENSE-CONTENT.md](LICENSE-CONTENT.md)). Portions of the content are adapted from *Introduction to Sociology 3e* by OpenStax (Rice University), CC BY 4.0 — see the content license for full attribution.
<!-- END README -->

Commit: `Docs: README rewrite — live PoC, modes table, roadmap (2.10)`

---

## Verification

1. `npm run lint`, `npm run lint:content`, `npm run build` all pass; hex-literal grep guard clean.
2. Manual pass on the served export: search finds and opens a lesson by keyboard alone; text size persists across reload and never scales UI chrome; sidebar collapse persists and animates (and doesn't when `prefers-reduced-motion` is set); logo links home and favicons render.
3. Push; CI green; deployed site spot-check.

## Completion report

Report per item: shipped / skipped (and why), new tokens added (and group), any `components.md` gaps encountered (e.g., if the text-size control had no spec and states were improvised — list the improvised values so they can be back-filled into the spec), and any factual correction made to the README text.
