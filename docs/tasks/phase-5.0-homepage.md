# Task Brief — Phase 5.0: Real Homepage

**Destination:** `docs/tasks/phase-5.0-homepage.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** owner-directed. The Step 2.5 landing (`src/app/page.tsx`, structure-only, styling deferred at 2.9 and never revisited) is replaced by a real homepage. A Claude Design mockup established the direction; this brief is the authoritative translation of that mockup into the shipped design system. **The mockup is direction, not source** — its markup (inline styles, its own nav, its invented palette, its seeded fake graph, its GitHub URL) is not copied. Where the mockup and the token system disagree, the token system wins, per the translation table below.

**Read first:** `docs/design/components.md`, `docs/design/direction.md`, `docs/design/tokens.css`, `src/components/Shell.tsx`, `src/components/network/layout.ts` (and how `/network`'s page feeds it), the landing section of `src/app/node/[slug]/node-page.css`, `CONTRIBUTING.md`, and a skim of `docs/writing-a-lesson.md`. Documents win over this brief's prose, as always.

## Mockup → system translation table (binding)

| Mockup value | Ships as |
|---|---|
| Its own top nav (dot + wordmark + three links) | **Discarded.** The existing `<Shell />` renders unchanged, no active tab. |
| System sans + Fraunces stub | **Spectral** via the `--type-*` roles; eyebrows/labels via the `--type-h2-mono` set (12px, 0.12em, uppercase). No font additions. |
| Canvas `#100c08`, surface `#191512` | `--color-canvas`, `--color-surface` (identical values in the default theme — the mockup borrowed them). |
| Borders `#2c2620` / `#241f19` | Existing hairline tokens (`--color-border-input` or whichever hairline `components.md` assigns to framed containers/dividers — executor picks per the recorded language, records the choice). |
| CTA fill `#c98a4b`, hover `#efe1bc` etc. | `--color-accent` / `--color-accent-hover`, matching whatever primary-CTA treatment already exists (the landing's current first-link style is the precedent). |
| Accent trio `#c98a4b` / `#a8654f` / `#7a97a3` | `--paradigm-functionalism` / `--paradigm-conflict` / `--paradigm-interactionism`. The real trio is teal / rose / amber — the hues change from the mockup; that is correct. |
| Fourth (green `#8f9f7a`) accent | No fourth paradigm token exists. The Sociologists card and any fourth mark use a muted/neutral token, consistent with its disabled state. |
| Text grays (`#f5efe4`, `#b8afa0`, `#8a8071`, `#6f6759`) | Existing heading / body / muted text tokens; no per-shade improvisation. |
| Radii 28 / 18 / 10 / 9px | `--radius-xl` (main panels: hero frame, contribute band), `--radius-lg` or `--radius-md` (cards, glyph chips) per the recorded radius roles. The mockup's oversized radii do not enter the system. |
| `clamp()` paddings | Space tokens + the responsive patterns already in use; no bare px. |
| Seeded mulberry32 graph | **Deleted.** Replaced by the real network layout (Item 2). |
| `github.com/learn-sociology/learn-sociology` | `https://github.com/LTaniguti/learn-sociology`. |

Standing rules apply in full: no new hex anywhere in the diff; static export; no new dependencies; no client component unless something genuinely needs interactivity (nothing on this page does — the Shell brings its own).

## Item 1 — Page structure

Replace the Step 2.5 landing body in `src/app/page.tsx` with the new page: Shell, hero, modes grid, contribute band, footer. The old `.landing` styles in `node-page.css` are removed or replaced; where the homepage styles live (extend the existing stylesheet's landing section vs. a dedicated file) follows whatever convention `components.md` records for per-frame styles — executor judges, records. Heading order is sane (one `h1` in the hero; section headings `h2`), sections are landmarks or labeled regions per the existing pages' pattern.

## Item 2 — Hero

Left column: `h1` "Learn sociology the way ideas actually connect." set in the `--type-title` role (if the title size reads undersized at hero scale on desktop, a display-size type token may be added to `tokens.css` — type tokens are how the system grows; hex may not — record it). Lede paragraph beneath in the `--type-lede` role, adapted from the mockup: free, open, a graph of concepts, walk it as a course or jump to the ideas you're after. **The concept count is derived, not hardcoded** — pull it from the content pipeline (`getAllNodes().length`) so the sentence stays true as contributors add nodes. Two CTAs: primary **Start the course** → `/course` (accent fill, existing primary treatment); secondary **Explore the concept map** → `/network` (quiet/outline treatment from the existing button language). Both are `Link`s; focus ring per the global rule.

Right column: the network snapshot, replacing the mockup's placeholder art. Requirements:

- **Real data, build time.** Reuse `layoutNetwork()` from `src/components/network/layout.ts` with the same inputs the `/network` page assembles, in a server component. Render the resulting geometry as a **static inline SVG**: edges as hairline strokes, nodes as small dots, no labels, no pills, the full graph extent fit into the frame — the "very zoomed-out" view. No d3, no zoom behavior, no client JS, no modification to `layout.ts` or either shipped canvas (import only — the canvas-fingerprint gate stays trivially satisfied and the diff must contain no canvas-file changes).
- **Determinism.** Identical coordinates across builds and reloads — `layoutNetwork` provides this; introduce no randomness on top (the mockup's seeded jitter is exactly what not to port).
- **Color.** Node dots use the same paradigm→node mapping the hierarchy tree's paradigm dots use, via the `--paradigm-*` tokens; nodes outside that mapping take the neutral dot treatment the tree uses. Edges use a muted/hairline stroke token. Everything themes — verify all three.
- **Frame & link.** The SVG sits in a framed panel: `--color-surface` fill, hairline border, `--radius-xl`, space-token padding — the same container language as the 4.9 band and the preview card. The **entire panel is one `Link` to `/network`** with an `aria-label` ("Explore the concept network" or similar), visible focus ring, and the existing hover-tint language; the SVG internals are `aria-hidden`.
- Mobile: the panel stacks under the hero text at narrow widths (mockup's flex-wrap intent), full width, no overflow at 390.

## Item 3 — Modes grid

Eyebrow heading "Four ways in" in the `--type-h2-mono` treatment. Grid of four cards, `auto-fit/minmax` responsive like the mockup's intent, existing card language (surface, hairline, card radius, space-token padding).

- **Three live cards** — Linear course → `/course`, Concept hierarchy → `/hierarchy`, Concept network → `/network`. The **whole card is the link** (one `Link` per card), hover tint + focus ring per the global rules. Card anatomy: small glyph chip (paradigm-token fills, one per card, matching the trio order the site already uses), serif title, short body. Mockup body copy is approved as the base; tighten freely, no marketing fluff.
- **Fourth card: Sociologists — honest-disabled**, mirroring the Shell's disabled tab (the recorded "advertise the roadmap honestly" principle): rendered muted, not interactive, no link semantics, with a small "planned" marker in the mono-label treatment. Replace the mockup's literal "Placeholder text:" body with real copy — e.g. profiles of the thinkers behind the concepts, linked into the graph where their ideas appear — phrased as forthcoming. Neutral/muted chip, not a paradigm accent.

## Item 4 — Contribute band

Replaces the mockup's generic "Open by design" copy. Same framed-band container language as Item 2's panel (`--color-surface`, hairline, `--radius-xl`, generous space-token padding), two-column at width, stacking below.

Left column, sourced from `CONTRIBUTING.md` (which remains the source of truth — link to it rather than duplicating its rules; if any phrasing here conflicts with it, the document wins):

- Heading (serif): "Built in the open" or similar.
- Paragraph 1: content adapted from OpenStax *Introduction to Sociology 3e* (CC BY 4.0); code MIT; the whole thing is a public repository anyone can read and improve.
- Paragraph 2 — the actual pitch, per CONTRIBUTING.md's "what we need most": every seed concept exists with complete metadata and a placeholder body, and **each stub is an article waiting for an author**. Writing a lesson happens **entirely in the browser — no local setup** — following the step-by-step tutorial; claim a concept by commenting on its module Issue, submit as a draft PR, review takes it from there.
- Links (styled per existing link/CTA language): **How to contribute** → `CONTRIBUTING.md` on GitHub, and **Write your first lesson** → `docs/writing-a-lesson.md` on GitHub. External `<a>`s, correct repo URL.

Right column: three compact marker rows (mockup's dot-list anatomy, paradigm/accent token dots): "Write a lesson — all in the browser" · "Claim a concept with an Issue" · "Open a pull request as a draft". Executor may adjust wording against CONTRIBUTING.md; prose stays inside the 75ch measure.

## Item 5 — Footer

Top hairline divider. Left: the **official GitHub mark** (the octocat path — the mockup's SVG path is the official one and may be reused verbatim), rendered monochrome via `currentColor` so it themes by inversion and stays within GitHub's logo-usage rules (no recoloring, no modification), wrapped in a link to `https://github.com/LTaniguti/learn-sociology` with an `aria-label`; beside it, the repo path as muted mono text. Right: the license/attribution line — MIT code · CC BY 4.0 content · adapted from OpenStax *Introduction to Sociology 3e* — phrased consistently with the node pages' existing attribution footer (reuse its wording where it fits). Wraps cleanly at 390.

## Item 6 — Docs sync

`components.md`: a Homepage entry — anatomy (hero, snapshot panel, modes grid with the honest-disabled fourth card, contribute band, footer), the translation-table outcomes that set precedent (hero display type decision if taken, which hairline the framed panels use, the derived concept count), and the snapshot mechanism (build-time `layoutNetwork` reuse, static SVG, determinism note, paradigm dot mapping). Note the Step 2.5 landing's retirement.

## Verification

1. All three themes, all of: 390, 768, 1024, 1440 — geometry evidence per the standing substitution rule where screenshots fail; no horizontal overflow anywhere.
2. Hero snapshot: identical SVG output across two consecutive builds (diff the emitted markup — the determinism gate); node dots match the tree's paradigm mapping on spot-checked slugs; panel navigates to `/network` by click and by keyboard; focus ring visible.
3. All three live cards navigate correctly (click + keyboard); the Sociologists card is skipped by tab order and announces nothing interactive.
4. Concept count in the lede equals the pipeline's node count (and `lint:content` still green).
5. Contribute-band links resolve to the real files on GitHub; no copy contradicts `CONTRIBUTING.md`.
6. Footer mark inverts correctly per theme; link resolves; attribution line matches the node pages' phrasing.
7. No new hex (grep the diff); no canvas-file diffs; no new dependencies; lints + `lint:content` + build green; deploy success; live spot-check homepage at desktop and phone width, plus one click-through to each of the three views.

## Commits

One feature commit — `Feature: real homepage — hero with live network snapshot, mode cards, contribute band, footer (5.0)` — with `components.md` riding along. If the landing-style relocation is noisy, it may be split out first as `Chore: retire Step 2.5 landing styles (5.0)`.

## Stop and report (do not improvise past these)

- `layoutNetwork()` cannot be reused at build time without modifying it or a shipped canvas.
- No paradigm→node mapping is reachable for the dots (fall back to neutral dots + report; do not invent a mapping).
- The type scale genuinely cannot serve the hero and a new token seems wrong.
- Any conflict with `CONTRIBUTING.md`, `components.md`, or the token system — documents win; flag it.

## Report back

The translation-table decisions as implemented (hairline choice, radii, hero type, CTA treatments); the snapshot mechanism, its determinism evidence, and the dot-mapping source; the derived concept count; the contribute-band copy as shipped; per-theme verification; improvisations.
