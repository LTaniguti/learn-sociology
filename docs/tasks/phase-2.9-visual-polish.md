# Task Brief — Phase 2.9: Visual Polish Pass ("Open Commons")

**Destination:** `docs/tasks/phase-2.9-visual-polish.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 2, Step 2.9 — the final Phase 2 step. Apply the chosen design direction across all shipped screens. **Style only** — structure stays locked to `docs/wireframes.md` and its traceability table.

---

## Precondition — verify 2.7 and 2.8 landed

Confirm before starting:

- `.github/workflows/deploy.yml` exists and the latest run on `main` is green (lint → build → deploy).
- The Giscus component (`src/components/LessonComments.tsx`) exists and renders on the node page.
- The design artifacts exist: `docs/design/direction.md`, `docs/design/tokens.css`, `docs/design/components.md`, and the four exports in `docs/design/hifi/`.

**If any of these are missing, stop and report — do not reconstruct prior steps inline here.**

## Context (read first, in this order)

1. `docs/design/direction.md` — the chosen direction ("Open Commons", dark), including the nine rules of thumb. Rules 1–9 govern every styling decision in this step, including surfaces not shown in the mockups.
2. `docs/design/tokens.css` — **the single source of visual truth.** No component may contain a hex value, px size, radius, or shadow that is not a token reference. If a genuinely new semantic need appears, add a token to the correct group and flag it in the completion report; never inline a literal.
3. `docs/design/components.md` — per-component, per-state specs (hover, focus, disabled, current). Where the mockups are silent, this file is the spec.
4. `docs/design/hifi/*.png` — the four reference renders (`course-view@2x`, `hierarchy-view@2x`, `node-page-desktop@2x`, `node-page-mobile@2x`). These are the acceptance targets.
5. `docs/wireframes.md` traceability table — the structural contract this step must **not** disturb.

## Scope

**In scope:** global styles, fonts, and per-screen styling for everything currently shipped — the shared shell (`Shell.tsx`), the home/landing page (`src/app/page.tsx`), Mode 1 course view, Mode 2 hierarchy view, the node page (`NodeArticle.tsx` and both routes that render it), the Giscus embed theme, and removal of scaffold leftovers.

**Out of scope:** any change to data flow, routing, page structure, the content pipeline, `progress.ts` semantics, or the lint script. If a spec in `components.md` seems to require moving or adding a structural element beyond a wrapper/className, **stop and report** — that is a wireframe question, not a styling one.

---

## Step 1 — Wire in the tokens

Import `docs/design/tokens.css` directly in `src/app/layout.tsx` (a relative import from outside `src/` is valid for global CSS in the root layout). This keeps exactly **one** token file in the repo — no copy to drift.

- Add a short comment at the top of `tokens.css` noting it is now live code imported by the app, not only a design reference.
- If the build tooling rejects the out-of-`src` import for any reason, fall back to moving the file to `src/app/tokens.css` and leaving a one-line pointer file at `docs/design/tokens.css` — report which path was taken.

## Step 2 — Fonts (documented amendment to direction.md)

`direction.md` prescribes vendored `@font-face` woff2 files in `/public/fonts`. Use **`next/font/google`** instead: it downloads at build time and self-hosts the output, which satisfies the direction's actual goals (no runtime third-party requests, OFL-licensed, `font-display: swap`, Latin subset) without committing binaries. Record this as an amendment in the commit message and append a two-line note to the "Typography sourcing note" section of `direction.md`.

Implementation:

1. In `layout.tsx`, replace the Geist imports with:
   - `Spectral` — weights 300, 400, 600, 700 plus italic 400; `variable: "--font-spectral"`.
   - `IBM_Plex_Mono` — weights 400, 500, 600; `variable: "--font-plex-mono"`.
   Both with `subsets: ["latin"]` and `display: "swap"`. Apply both variables on the `<html>` element.
2. Bridge the tokens (the only edit `tokens.css` needs — `next/font` registers scoped family names, so the literal `"Spectral"` string will not resolve):
   ```css
   --font-serif: var(--font-spectral, "Spectral"), Georgia, "Times New Roman", serif;
   --font-mono:  var(--font-plex-mono, "IBM Plex Mono"), ui-monospace, "SFMono-Regular", "Menlo", "Consolas", monospace;
   ```
3. Delete the Geist imports entirely.

## Step 3 — Rewrite `globals.css`

Replace the scaffold file wholesale. It should contain only:

- Box-sizing reset and margin/padding zeroing (keep from current file).
- `body`: `background: var(--color-canvas)`, `color: var(--color-text-body)`, `font-family: var(--font-serif)` at `--type-body-*` values; remove the light theme and the `prefers-color-scheme` blocks — Open Commons is dark unconditionally.
- `::selection` using `--color-selection`.
- Links: `color: var(--color-link)`, hover `--color-link-hover`, transition `var(--transition-fast)`.
- The global focus rule from `components.md`: all interactive elements show `box-shadow: var(--focus-ring)` on `:focus-visible` with `outline: none`; hover and focus remain visually distinct.
- A `prefers-reduced-motion: reduce` block that zeroes transitions.

## Step 4 — Style the shared shell

Per the "Top bar" section of `components.md`: height, surfaces, wordmark, the four mode tabs (active / idle / hover / disabled states exactly as specified — Network and Sociologists stay visible with `title="Coming soon"`), and the search pill. The search input is currently `disabled`; style it per spec anyway (it advertises the roadmap honestly — direction rule 5).

## Step 5 — Style the three screens

Work screen by screen, comparing against the matching hi-fi PNG after each:

1. **Node page** (`NodeArticle.tsx` + `/node/[slug]` + `/course/[slug]`) against `node-page-desktop@2x.png`: title, lede, mono section eyebrows, the serif "Perspectives" heading with the three paradigm-coloured columns (semantic colours only — direction rule 4), status/draft banner (dashed border treatment per rule 5), prerequisites chips (complete/unmet states), right rail (fixed 288px; related links, thinkers, tag chips), difficulty badge, and the CC BY attribution footer in mono (rule 8 — it is UI, not fine print). Content column caps at ~660px.
2. **Course view** against `course-view@2x.png`: sidebar module headers (expanded/collapsed), lesson item states (complete / current with the 3px left bar / upcoming), progress track and caption ("… · device-local"), Prev/Next cards including their disabled end-state.
3. **Hierarchy view** against `hierarchy-view@2x.png`: tree canvas background and dotted grid, node fills/borders for collapsed vs expanded, connector strokes (`--color-edge` / `--color-edge-active`), descendant-count badges, paradigm dots, and the preview card with `--shadow-pop`.

Add classNames and non-structural wrappers as needed; do not reorder or remove elements listed in the traceability table.

## Step 6 — Home page and Giscus

- **`src/app/page.tsx`** has no mockup. Style it using direction.md's rules of thumb (surface ladder, two-font rule, single amber action). Keep it minimal — this is a landing/redirect surface, not a new design.
- **Giscus:** set the embed's `theme` to the built-in dark theme that sits closest to the palette (`noborder_dark` or `dark_dimmed` — pick by visual comparison against the surrounding panel). A fully token-matched custom Giscus theme (Giscus accepts a CSS URL) is deferred; leave a `// TODO(post-2.9)` noting it.

## Step 7 — Scaffold cleanup

Remove `public/file.svg`, `public/globe.svg`, `public/window.svg`, and any remaining scaffold CSS/classes. Leave `favicon.ico` as-is (a designed favicon is post-2.9).

## Step 8 — Responsive pass

Apply the mobile values already defined in the type-scale tokens (`--type-title-size-mobile`, lede 16px, body 15px) and check the node page against `node-page-mobile@2x.png` at a ~390px viewport. Sidebar/rail behaviour on narrow screens: collapse below the content rather than horizontally squeezing — simplest correct behaviour, no new components.

---

## Guards

- **No literal values.** `grep -rE '#[0-9a-fA-F]{3,8}' src/` after the change should return nothing outside imported token files. Same spirit for px sizes: layout-only values (e.g. flex basis) are acceptable; anything visual must be a token.
- **No structural diffs.** The diff to `.tsx` files should be classNames, wrappers, font imports, and the Giscus theme prop — nothing that adds, removes, or reorders content elements. If one seems necessary, stop and report.
- **If a `components.md` spec and a hi-fi PNG disagree,** follow `components.md` and note the discrepancy in the report — the spec is the contract; the PNG is a render of it.

## Verification

1. `npm run lint` and `npm run lint:content` pass.
2. `npm run build` succeeds with static export.
3. Serve `out/` locally and visually compare all three screens (plus mobile node page) against the four PNGs.
4. Keyboard-tab through each screen once: every interactive element shows the amber focus ring; disabled tabs are skipped or inert.
5. Push and confirm the Actions run is green and the deployed site at https://ltaniguti.github.io/learn-sociology/ renders the new theme.

## Commits

Split into reviewable commits, e.g.:

1. `Design: wire tokens.css into app, replace scaffold globals (2.9)`
2. `Design: Spectral + IBM Plex Mono via next/font (amends direction.md sourcing note) (2.9)`
3. `Design: style shell, course, hierarchy, node screens per components.md (2.9)`
4. `Design: home page, Giscus dark theme, scaffold cleanup, responsive pass (2.9)`

## Completion report

Report back: any new tokens added (and to which group), the Giscus theme chosen, any spec-vs-PNG discrepancies, whether the out-of-`src` token import worked, and any place a spec could not be satisfied without structural change (should be none).

---

*After this step, Phase 2 exit criteria are in reach: public URL rendering all three screens styled, CI green, Giscus live. Remaining before "PoC live" is the content side — published nodes replacing stubs.*
