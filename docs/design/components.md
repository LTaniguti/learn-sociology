# learn-sociology — Component Spec

Direction: **Open Commons** (dark). Every value references a token from `tokens.css`.
States not shown in the mockups (hover, keyboard focus, disabled) are defined here rather than left to the implementer.

**Global focus rule:** every interactive element (tab, row, node, chip, control, link) shows keyboard focus as `box-shadow: var(--focus-ring)` with `border-radius` matching the element and `outline: none`. Hover and focus are visually distinct: hover tints the surface, focus draws the amber ring. This is not repeated in every entry below — assume it applies to all focusable items.

---

## Top bar
- Height `--topbar-height` (58px); background `--color-surface-raised`; bottom border `--border-thin var(--color-border)`.
- Left→right: wordmark, mode tabs, then search box pushed right (`margin-left:auto`).
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

## Tree node (Hierarchy view)
Base: background `--tree-node-bg`; border `--border-thin var(--tree-node-border)`; radius `--radius-md`; serif label 13.5px `--color-text-body`.
- **Expanded (parent/root):** leading `−` in `--color-accent`; background `--tree-node-open-bg`; border `--tree-node-open-border`; label weight 600 `--color-text-strong`.
- **Collapsed with descendants:** trailing count badge (e.g. `+5`) — `--font-mono` 10px, `--tree-badge-text`, border `--border-thin var(--tree-badge-border)`, radius `--radius-pill`. (Node-&-edge canvas shows `+5`; ruled-rows variant shows a `[+]` control plus the number.)
- **Leaf (paradigm children):** leading paradigm dot 7px (`--paradigm-*`) + label.
- *Hover:* background `--color-surface-hover`; raises the preview card (desktop).
- *Focus:* focus ring.
- **Connectors:** SVG bézier strokes; inactive `--color-edge`, path toward the open node `--color-edge-active` at `--border-med`. Cross-links / prerequisites are deliberately **not** drawn — this is a pure tree from the single `parent` field.

## Hover preview card
- Raised on node hover/focus (desktop). Background `--color-surface-raised`; border `--border-thin var(--color-border-accent)`; radius `--radius-lg`; padding `15px 17px`; shadow `--shadow-pop`.
- Contents: concept title (serif 15px `--color-text-strong`) + difficulty badge (top row); one-sentence summary (serif 13px `--color-text-body`); tag chips; and an amber "Open lesson →" affordance (`--font-mono` 11.5px `--color-accent`).

## Canvas controls
- Toolbar row above canvas: "Expand all" / "Collapse all" pills (`--font-mono` 11.5px, text `--color-text-meta-warm`, border `--border-thin var(--color-border-input)`, radius `--radius-sm`); a structure toggle (Node & edge / Rows); and a zoom stepper (− / % / +). Active toggle segment uses `--color-accent` bg + `--color-surface` text; idle segment `#a7997f` text.

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

### (a) Hierarchy: structured rows or organic node-and-edge canvas?
**Decision: organic node-and-edge canvas is the default; structured rows are preserved as a toggle.**
Why: the project's premise is *ideas as a connected network*, and a literal node-and-edge canvas makes that the first thing a learner sees — it's the strongest expression of the brand and reads as exploration rather than a filesystem. It costs more to build (needs a graph/layout layer — e.g. a tidy-tree layout feeding SVG bézier edges, or a library like d3-hierarchy / React Flow). The **rows** variant is kept because it is HTML/CSS-only, accessible by default, faster on low-power/touch devices, and better for dense browsing; it renders the *same* `parent`-field tree. Ship the canvas as the default Mode 2 with a "Rows" toggle in the toolbar (state persisted device-local), so no learner is blocked if the graph layer is heavy. Both draw only parent→child edges; prerequisite/related links are never drawn here.

### (b) Tap-to-preview on touch (no hover)
The hover preview card can't exist on touch, so the tree splits the interaction into two taps:
1. **First tap → preview.** The tapped node expands in place into its preview card (summary, difficulty badge, tag chips, and an "Open lesson" button). Any previously open preview collapses. Nothing navigates yet.
2. **Second tap → open.** Tapping "Open lesson" (or the same node again) navigates to the node page. Tapping a node's expand/collapse control still just expands/collapses children as usual; the preview is a separate affordance from the expander.
This keeps parity with desktop (hover = preview, click = open) while remaining fully operable by touch, and needs no data beyond what the node already has.
