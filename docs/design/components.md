# learn-sociology — Component Spec

Direction: **Open Commons** (dark). Every value references a token from `tokens.css`.
States not shown in the mockups (hover, keyboard focus, disabled) are defined here rather than left to the implementer.

**Global focus rule:** every interactive element (tab, row, node, chip, control, link) shows keyboard focus as `box-shadow: var(--focus-ring)` with `border-radius` matching the element and `outline: none`. Hover and focus are visually distinct: hover tints the surface, focus draws the amber ring. This is not repeated in every entry below — assume it applies to all focusable items.

---

## Top bar
- Height `--topbar-height` (58px); background `--color-surface-raised`; bottom border `--border-thin var(--color-border)`.
- Left→right: wordmark, mode tabs, then the chrome cluster pushed right (`margin-left:auto`): search box, then theme control.
- Padding `0 var(--space-6)`; children gap `var(--space-4)`.

### Wordmark
- "learn-sociology" · `--type-wordmark-family` / `--type-wordmark-size` / weight `--type-wordmark-weight`; colour `--color-text-heading`.

### Mode tabs
Four tabs: **Course**, **Hierarchy** (active pair), **Network**, **Sociologists** (disabled/future).
- Font `--type-tag-family` 12.5px; padding `var(--space-2) 13px`; radius `--radius-sm`.
- **Active:** background `--tab-active-bg`, text `--tab-active-text`.
- **Idle (enabled, not current):** text `--tab-idle-text`, transparent background.
  - *Hover:* background `--color-surface-hover`, border `--border-thin var(--color-border-accent)`.
  - *Focus:* focus ring.
- **Disabled (Network, Sociologists):** text `--tab-disabled-text`; no hover, no pointer, `cursor:default`, `aria-disabled="true"`, `title="Coming soon"`. Stays visible on purpose — advertises the roadmap. Never removed.

### Search box
- Pill: background `--color-surface`; border `--border-thin var(--color-border-input)`; radius `--radius-pill`; padding `var(--space-2) 15px`; width 240px.
- Leading `⌕` glyph + placeholder, both `--color-text-faint`, `--font-mono` 12px. Placeholder copy: "search title / summary…".
- *Focus:* focus ring + border → `--color-border-accent`.

### Theme control (shipped 3.1)
Three-segment control opening the right-hand chrome cluster (it carries the bar's `margin-left:auto`; search follows it). `role="radiogroup"`, `aria-label="Colour theme"`; each segment `role="radio"` with an `aria-label` spelling out the theme's full name (the visible labels are abbreviated to fit the 58px bar).
- **Labels:** `Default` · `Midnight` · `Light`, default first. `aria-label`s: "Open Commons default theme" / "Midnight Draft theme" / "Light theme". The default segment reads **Default**, not "Dark" (renamed 3.3) — two of the three themes are dark, so "Dark" named the wrong axis; what distinguishes this one is that it is the shipped default.
- Frame: border `--border-thin var(--color-border-input)`; radius `--radius-sm`. Segments carry no border of their own.
- Segment: `--font-mono` `--type-control-size`; text `--color-text-muted`; transparent background; padding `var(--space-2)`.
  - *Hover:* background `--color-surface-hover`, text unchanged — same treatment as `.shell-tab`.
  - **Active:** text `--color-accent`, **no** fill and no underline (direction.md rule 3 — exactly one amber treatment per element); hover on the active segment stays flat.
  - *Focus:* the global ring, plus `position:relative; z-index:1` so the neighbouring segment's background can't paint over the box-shadow.
- **Roving tabindex:** the group is one tab stop; ←/→/↑/↓ move within it and selection follows focus (standard radiogroup behaviour).
- Labels are display-only. Storage semantics are independent: absence of `data-theme` on `<html>` means the default theme; stored values are `midnight` / `light`.

---

## Collapse toggle (course syllabus · node rail)
One shape, mirrored: the syllabus toggle hugs the sidebar's right edge (`align-self:flex-end`, glyphs `⟨` / `⟩`), the node rail's hugs its left edge (`align-self:flex-start`, glyphs mirrored). Both sit at the top of the panel they control, against the border they collapse.
- Button: `--font-mono` `--type-control-size`; text `--color-text-muted`; background none; border `--border-thin var(--color-border-input)`; radius `--radius-sm`; padding `var(--space-1) var(--space-2)`.
  - *Hover:* background `--color-surface-hover`, text `--color-text-meta-warm`.
  - *Focus:* focus ring.
- **Collapsed panel:** width → `--rail-collapsed-width` (52px) via the grid template on the parent (`:has()`); panel padding narrows to `var(--space-6) var(--space-2)` (`--pad-rail`'s 24px sides would leave 4px of content box); `overflow:hidden`; the toggle recenters (`align-self:center`).
  - Collapsed contents are `display:none` — removed from layout **and** from the accessibility tree, so no focus trap behind a hidden panel.
  - Collapsing the node rail buys whitespace, not longer lines: `.node-main` keeps its 740px cap and recenters (`margin-inline:auto`) in the space gained.
- `aria-expanded` reflects the panel state; `aria-label` swaps between "Show/Hide syllabus" and "Show/Hide details".
- State is device-local, one localStorage key each (`lib/syllabus.ts`, `lib/rail.ts`) — deliberately **not** folded into `progress.ts`: a layout preference is a different concern from lesson completion and must not share its storage shape. Contrast the hierarchy canvas, whose collapse state is session-ephemeral React state.
- Desktop-only affordance; at ≤640px both panels already stack and the toggle is moot.

---

## Sidebar — module header (Course view)
- Font `--type-eyebrow-family` 11.5px, weight 500, tracking 0.04em, uppercase.
- **Expanded:** leading `▾` in `--color-accent`; text `--color-text-meta-warm`; background `--color-surface-hover`; radius `--radius-sm`; padding `9px 11px`.
- **Collapsed:** leading `▸`; row shows title + right-aligned lesson count in `--color-text-faint`; text `--color-text-related`→ use `--type-eyebrow` mono 11.5px, colour `#a7997f` (token `--color-text-related` is close; collapsed modules use muted warm). *Hover:* background `--color-surface-hover`.

## Sidebar — lesson item
Font `--type-body-family` 14px; padding `8px 11px`; radius `--radius-sm`.
- **Complete:** leading `✓` in `--state-complete-mark`; label `--state-upcoming-text` (dimmed, since done & de-emphasised).
- **Current:** leading `●` in `--state-current-bar`; label `--state-current-text` weight 600; background `--state-current-bg`; left bar `--border-accent solid --state-current-bar`, radius `0 --radius-sm --radius-sm 0`.
- **Upcoming:** leading `○` in `--state-upcoming-mark`; label `--color-text-body`.
  - *Hover (any non-current):* background `--color-surface-hover`.

## Progress indicator
- Track: height 8px, background `--progress-track`, radius `--radius-sm`.
- Fill: `--progress-fill`, width = % complete (12/50 → 24%).
- Caption below: `--font-mono` 11px, `--color-text-muted`: "12 of 50 lessons complete · device-local" ("device-local" in `--color-text-faint`).

## Previous / Next controls
- Two equal cards; border `--border-thin var(--color-border-input)`; background `--color-surface-sunken`; radius `--radius-lg`; padding `13px var(--space-4)`.
- Line 1: direction label `--font-mono` 10.5px `--color-text-muted` ("← Previous" / "Next →"). Line 2: adjacent lesson **title** `--font-serif` 14.5px `--color-text-body`. Next card is right-aligned.
- *Hover:* border `--color-border-accent`, background `--color-surface-hover`.
- *Disabled (no prev/next at ends):* text `--color-text-disabled`, no hover, `cursor:default`.

---

## Hierarchy canvas (shipped 3.2)
The canvas is SVG-in-DOM, never a `<canvas>` bitmap: canvas-based graph libraries bypass CSS tokens, theming, and focus semantics, and SVG elements keep all three for free. **d3-hierarchy computes coordinates and never touches the DOM; React renders the settled result.** Mode 3's network canvas reuses this exact split with d3-force.

- **Surface:** page background `--tree-canvas-bg`; the canvas itself carries the dotted grid — `radial-gradient` dots in `--tree-dot`, `--border-thin` radius, on a `--space-6` grid. The grid lives on the inner canvas so it scrolls with the tree.
- **Viewport:** scrolls both axes and owns the scrolling (the page is pinned to `100dvh - --topbar-height`), so the document itself never scrolls.
- **Geometry constants live in `layout.ts`, not `tokens.css`.** Row pitch, node height, column gap, canvas padding, and the two font sizes are layout *inputs consumed by JS* — SVG text cannot be measured server-side, so pill widths come from a per-character-class estimate. They cannot be CSS variables. `DESKTOP_GEOMETRY` and `MOBILE_GEOMETRY` are the two sets; the mobile pass tightens pitch and column gap but holds `nodeHeight` at 40px to keep the tap target. Node *styling* — fills, strokes, radii, type — stays entirely in `hierarchy-canvas.css` via tokens.

### Tree node
Base: background `--tree-node-bg`; border `--border-thin var(--tree-node-border)`; radius `--radius-md`; serif label `--type-node-label-size` `--color-text-body`.
- **Expanded (parent/root):** leading `−` in `--color-accent`; background `--tree-node-open-bg`; border `--tree-node-open-border`; label weight 600 `--color-text-strong`.
- **Collapsed with descendants:** trailing count badge (e.g. `+5`) — `--font-mono` `--type-caption-size`, `--tree-badge-text`, border `--border-thin var(--tree-badge-border)`, radius `--radius-pill`. The badge **is** the expand control; the leading `−` is the collapse control. Both carry an invisible `.hcnode-hit` rect sized for touch.
- **Leaf (paradigm children):** leading paradigm dot `--paradigm-dot-size` (`--paradigm-*`) + label. Leaves with no paradigm tag fall back to `--tree-badge-border`.
- **Non-published (stub/draft/review):** the pill's stroke goes dashed (`stroke-dasharray: var(--space-1) var(--space-1)`) — the honesty treatment carried over from the draft banner. Status is never conveyed by colour alone.
- **Previewed (selected):** stroke → `--tree-node-open-border`, held while the card is up.
- *Hover:* fill `--color-surface-hover`; raises the preview card (desktop, 150ms grace period on exit so the pointer can cross the gap into the card).
- *Focus:* **SVG adaptation of the global focus rule.** `box-shadow` does not paint on SVG elements, so the ring is drawn as a stroke on the pill instead — `--focus-ring-color` at `--focus-ring-width`, the same tokens the box-shadow ring uses, with `outline:none` on the group.
- **Connectors:** SVG bézier `<path>` strokes; inactive `--color-edge` at `--border-thin`, the root→previewed path `--color-edge-active` at `--border-med`. Edges are `aria-hidden` — the tree semantics carry the structure. Cross-links / prerequisites are deliberately **not** drawn here: this is a pure tree from the single `parent` field. (Mode 3 is where those edges live.)
- **Keyboard:** WAI-ARIA treeview. `role="tree"` on the SVG, `role="treeitem"` per node with `aria-level` / `aria-setsize` / `aria-posinset` / `aria-expanded`; roving tabindex makes the whole tree one tab stop. ↑/↓ walk visible rows (pre-order), → expands then descends, ← collapses then ascends, Home/End jump to first/last, Enter toggles the preview, Esc dismisses it.
- Collapse state is **session-ephemeral React state**, not persisted — a deliberate choice keeping `progress.ts` the sole localStorage owner for content state; revisitable if users ask.

### Preview card
- Raised on node hover/focus (desktop) or pinned by click/Enter; the pinned selection wins over a transient hover. Dismissed by Esc or an outside click.
- Background `--color-surface-raised`; border `--border-thin var(--color-border-accent)`; radius `--radius-lg`; padding `15px 17px`; shadow `--shadow-pop`; width `21em`, capped `82vw`.
- **Anchoring:** positioned in canvas coordinates beside the node — right of it by default, **flipping to the left** when the right side would leave the visible viewport, then clamped so the card stays on screen. Near a scrolled-in edge the flip may overlap the node; that beats being off-screen. Anchoring is inherently two-pass — the card must render hidden before its size is known.
- Contents: concept title (serif `--type-card-title-size` `--color-text-strong`) + difficulty badge (top row); one-sentence summary (serif `--type-card-summary-size` `--color-text-body`); a `status:` line in `--status-draft-text` **only when the node is not published**; tag chips; and an amber "Open lesson →" affordance (`--font-mono` `--type-control-size` `--color-accent`, hover `--color-accent-hover`).

### Canvas controls
- Toolbar row above the canvas: "Expand all" / "Collapse all" pills — `--font-mono` `--type-control-size`, text `--color-text-meta-warm`, border `--border-thin var(--color-border-input)`, radius `--radius-sm`; hover `--color-surface-hover`. Wraps at ≤640px.
- The structure toggle (Node & edge / Rows) and the zoom stepper specified here pre-3.2 were **not** built: the rows variant was retired outright (see open question (a)), and zoom belongs to Mode 3's force canvas, where panning is unbounded — the hierarchy canvas scrolls instead.
- Footnote below the canvas (`--font-mono` `--type-control-size` `--color-text-faint`) states the parent-field rule, so the missing cross-links read as a decision rather than an omission.

---

## Breadcrumb
- `--type-breadcrumb-*`; colour `--color-text-muted`; separators " / ". Final (current) crumb in `--color-accent`. On the node page: "Sociology / Deviance / **Labeling Theory**".

## Draft-status banner (required)
- Dashed border `--border-thin var(--status-draft-border)`; background `--status-draft-bg`; radius `--radius-md`; padding `12px 15px`; leading `◆` in `--status-draft-icon`.
- Text `--font-mono` 11.5px `--status-draft-text`, with "status: draft" in `--status-draft-strong` bold. Copy: "status: draft — this lesson has not yet passed review. Content may change before publication."
- **review** and **published** statuses: review reuses the same frame with copy "status: in review"; published hides the banner entirely (the only status that does).

## Difficulty badge
Pill, `--type-badge-*`, radius `--radius-pill`, padding `5px 12px`, border `--border-thin`.
- **intro:** text `--diff-intro-text`, border `--diff-intro-border`.
- **intermediate:** text `--diff-intermediate-text`, border `--diff-intermediate-border`.
- **advanced:** text `--diff-advanced-text`, border `--diff-advanced-border` (defined here; not in mockups).

## Tag chip
- `--type-tag-*`; border `--border-thin var(--color-border-input)`; radius `--radius-xs`; padding `4px 9px`; text `--color-text-meta-warm`.
- **paradigm/* tag** is emphasised: text `--color-accent`, border `--color-border-accent`.
- *Hover (when tags become filter links, future):* border `--color-border-accent`.

## "Before this lesson" prerequisites callout
- Container: border `--border-thin var(--color-border-input)`; background `--color-surface-sunken`; radius `--radius-lg`; eyebrow "Before this lesson" (`--type-eyebrow-*`, `--color-text-muted`).
- Each prerequisite is a chip carrying **its own** completion state:
  - **Met (complete):** `✓` `--state-complete-mark`; bg `--state-complete-bg`; border `--state-complete-border`; label `--state-complete-text`; trailing "complete" caption `--state-complete-label`.
  - **Unmet (incomplete):** `○` `--state-unmet-mark`; bg `--state-unmet-bg`; border `--state-unmet-border`; label `--state-unmet-text`; trailing "incomplete →" `--state-unmet-label`; the chip is a link to that lesson. *Hover:* border `--color-border-accent`, bg `--color-surface-hover`.

## Perspectives section (the multi-lens signature)
- Serif heading (`--type-h2-serif-*`, `--color-text-strong`) + mono count "3 paradigms · 1 concept" (`--color-text-muted`) + italic serif subhead.
- **Desktop:** three equal columns (`grid`, gap `--space-4`), each a card with a `--border-accent` **top** bar in its paradigm colour, tinted surface (`--paradigm-*-surface`), radius `0 0 --radius-md --radius-md`. Column eyebrow = paradigm name in its colour (`--font-mono` 10.5px uppercase).
  - The concept's **home** paradigm (here Interactionism) is emphasised: inset ring `--color-accent-ring`, a "HOME" badge (mono 8.5px, `--color-surface` text on `--color-accent`), and slightly brighter body text.
- **Mobile:** the three become stacked cards with a `--border-accent` **left** bar instead of top; same colours, same home emphasis.
- Order is always functionalism → conflict → interactionism, regardless of which is home. Never collapse to a single narrative.

## Related-links list
- Eyebrow "Related concepts" (`--type-eyebrow-*`, `--color-text-muted`).
- Each row: a **paradigm colour tag** (denoting the paradigm the related concept sits in — teal/rose/amber from `--paradigm-*`) + serif label (`--type-related-*`, `--color-text-related`), hairline divider `--border-thin var(--color-border-subtle)`, trailing `→` hidden until hover.
  - Colour-tag shape is tokenised as a small swatch: bar (4×16, `--radius-xs`), dot (9×9 circle), or pill (22×10) — see Tweaks `relatedTagShape`; default **bar**.
  - *Hover:* label → `--color-accent-hover`; `→` fades in (`--transition-fast`).
- Thinkers list (Howard Becker, Edwin Lemert) sits below as **plain serif text, not links** (`--color-text-body`), with a mono caption "plain text — links arrive with Mode 4".

## Mini-tree locator ("In the map")
- Card: border `--border-thin var(--color-border)`; background `--color-surface`; radius `--radius-lg`; padding `--space-4`.
- Mono 12px ASCII tree (`--color-text-muted`) with the current node highlighted `--color-accent` + `●`. Whole card is a link into the Hierarchy view; trailing "open in hierarchy →" caption `--color-text-disabled`. *Hover:* border `--color-border-accent`, bg `--color-surface-hover`.

## CC BY attribution footer (required)
- Top border `--border-thin var(--color-border)`; `--font-mono` 11px `--color-text-muted`; source title in `--color-text-meta-warm`, "CC BY 4.0" in `--color-accent`.
- Copy (verbatim): "Adapted from OpenStax Introduction to Sociology 3e, §7.2 — CC BY 4.0. Changes were made. See LICENSE-CONTENT.md." Always present on content screens; never hidden.

## Reserved discussion region (deferred — do not build)
- A dashed placeholder below Examples: border `--border-thin dashed var(--color-border-input)`, radius `--radius-md`, mono `--color-text-disabled` note "// reserved — lesson discussion (Giscus, deferred)". Holds the space; ships empty.

---

## Open questions — decided answers

### (a) Hierarchy: structured rows or organic node-and-edge canvas? — **RESOLVED in 3.2**
**Shipped decision: the node-and-edge canvas is the only hierarchy view. The rows variant was retired, not kept as a toggle.**

The original answer (canvas as default, rows preserved behind a toolbar toggle) was hedged against two risks that did not materialise. Rows were justified as the accessible, low-power fallback — but the shipped canvas is SVG-in-DOM with a full WAI-ARIA treeview (roving tabindex, `aria-level`/`setsize`/`posinset`, arrow-key walk), so it is *already* the accessible rendering; a second tree would have been a second accessibility surface to maintain, not a safety net. And d3-hierarchy computing coordinates outside the DOM proved cheap enough at 53 nodes that "if the graph layer is heavy" never applied.

Retiring it removed the toggle, its device-local persisted state, and a duplicate render path — the toolbar keeps only Expand/Collapse all. What survives from the original reasoning is the premise: a literal node-and-edge canvas makes *ideas as a connected network* the first thing a learner sees. The parent-field-only rule also survives — the canvas draws parent→child edges and nothing else; prerequisite and related links are Mode 3's subject.

### (b) Tap-to-preview on touch (no hover)
The hover preview card can't exist on touch, so the tree splits the interaction into two taps:
1. **First tap → preview.** The tapped node expands in place into its preview card (summary, difficulty badge, tag chips, and an "Open lesson" button). Any previously open preview collapses. Nothing navigates yet.
2. **Second tap → open.** Tapping "Open lesson" (or the same node again) navigates to the node page. Tapping a node's expand/collapse control still just expands/collapses children as usual; the preview is a separate affordance from the expander.
This keeps parity with desktop (hover = preview, click = open) while remaining fully operable by touch, and needs no data beyond what the node already has.
