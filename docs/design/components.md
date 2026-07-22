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
Four tabs: **Course**, **Hierarchy**, **Network** (all live as of 3.3), **Sociologists** (disabled/future — now the only one).
- Font `--type-tag-family` 12.5px; padding `var(--space-2) 13px`; radius `--radius-sm`.
- **Active:** background `--tab-active-bg`, text `--tab-active-text`.
- **Idle (enabled, not current):** text `--tab-idle-text`, transparent background.
  - *Hover:* background `--color-surface-hover`, border `--border-thin var(--color-border-accent)`.
  - *Focus:* focus ring.
- **Disabled (Sociologists only, since 3.3):** text `--tab-disabled-text`; no hover, no pointer, `cursor:default`, `aria-disabled="true"`, `title="Coming soon"`. Stays visible on purpose — advertises the roadmap. Never removed.

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
- **Per-module rollup (4.2):** the header is a flex row — the `▸/▾` marker and title hold the leading edge; a quiet **"n of m"** count plus a **thin fill bar** sit at the trailing edge (`margin-left:auto`), visible whether the module is expanded or collapsed (rendered inside `<summary>`). The count is `--font-mono` `--type-tag-size`, un-cased (it is data, not an eyebrow), `--color-text-faint`; the bar is the [Progress indicator](#progress-indicator) track/fill scaled to a 40×3px chip (`--progress-track` / `--progress-fill`), the fill transitioning `width var(--transition-fast)` so a mark-complete advances it. Both counts route through the single `completionFor` rollup (`ModuleProgress.tsx`).

## Sidebar — lesson item
Font `--type-body-family` 14px; padding `8px 11px`; radius `--radius-sm`.
- **Complete (upgraded 4.2, reworked 4.3):** completion reads as *state*, not a de-emphasis. The leading mark is now the drawn **[completion seal](#completion-seal-43)** (was a text `✓` in `--state-complete-mark`); **row background `--state-complete-bg`**; label `--state-complete-text` — the same `--state-complete-*` family as the prerequisite chips and the canvas pills. (Was: dimmed `--state-upcoming-text` with no fill.) The row already transitions `background var(--transition-fast)`, so mark-complete lands as a quiet tint while the module fill advances over the same `--transition-fast`. **That row-tint + fill-advance is the entire animation budget** for completion — no confetti, no pulse; the reward register stays with gamification's future phase. Under `prefers-reduced-motion` the global `transition:none` rule swaps every state instantly. `LessonCheck` is **kept as the mark renderer** — as of 4.3 it renders the seal SVG inside the `.lesson-check` span (moved to the leading edge via `order:-1`; `--seal-ink` = the sidebar paper `--color-surface-sunken`), and the row's `:has()` selector still keys off that span. The **current** row keeps `●` winning over the seal (the seal is hidden on `aria-current` rows, 4.2 precedence). Write path and `PROGRESS_EVENT` wiring untouched.
- **Current:** leading `●` in `--state-current-bar`; label `--state-current-text` weight 600; background `--state-current-bg`; left bar `--border-accent solid --state-current-bar`, radius `0 --radius-sm --radius-sm 0`. **Current wins over complete** (higher `:has()` specificity): the current lesson keeps its amber bar even when also complete, with the `✓` preserved.
- **Upcoming:** leading `○` in `--state-upcoming-mark`; label `--color-text-body`.
  - *Hover (any non-current):* background `--color-surface-hover`.

## Progress indicator
- Track: height 8px, background `--progress-track`, radius `--radius-sm`.
- Fill: `--progress-fill`, width = % complete (12/50 → 24%).
- Caption below: `--font-mono` 11px, `--color-text-muted`: "12 of 50 lessons complete · device-local" ("device-local" in `--color-text-faint`).
- **One rollup derivation (4.2).** This footer count, the per-module counts, and any later discipline rollup all derive from **`completionFor(slugs)`** in `src/lib/progress.ts` — a manifest (or tag) slug list intersected with per-node progress. Completion is **never stored per course/module/discipline**; the storage shape (`learn-sociology:progress:v1`, flat slug → bool) and key are frozen. See the *Completion invariant* in `docs/schema.md`. No consumer counts completion outside this function.

## Previous / Next controls
- Two equal cards; border `--border-thin var(--color-border-input)`; background `--color-surface-sunken`; radius `--radius-lg`; padding `13px var(--space-4)`.
- Line 1: direction label `--font-mono` 10.5px `--color-text-muted` ("← Previous" / "Next →"). Line 2: adjacent lesson **title** `--font-serif` 14.5px `--color-text-body`. Next card is right-aligned.
- *Hover:* border `--color-border-accent`, background `--color-surface-hover`.
- *Disabled (no prev/next at ends):* text `--color-text-disabled`, no hover, `cursor:default`.

## Lesson host — completion control (Course view, two modes as of 4.4)

The course view's `course-controls` block branches on the lesson's mode (see
*Two modes* under [Self-check quiz](#self-check-quiz-selfcheck--41) for the full
doctrine). The node page has no completion control in either mode and gains none.

- **Manual mode** (no published quiz, or a reflect-only one) — the
  **`MarkCompleteButton`**, the screen's single amber action: `--color-accent`
  fill, `--color-surface` label, `--font-mono` `--type-control-size`, `--radius-sm`
  (hover `--color-accent-hover`). Done state flips to `aria-pressed="true"` —
  `--state-complete-bg` fill, `--state-complete-text` label,
  `--state-complete-border` edge — carrying the [completion seal](#completion-seal-43)
  (`1.05em`, `--seal-ink` = `--state-complete-bg`) after the "Completed" text.
  Marks and unmarks freely. The 4.3 lock (disabled state + caption) was **stripped**
  in 4.4 — a manual-mode lesson has no published choice-quiz to lock on.
- **Mastery mode** (published quiz, `choiceCount > 0`) — **no button**. In the
  same slot, a **status line** (`LessonStatus`), house register, not a control (a
  control that can never be clicked is not a control):
  - *Not yet finished:* **"Complete the self-check below to finish this lesson."** —
    caption vocabulary (`--type-caption-family` `--type-tag-size`,
    `--color-text-muted`), not a banner, not a disabled button.
  - *Finished:* the [completion seal](#completion-seal-43) (`1.05em`, `--seal-ink`
    = `--color-canvas`) + **"Lesson complete."** in the `--state-complete` label
    vocabulary (`--font-mono` `--type-control-size`, `--state-complete-label`).
  - The line reads completion from the one store (`isComplete`, re-read on
    `PROGRESS_EVENT`) and swaps between the two states over `--transition-fast`;
    the global `prefers-reduced-motion` rule makes it instant. A `min-height` of
    `--space-6` holds the row across the swap. Renders the caption state until
    mounted, so static HTML and hydration agree.

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
- **Completed (4.2):** a completed node reads as done. Fill `--state-complete-bg`, border `--state-complete-border`, label `--state-complete-text` — the one `--state-complete-*` green shared with the syllabus, the prerequisite chips, and the network canvas (one meaning, one family, every surface). **Non-hue cue:** the drawn **[completion seal](#completion-seal-43)** (4.3; was a text `✓` stamp) in the pill's **top-trailing corner** — kept clear of the leading paradigm dot / expand glyph, and identical on the network canvas. Its `--seal-ink` is the canvas fill `--tree-canvas-bg`; `size=15` (canvas stamp). The corner seal (a shape, presence/absence) is the cue that survives colour-vision deficiency; colour never carries completion alone. Paint only (`pointer-events:none`) — completion feeds no layout, so the deterministic fingerprint is identical with progress present or absent. Completion is read after mount and re-read on `PROGRESS_EVENT` (the `LessonCheck` pattern), so it lights without a reload and the empty first render matches the server's. `aria-hidden` on the check — completion is announced in the course view, not re-spoken per pill.
  - **State interplay** (cascade order in `hierarchy-canvas.css`): completed is placed *after* `expanded` (a completed parent — the root is a lesson — keeps its green) and *before* `previewed` / `focus` (selecting a completed pill still swaps its border to the selection edge / focus ring; completion never swallows the selection cue). Fill+border only, so the non-published dash (a different property) still shows through: a completed-but-unpublished node is green + dashed + check. On the amber lineage path, the pill stays green + check while its edge goes `--color-edge-active`. None of these pairs become ambiguous.
- **Previewed (selected):** stroke → `--tree-node-open-border`, held while the card is up (ordered after the completed rule, so selection wins the border over a completed pill).
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

### Legend (added 4.2 — improvisation)
This canvas shipped without a legend (3.2). 4.2 adds a small **node-state key** so the completed pill has a home, in the network legend's muted-mono register (`--font-mono` `--type-caption-size`, `--color-text-faint`). It rides the **right of the controls row** (`margin-left:auto`), not an in-canvas overlay: the hierarchy viewport *scrolls*, and an absolute overlay would scroll away with the tree, so the legend lives in the canvas chrome instead. Two rows: **completed** (a `--state-complete-bg`/`--state-complete-border` pill swatch with the `✓`) and **not yet published** (dashed pill outline). The "not yet published" row is a small extension beyond the phase's "completed entry" ask — a one-row legend reads as an orphan, and the dashed treatment already shipped unlabelled on this canvas; the two node treatments now share one coherent key.

---

## Network canvas (Mode 3 — radial tidy tree of the hierarchy, v4 as of 3.6)
No hi-fi was ever drawn for this mode. Everything below is either inherited from the hierarchy canvas — deliberately, so the two modes read as one system — or improvised from `direction.md` and recorded here as the spec of record. History: v1 (3.3) a free force cloud, v2 (3.4) force-with-radial-constraint; **3.5 replaced both with a radial tidy tree**, and **3.6 (v4)** hardened it for real use. The 3.4 force description this section used to carry is retired — the paragraphs below are the shipped layout.

Same rendering contract as the hierarchy: SVG-in-DOM, **d3 computes, React renders**. `layout.ts` settles coordinates (from the hierarchy tree) and d3-zoom supplies the gesture math; neither touches the DOM. The zoom transform is React state, applied as one `<g transform>`.

- **Layout is a radial tidy tree of the Mode-2 hierarchy.** The rings *are* the `parent:` hierarchy — the same tree Mode 2 draws (`getTree()`), laid out radially by d3-hierarchy's `tree()`. Ring index is **declared specialization depth** (a node's depth in the curated `parent:` chain), not a BFS distance over the edge wiring, so Modes 2 and 3 share one source of truth for "how core is this concept" and can no longer disagree. The centre is structural — the hierarchy root (`sociology`) — not an editorial pin (`CENTER_SLUG` is retired). Sibling subtrees occupy contiguous angular sectors by tidy-tree construction, so the branch read is structural, not coaxed from forces.
- **The cross-link web is contextual, not constant.** Prerequisite/related edges that are *not* already a parent link render as a faint overlay and come forward only for the selected concept (see Edges). The idle picture is the tree; the relationships are on demand.
- **Determinism is by construction.** Reingold–Tilford over a fixed, course-ordered child list — no `Math.random`, no force jiggle anywhere in the module — so the same corpus settles into the identical picture run to run, server or client. The deterministic-fingerprint check (node transforms + tree-edge paths, identical across reloads) is a standing gate.
- **v4 geometry constants** (in `layout.ts`; geometry cannot be tokens — see the hierarchy note). 3.5's uniform `depth × ringSpacing 600` made the graph "too spaced out": one crowded ring set the spacing of all of them, inflating the extent so 390px fit collapsed into slivers. v4 attacks both sources:
  - **Two-line labels** (`wrapThreshold 18`, `lineAdvance 14`). Titles over 18 chars wrap onto two lines, balanced at the word boundary that minimises the wider line — no hyphenation, no truncation, every title fully readable. A wrapped pill is 54px tall (40 + 14, tap target preserved) with its two baselines ±7px of centre. The binding ring was set by depth-2's widest single-line pills; wrapping drops the **max pill width from 349 → 198px** (p90 287 → ~171), which is what lets every ring pull inward. A title of one long word can't wrap and stays single-line — an editorial finding for the content phase, not a layout failure.
  - **Per-ring, data-driven radii** (`minRingGap 260`, `sepGapArc 44`, `closeGap 0.06`). Each ring's radius is computed from its own angular gaps and pill widths: the minimum radius at which no adjacent pair overlaps (`angularGap × r ≥ (wᵃ + wᵇ)/2 + sepGapArc` — the chord ≈ arc bound, binding near the 12/6-o'clock seams), floored at `radius(d−1) + minRingGap` so rings never crowd each other radially. Pure function of the deterministic angles/widths. **Resolved radii: ring 1 = 517, ring 2 = 1035, ring 3 = 1552** (vs 3.5's 600 / 1200 / 1800); ring 1 (10 nodes) lands far closer in, ring 2 (30 nodes) is the binding ring. **Settled extent ~3153 × 2903** (desktop `padding 80`) / **~3073 × 2823** (mobile `padding 40`), down from ~3744 × 3576. Zero pill overlaps ring by ring (verified pair-by-pair as the acceptance test, not just the arc heuristic). Ring guides are drawn from the node radii, so they move to the computed radii automatically.
- **Effect ordering (3.6 P0 fix).** The d3-zoom behaviour is registered in a `useLayoutEffect` declared **before** the initial-view layout effect, because layout effects run in declaration order and the initial view calls `applyTransform`, which must find `zoomRef.current` already set to seed d3's internal `__zoom` to match the render. In 3.5 the registration was a *passive* effect (runs after layout effects), so the initial view hit `applyTransform`'s silent fallback, d3 stayed at identity, and the first wheel/drag/pinch gesture snapped the view toward identity — the "first-scroll teleport." The **silent fallback is removed**: if the behaviour is missing when a transform is applied, `applyTransform` fails loudly in dev (`console.error`) rather than desync quietly, which makes the whole class of drift bug impossible to reintroduce.
- **Surface, node pill, dashed non-published treatment, preview card:** identical to the hierarchy canvas — same tokens, same rules. Nodes carry a paradigm dot when tagged. There is no count badge and no expand affordance; a graph has no collapse.
- **Completed (4.2, reworked 4.3):** identical to the hierarchy canvas — `--state-complete-bg`/`--state-complete-border`/`--state-complete-text` pill with the same drawn **[completion seal](#completion-seal-43)** corner stamp (`--seal-ink` = `--tree-canvas-bg`, `size=15`), one meaning across both canvases. Paint only (`pointer-events:none`; layout untouched; the deterministic fingerprint is unchanged with progress present or absent), read after mount and re-read on `PROGRESS_EVENT`. Cascade order in `network-canvas.css`: completed sits *after* hover/neighbour (a completed neighbour keeps its green) and *before* `selected`/`focused`, so **selecting a completed pill still takes the amber selection surface** and the focus ring — **the seal persists** (a sibling of the box, unaffected by the fill swap), so completion stays legible under selection. The seal is legible at `fit` zoom and 1:1.
- **Selection is the one amber moment.** The selected pill takes `--tree-node-open-bg` / `--tree-node-open-border` and its label goes `--color-text-strong`; its **neighbours** take `--color-surface-hover`; its lineage and incident relationships light amber (see Edges). This is the graph's equivalent of the hierarchy's lit ancestor path — in a network, "where am I" means the local neighbourhood.
- **Layout is computed client-side only**, behind a mount gate — settling on the server as well would have to agree to the last float, and `Math.cos`/`Math.sin` are not required to be correctly rounded.

### Edges
Two layers. The **tree edges** (parent links) are the always-on structural skeleton — radial béziers at full `--color-edge`, `--border-thin`. The **cross-links** (prerequisite/related edges not already carried by a parent link) are the contextual overlay.

- **Idle cross-link** — `--color-edge-faint` (a per-theme low token, *not* an opacity: a whisper-opacity line vanishes on light paper). No arrowhead at whisper weight — a marker reads as dirt.
- **On selection, the incident cross-links light amber (v4).** In 3.5 they came up to `--color-edge` (prerequisite) and `--color-border-subtle` (related) — but `--color-edge` is the ink of all ~52 idle tree edges, so the relationships never changed hue and only the amber lineage read (the reported defect). Now both go **`--color-edge-active`**: the directed, load-bearing **prerequisite** at `--border-thin` plus an arrowhead (arrowhead fill is `--color-edge-active`; markers use `markerUnits="userSpaceOnUse"`, the default scales to stroke width and renders invisible at 1px); the symmetric **related** link the same amber a touch quieter (`opacity 0.75`) and unmarked. The prerequisite/related distinction stays carried by **the arrow and opacity, never by hue**, so it survives all three themes and colour vision deficiency. Related is deliberately **not** dashed: the dash is spent on non-published nodes, and one surface must not use a treatment for two unrelated meanings.
- **Lineage** — the selected concept's tree path back to the centre goes `--color-edge-active` at **`--border-med`**. It shares the amber with the incident relationships but reads as heavier (2px, curved bézier to centre) against their `--border-thin` straight lines with arrows — the one distinction Option A rests on, verified legible in Midnight and Light.
- **Field dimming under selection (v4).** A `has-selection` class on the transformed group (`.network-canvas-group.has-selection`) drops every tree edge that is neither lineage nor incident to `--color-edge-faint` (`transition-fast`). This is the high-leverage half: the lit amber pops because the idle skeleton steps back. Deselect returns the skeleton to full `--color-edge` with no residue. Incident relationships are separate `.nwcross` elements lit on their own; idle cross-links are already faint.
- Cross-links are trimmed to the pill boundary at both ends, so lines never emerge from under a label and arrowheads sit clear of the box.
- Only `prerequisites` and `related` are cross-links, and only where they are not already a parent edge (≈45 of 85 edges). **Shared-tag edges are excluded**: every node carries `discipline/sociology`, so they would produce a near-complete graph. Revisitable once the canvas has edge-class filtering.

### Ring guides
Muted dashed concentric circles behind the graph, one at each occupied ring radius, centred on the pinned core — wayfinding furniture that says "these nodes are the same distance from the core", not chrome. New token **`--color-ring-guide`** (in the edge group of every theme file), drawn at `--border-thin`, a **sparse `4 / 12` dash**, and ~0.55 opacity so they sit far behind. Deliberately **distinct from the non-published dash**: that treatment carries a node's publication status at full node-border prominence with a tight `4 / 4` dash; the two dashed meanings must never read the same. Sit below the edges and nodes in paint order, `aria-hidden`.

### Zoom controls
Vertical stack at the canvas's top-right: `+` / `−` / `fit`. `--font-mono` `--type-control-size`, text `--color-text-meta-warm`, background `--color-surface-raised`, border `--border-thin var(--color-border-input)`, radius `--radius-sm`; 32px square, **40px at ≤640px**. Hover `--color-surface-hover`; focus ring. Muted, never amber — the selection owns amber.
These are the accessibility floor: zoom must never require a wheel or trackpad, on desktop or touch. Double-click zoom is **off** (it fought node activation). Zoom has no transition at all, so `prefers-reduced-motion` has nothing to suppress.

### Legend
Bottom-left corner, always visible. `--font-mono` `--type-caption-size`, text `--color-text-faint`, on `--color-surface-raised` with a `--color-border-faint` hairline. Five rows (**completed** added 4.2): **rings = specialization depth** (dashed guide line), **hierarchy** (tree-edge bézier), **relationship (shown on select)** (faint line — the idle cross-link state), **completed** (a `--state-complete-bg` pill swatch with the `✓`), not yet published (dashed pill outline). The amber-on-select treatment is not swatched: the idle state is what the legend describes, and the lit state is self-evident once you select. Muted — it explains the picture, it is not part of it.

### Initial view (v4)
`fit` is the intent: seeing the whole territory is the point of the mode, and small labels at the overview are a feature — you read the shape, then zoom for names. **Fallback:** when the whole-graph fit lands below `MIN_FIT_SCALE 0.4` the pills stop reading as pills, and the initial view instead frames the **core neighbourhood** — the root plus all ten depth-1 concepts, `fitToCoreTransform` scaling their bounding box to fill the viewport. The learner opens on the centre and its specializations, legible, rather than one pill in a void (3.5's `390px` fallback centred the *single* core node at 1:1 — the reported "one pill in emptiness"). `fit` is one button away; the fallback is deterministic (same subset, same box).

**Fit decision per breakpoint** (extent ~3153 × 2903, height binding). Even after the v4 shrink, typical viewport heights keep full fit below the 0.4 floor, so **`fitToCoreTransform` is the initial view at all three standard breakpoints**; full-graph fit clears the floor only on very tall viewports (≳1160px height):

| Breakpoint | Viewport (network-viewport) | Full-fit scale | Initial view |
|---|---|---|---|
| Desktop 1440×900 | 1378 × 744 | 0.256 | fitToCore (k ≈ 0.60) |
| 768×1024 | 706 × 848 | 0.224 | fitToCore (k ≈ 0.54) |
| 390×844 (mobile) | 364 × 589 | 0.118 | fitToCore (k ≈ 0.29) |

Semantic-zoom (label-less discs below a scale threshold) was scoped as a conditional stretch (2d) and **not implemented**: the core-neighbourhood fallback keeps labels readable at 390px, so it was unnecessary. `#slug` deep links still centre + preview the target at 1:1 and own the initial view (unaffected by the fallback).

### Keyboard grammar (novel — no WAI-ARIA archetype fits a graph)
`role="application"` on the canvas with an `aria-label` spelling out the keys, plus `aria-activedescendant` pointing at the focused node. The canvas is a **single tab stop**; none of the nodes are tabbable. Each node is `role="img"` with an `aria-label` of *title, status, connection count*. The zoom buttons are separately tabbable, as controls should be.

| Key | Action |
|---|---|
| ↑ ↓ ← → | Move focus **along an edge** to the adjacent concept nearest that direction |
| `Home` | Focus the **central concept** (the hierarchy root — literally the middle of the map) |
| `Enter` / `Space` | Toggle the preview card for the focused concept |
| `Esc` | Dismiss the preview |
| `+` / `−` | Zoom in / out (mirrors the buttons) |
| `0` | Fit the whole graph |

Two decisions worth keeping:
- **Arrows traverse edges, not space.** Candidates are the focused node's neighbours inside a 90° cone around the pressed direction, nearest first; if the cone is empty, any neighbour on the correct side, best-aligned first. A grid-style spatial walk would step onto nodes that are merely *near* — exactly the claim a concept graph exists to deny. A node with no neighbour in that direction simply does not move.
- **There is no `End`.** A graph has no last node, and inventing one (outermost ring? alphabetically last?) would be a key that means nothing. `Home` earns its place because the radial layout gives it a literal target — the hierarchy root at the centre of the map.

Focus movement pans the focused node into view — pan only, never zoom, and only when it has actually left the viewport.

---

## Article panel — prose measure & breakout grid (4.8)

`.node-main` (both hosts: `/node` and the course lesson view) is a named-track
grid: `[breakout-start] minmax(24px, 1fr) [prose-start] minmax(0, 70ch)
[prose-end] minmax(24px, 1fr) [breakout-end]`, horizontal padding `--space-4`,
`max-width: 864px` — the course view's article column at 1440 (1440 − 2×288
chrome columns), so both hosts share one panel maximum — and `margin-inline:
auto`, centred in its layout column always.

- **The measure (design anchor):** body prose reads best at roughly **60–75
  characters per line**. The 4.8 audit measured the previous 660px cap at
  **80ch / ~88 real characters per line** — past the range, contradicting the
  assumption that it sat near the low end — so the recorded measure came
  **down** to **70ch** (577.5px at the 16.5px body size; ~77 CPL incl.
  spaces). The track is declared in `ch` against the panel's body-size font,
  so the A−/A/A+ text-size steps scale the column with the type and CPL
  holds. The prose column is *load-bearing readability*: it is never widened
  to "fill" a viewport.
- **Breakout (design anchor):** wide elements — cards, tables, multi-column
  sections — aren't prose and don't obey the prose measure. They opt out with
  `grid-column: breakout` (today: the Perspectives section; future wide
  elements reuse the same assignment). Breakout spans the panel minus its
  16px padding: max 832px of content.
- A split article (`.node-body:has(> .perspectives)`) uses `display:
  contents` so its fragments sit in the prose track while the section spans
  breakout; the edge margins the old block flow collapsed are re-pinned
  explicitly (see node-page.css comments).
- Gutters `minmax(24px, 1fr)`: with the 16px padding they reproduce the old
  40px prose inset when space is tight and grow symmetrically when it isn't
  — space that frames the reading column is doing a job. At ≤640px the
  gutter floor drops to 0 and mobile keeps its pre-4.8 geometry (358px prose
  at 390).
- **Course view band fix:** the node rail stacks below the article at
  ≤1150px when inside `.course-main` (course.css) — the audit's dead band
  (900–1150) held both 288px chrome columns with mobile-scale prose between
  them. `/node` keeps its 900px threshold. The syllabus and rail stay 288px
  fixed: the audit showed both are content-earned (widest related row ≈263px
  + padding; syllabus rows wrap at a readable width).
- **Headline before → after (4.8 audit, social-norms):** /node 1440: 412px
  one-sided dead gap → symmetric 144px framing · course 1024 prose: 368px /
  44.6ch → 577.5px / 70ch · course 950 prose: 294px / 35.6ch → 577.5px /
  70ch · course 1440 article→rail dead 124px → 0 (the panel fills its
  column; in-grid gutters frame the prose).

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
  - **Met (complete):** the drawn **[completion seal](#completion-seal-43)** leads (1em, via the chip's `LessonCheck` span, `--seal-ink` = the chip fill `--state-complete-bg`); bg `--state-complete-bg`; border `--state-complete-border`; label `--state-complete-text`; trailing "complete" caption `--state-complete-label`. *(4.8: was a text `✓` in `--state-complete-mark` — the 4.3 scope divergence, now closed.)*
  - **Unmet (incomplete):** `○` `--state-unmet-mark`; bg `--state-unmet-bg`; border `--state-unmet-border`; label `--state-unmet-text`; trailing "incomplete →" `--state-unmet-label`; the chip is a link to that lesson. *Hover:* border `--color-border-accent`, bg `--color-surface-hover`.

## Perspectives section (the multi-lens signature) — shipped 4.5

The `## Perspectives` body section is extracted at build time (`lib/content.ts`)
and rendered as paradigm-accented cards by `Perspectives.tsx`. It renders
*inside* the `.node-body` article, between `htmlBefore` and `htmlAfter`, in the
body's own position — so its heading, intro prose, and card bodies inherit the
article's typography and the reader perceives a designed passage of the same
lesson, not a bolt-on widget. Static, printable, server-rendered; no
interactivity, tabs, or per-paradigm filtering in v1.

**Extraction — two authoring shapes (both recognized):**
- **`###` subsection** — heading text is the item label, subsection body the
  item html. (The concept-node "three readings" pattern; `docs/schema.md`.)
- **bold-led bullet** — `- **Functionalist response.** …`; the bold lead is the
  label, the remainder the item html. A bullet list is only treated as items
  when *every* bullet is bold-led (a half-bold list stays prose). Paragraphs
  between the heading and the first item become the `intro`.

**Alias table** (`lib/content.ts`, matched case-insensitively as a substring of
the label): `functionalis` → functionalism · `conflict` → conflict ·
`interaction` → interactionism · `symbolic` → interactionism. No match →
`paradigm: null` (a **neutral card**). The table is deliberately tiny and
explicit: a future paradigm (a feminist reading, say) arrives as a neutral card
with **zero code change**, and earns its own accent only when the taxonomy
formally grows and a row is added.

**Fallback ladder** (never the reason a content PR breaks; author text is never
dropped):
1. No `## Perspectives` heading → `perspectives: null`; the single full-body
   `html` path renders untouched (byte-identical to pre-4.5).
2. Heading present but no item parses → `perspectives: null` too; the whole
   section stays in the body prose, exactly as today.
3. Items parse but odd content precedes/follows → structure what parses; leading
   (and any rare trailing) nodes fold into `intro`, never discarded.

**Card anatomy:**
- Section heading: a plain `<h2>` — inherits the article's `.node-body h2` mono
  eyebrow register. Intro: plain prose (`.perspectives-intro`).
- Attributed card: tinted surface `--paradigm-*-surface`, a **3px left accent
  border** in the paradigm colour (`--paradigm-*`), and a name-label chip reusing
  the 4.1 self-check attribution chip treatment (`--type-badge-*`, thin border,
  `--radius-xs`) in the paradigm colour. The chip text is the canonical paradigm
  name — Functionalism / Conflict theory / Interactionism — so the quiz and the
  article name paradigms in **one vocabulary**. *The label carries the meaning;
  the hue only accompanies it* (house CVD rule).
- Neutral card: `--color-surface-sunken`, **no** accent (the left border matches
  the uniform `--color-border-input`), muted chip, label rendered **as authored**
  (trailing period trimmed).
- Card bodies inherit `.node-body` prose (links, bold, inline code) — the card is
  a container, not a new typography scope.
- Layout (reworked 4.8): the section spans the article grid's **breakout
  track** (`grid-column: breakout` — see *Article panel*), so the grid sizes
  against up to 832px instead of the old ≤660px prose width, where
  3×220 + 2×16 = 692px could never fit and the trio always wrapped
  two-over-one. Tracks stay `repeat(auto-fit, minmax(min(100%, 220px), 1fr))`
  — the paradigm trio sits **three-across at desktop** (1440: 266px cards;
  1024: 224px — the 220px readability floor untouched), collapsing to a
  single stacked column at ≤640px (explicit `1fr`); the `min(100%, …)` guard
  prevents horizontal overflow at 390px. **Wrap thresholds (correct
  behaviour, not defects):** below a 724px article column the trio renders
  two-across; below a 640px viewport, one. (In the course view the column
  crosses 724px at ≈1012px viewport while the rail is stacked, and again at
  ≈1300px once the rail returns inline at >1150px.)
- Two-item sections (theory nodes): the grid box is capped at `2×360px + gap`
  and centred, so cards stop at 360px instead of stretching to 408px at full
  breakout; the cap never changes *where* two-across wraps to one (the 220px
  floor decides that).

*Improvisations / deltas from the original (unbuilt) spec above:* v1 uses the
mono `.node-body h2` heading (the brief's "same article, not a widget" goal)
rather than a serif heading + "3 paradigms · 1 concept" count + subhead; a **left**
accent on every viewport (not top-on-desktop); **authored order** is preserved
(not forced func→conflict→interactionism), since a theory node records other
paradigms' responses in the author's sequence; and there is **no HOME-paradigm
badge/emphasis** — deferred, and inapplicable to theory nodes whose section is
about the *other* paradigms. Zero token or theme-file work: the accents and
surfaces already existed in all three themes.

## Related-links list
- Eyebrow "Related concepts" (`--type-eyebrow-*`, `--color-text-muted`).
- Each row: a **paradigm colour tag** (denoting the paradigm the related concept sits in — teal/rose/amber from `--paradigm-*`) + serif label (`--type-related-*`, `--color-text-related`), hairline divider `--border-thin var(--color-border-subtle)`, trailing `→` hidden until hover.
  - Colour-tag shape is tokenised as a small swatch: bar (4×16, `--radius-xs`), dot (9×9 circle), or pill (22×10) — see Tweaks `relatedTagShape`; default **bar**.
  - *Hover:* label → `--color-accent-hover`; `→` fades in (`--transition-fast`).
- Thinkers list (Howard Becker, Edwin Lemert) sits below as **plain serif text, not links** (`--color-text-body`), with a mono caption "plain text — links arrive with Mode 4".

## Rail — Perspectives chips (4.8)

- Rendered **only when `node.perspectives` is non-null** (the 4.5 extraction)
  — no empty block, no placeholder; prose-fallback nodes (e.g.
  `sociological-imagination`) show nothing, consistent with the section
  itself.
- **Position in the rail's anatomy:** after Related concepts, before Thinkers
  — concept navigation ahead of metadata.
- Eyebrow "Perspectives" (`--type-eyebrow-*`); one chip per item in the
  perspective-label vocabulary (`--type-badge-*`, `--border-thin
  var(--color-border-input)`, `--radius-xs`, 3px 8px padding): **attributed**
  chips carry the canonical paradigm name with their `--paradigm-*` accent as
  text + border colour (the one-language rule the quiz chips and section
  cards follow); **neutral** chips carry their authored label (trailing
  period trimmed), muted. Label derivation is shared with the cards
  (`perspectiveLabel`, Perspectives.tsx).
- Each chip is an **anchor** to the section heading's stable
  `id="perspectives"` — the rail's job is orientation: *this concept is read
  three ways; jump there.* No smooth-scroll behaviour added. *Hover:* surface
  tint `--color-surface-hover` only — the ink keeps carrying the paradigm,
  never the hover.
- Chips wrap (`flex-wrap`, `--space-2` gap); the block adds no width demands
  to the 288px rail.

## Mini-tree locator ("In the map")
- Card: border `--border-thin var(--color-border)`; background `--color-surface`; radius `--radius-lg`; padding `--space-4`.
- Mono 12px ASCII tree (`--color-text-muted`) with the current node highlighted `--color-accent` + `●`. Whole card is a link into the Hierarchy view; trailing "open in hierarchy →" caption `--color-text-disabled`. *Hover:* border `--color-border-accent`, bg `--color-surface-hover`.

## CC BY attribution footer (required)
- Top border `--border-thin var(--color-border)`; `--font-mono` 11px `--color-text-muted`; source title in `--color-text-meta-warm`, "CC BY 4.0" in `--color-accent`.
- Copy (verbatim): "Adapted from OpenStax Introduction to Sociology 3e, §7.2 — CC BY 4.0. Changes were made. See LICENSE-CONTENT.md." Always present on content screens; never hidden.

## Reserved discussion region (deferred — do not build)
- A dashed placeholder below Examples: border `--border-thin dashed var(--color-border-input)`, radius `--radius-md`, mono `--color-text-disabled` note "// reserved — lesson discussion (Giscus, deferred)". Holds the space; ships empty.

## Self-check quiz (SelfCheck — 4.1)

A quiz surface rendered below the lesson body, inside `NodeArticle` — so it
appears identically on **both** hosts (`/node/[slug]` and the course lesson
view). No hi-fi existed; everything here is improvised from `direction.md` and
the token set, and recorded as the spec of record. Component `SelfCheck.tsx` +
`self-check.css`; data is server-loaded at build (`getQuiz(slug)` in
`lib/content.ts`) and passed as a prop — no client fetching on a static export.

- **Published-only render.** The loader returns a quiz **only when `status:
  published`**; a draft or missing quiz returns `null` and no section renders —
  not even an empty shell. The filter is in the loader, so **draft quiz content
  never ships in the page payload** (verified by grepping the export). A
  `published` quiz on a `stub` node is a lint error, so that case cannot ship.
- **Section frame.** Top border `--border-thin var(--color-border)`, `--space-8`
  top margin — the same rule that separates the attribution footer, so the quiz
  reads as a lesson section, not an island. Heading "Self-check" reuses the
  article's mono `##` eyebrow register (`--type-h2-mono-*`, `--color-text-muted`).
  Intro line: mono `--type-tag-size` `--color-text-faint`, stating open-book +
  device-local + not-sent. (Was "not counted toward completion" in 4.1; dropped
  in 4.3 because a published quiz now **does** gate completion, and as of 4.4 a
  published choice-quiz **is** the completion mechanism — see *Two modes* below.)
- **Choice question.** Prompt in serif `--type-body-*` `--color-text-strong`.
  Options are **real `<button>`s** (keyboard-reachable, the global focus ring
  applies): `--color-surface-sunken` fill, `--color-border-input` edge,
  `--radius-md`. *Hover only while unanswered:* `--color-surface-hover` +
  `--color-border-accent`.
  - **On select, grade immediately.** The chosen option is marked, the correct
    option is revealed, and **every option's `why` becomes readable** (wrong-answer
    rationales are content, not secrets). Correct reveal uses the shared
    `--state-complete-*` green (the syllabus / prereq-chip / canvas family) with a
    `✓` mark; the chosen-wrong option uses the clay-red **advanced-difficulty**
    register (`--diff-advanced-text` / `--diff-advanced-border`) with a `✗` mark.
    **Colour never carries state alone** — the `✓`/`✗` glyph is the non-hue cue.
  - **"Try again"** (mono control pill, `--color-border-input`) clears that one
    question's stored attempt and returns it to the answerable state. **Sticky-
    correct (4.3):** it renders **only on an incorrectly-answered question**. A
    correct answer is **terminal** for the stored attempt — the option `<button>`s
    are `disabled`, the `why` set stays readable, and there is no retry. A learner
    cannot re-test a question already answered correctly; **re-take / reset is
    deliberately not offered** here (it belongs to the deferred spaced-repetition
    work and must not be improvised as a "reset quiz" button).
- **Paradigm attribution chip** (improvisation). When a question's `paradigm`
  field is non-null, an "According to {paradigm}" chip sits above the prompt in
  the amber tag-chip treatment (`--color-accent` on `--color-border-accent`,
  `--radius-xs`) — the visible half of the quiz's contested-claim rule, so the
  reader sees the question grades a paradigm's reading, not a neutral fact. It
  reuses the `paradigm/*` tag-chip look; the amber is the same wayfinding accent.
- **Reflect question.** A "Reflect" label chip (muted, *not* amber — nothing is
  graded), prompt, a plain `<textarea>` (`--color-surface-sunken`, focus ring on
  `:focus-visible`), and a mono `--color-text-faint` notice that the text is
  **never stored or sent**. Confirmed: typing writes nothing to any storage key.
- **Summary line** (improvisation). Once **every** choice question is answered, a
  quiet mono line "`{correct} of {total}`" (`--color-text-meta-warm` score). When
  not all correct it trails "· self-check · device-local" (`--color-text-faint`);
  when **all correct** it reads as the completion moment — "`{n} of {n}` — lesson
  complete" (was "you can mark this lesson complete" in 4.3; **all correct now
  *is* completion**, not an invitation to click) — plain text, no celebration.
  **No confetti, no badges** — the reward register stays with the future
  gamification phase; the celebration is the row tint + module fill (the 4.2
  animation budget), never anything on this line.
- **Two modes (4.4 — doctrine's third state).** The completion doctrine has moved
  three times, and all three states are on the record: **4.1** — a quiz never
  gates ("the quiz informs, it does not gate"); **4.3** — a published quiz gates,
  but completion stays a **deliberate click** (the quiz *unlocked* the button);
  **4.4** — for a published choice-quiz, completion is **derived from mastery**.
  The owner directed each reversal; a future phase must not "restore" an earlier
  rule. A lesson now runs in exactly one of two modes:
  - **Manual mode** — no published quiz, *or* a reflect-only published quiz
    (`choiceCount === 0`). The `MarkCompleteButton` behaves as in 4.2: the learner
    marks and unmarks freely. (This is the current majority — 52 of 53 lessons.)
  - **Mastery mode** — a published quiz with **≥1 choice question**. The manual
    button is **removed entirely**; completion is driven by the quiz. There is
    **no hand mark/unmark control** in this mode.
  - **The mastery invariant.** For a mastery-mode lesson, **`isQuizFinished` ⇒
    marked complete**, enforced in `SelfCheck` (which renders on **both** hosts)
    at two points:
    - **The flip** — `QUIZ_EVENT` fires on every quiz write, so the moment the
      final `choice` question goes correct (finished false→true) `SelfCheck` calls
      `setComplete(slug, true)` through the `lib/progress` setter. `PROGRESS_EVENT`
      then propagates as always — syllabus row tints, module fill advances, both
      canvases seal — in the same frame, no reload, no click. Idempotent: an
      `isComplete` guard makes marking an already-complete slug a no-op.
    - **Mount reconciliation** — the same check runs once on mount (post-hydration,
      the established `LessonCheck` pattern), so a lesson that was finished but left
      unmarked (a 4.3-era learner who never clicked, or finished-then-unmarked)
      heals. The invariant holds **unconditionally**, not only for post-deploy
      interactions.
  - **Finished** = **every `choice` question's stored state is `correct: true`**.
    `reflect` questions never gate (ungraded, never stored). Derived on read by
    `isQuizFinished(slug, choiceCount)` in `quiz-progress.ts` — **no stored
    rollup, no "finished" flag** (the completion invariant holds for quiz state
    too). With sticky-correct, finished is monotonic within the stored attempt.
  - **Node-page completion is new (4.4).** Because `SelfCheck` renders on
    `/node/[slug]` too, a **graph-arrival learner can now complete a lesson without
    ever opening the course view** — the button lived only in the course view, but
    the mastery mark does not depend on it. Intended.
  - **Reflect-only exception.** A reflect-only published quiz (`choiceCount === 0`)
    would make finished **vacuously true**, so auto-completing on mount would be
    wrong. Such a lesson **stays in manual mode** (the `SelfCheck` effect no-ops on
    `choiceCount <= 0`; the course view keeps the button). No such content exists
    yet; if a linter for it ever appears, this rule governs.
  - **Grandfathering is one-directional.** The mastery effect only ever **writes**
    completion, never removes it (`setComplete(slug, false)` is never called here).
    A lesson **marked complete before its quiz was published stays complete** —
    publishing content never retroactively unmarks anyone; the quiz UI simply shows
    its own answered/unanswered state independently.
  - **Permanence (owner-accepted consequence).** With sticky-correct (4.3) a
    correct answer cannot regress, and mastery mode has **no unmark control**, so a
    mastery-mode completion is **effectively permanent**. The only future escape
    hatch is the deferred **quiz reset/re-take** feature — *not* improvised here.
  - **Removed: the 4.3 lock.** The `MarkCompleteButton`'s locked path is **gone** —
    its `hasPublishedQuiz`/`choiceCount` props, the `isQuizFinished` effect, the
    `disabled` `locked` state, and the caption "Finish the self-check below to mark
    this lesson complete" were all deleted (with their `.mark-complete:disabled` /
    `.mark-complete-hint` CSS). A manual-mode lesson by definition has no published
    choice-quiz to lock on, so the lock was dead. The button is now the plain 4.2
    toggle taking only `slug`.
  - **Wiring.** `getQuiz(slug) !== null` is `hasPublishedQuiz` (the loader's
    published filter is the mode trigger, **never file existence**); `masteryMode`
    = that **and** `choiceCount > 0`. `CourseView` (server) branches on
    `masteryMode`, rendering `LessonStatus` (mastery) or `MarkCompleteButton`
    (manual). Draft quizzes never render and never drive completion.
- **Storage & independence.** Quiz state keeps its own module
  `src/lib/quiz-progress.ts`, its own key `learn-sociology:quiz:v1`, its own
  `QUIZ_EVENT`, and **still stores no completion**: there is **no "finished"
  flag**, no new key, no shape change. 4.4's auto-mark writes completion **through
  the existing `lib/progress` public setter** (`setComplete`) — the *only* write
  path — so completion stays readable from the one store by `completionFor`, both
  canvases, and the syllabus with zero changes to any of them; `progress.ts`
  itself has **no diff**. The two stores are coupled **behaviourally** (mastery
  derives from `isQuizFinished`, then writes completion) but **never in storage**.
  Corrupt reads → empty. Quiz state is read **after mount** and re-read on
  `QUIZ_EVENT`, and the mastery effect is likewise a post-mount read (the
  `LessonCheck` no-mismatch pattern), so the server HTML and first client render
  show every question unanswered and hydration never mismatches.
- **Determinism.** Question and option order render exactly as authored — no
  shuffling anywhere in v1.

**Improvisations introduced here** (no prior token/treatment existed): the
paradigm-attribution chip; the chosen-wrong state borrowing the clay-red
advanced-difficulty tokens as the only "error" register in the palette; the
`self-check` section frame; the summary line; **(4.3)** the completion seal
(below); **(4.4)** the mastery-mode status line (`LessonStatus`, see *Lesson host*
under *Previous / Next controls*). The 4.3 locked-button treatment + caption was
**removed** in 4.4. All reuse existing tokens — **no new tokens were added**.

## Completion seal (4.3)

The single drawn mark for "done", shared by **all four surfaces**: hierarchy
pills, network pills, syllabus rows, and the `MarkCompleteButton` completed
state. It **replaces the 4.2 text `✓` glyph**, which read cheap against designed
surfaces and rendered inconsistently across font stacks. The concept (a non-hue
completion cue — the CVD rule) was right; the glyph was the defect.

- **One source of truth.** `src/components/CompletionSeal.tsx` — one component,
  one geometry, consumed by every surface. "Done" gets exactly one face.
- **Geometry.** An `<svg viewBox="0 0 20 20">`: a disc (`<circle>` r=9, filled
  `--state-complete-mark`) carrying a check (`<path>`, `stroke-width` 2.25,
  **rounded caps and joins**) in the surface's own background token. The check
  colour is `var(--seal-ink)` — each surface sets it so the check reads as **cut
  out of the disc**: **syllabus** paper `--color-surface-sunken`; **canvas
  pills** canvas fill `--tree-canvas-bg`; **button** the completed fill
  `--state-complete-bg` (default `--color-surface`).
- **Sizes.** Two variants scale the *same* geometry: **canvas stamp** `size=15`
  user units (top-trailing corner, `x=node.width-18 y=3`; legend swatch
  `size=10`); **row / button mark** `≈14px` (syllabus `width/height:
  --type-lesson-size`; button `1.05em`, `≈12px`). Reported per the brief.
- **Placement** holds from 4.2: top-trailing corner on canvas pills (clear of the
  leading paradigm dot / collapse glyph), leading edge on syllabus rows
  (`order:-1`).
- **Interplay re-verified (4.3)** with the new mark, all three themes, `fit` zoom
  and 1:1: complete × dashed-non-published (seal + dash coexist); × selected
  (amber wins the fill, **seal persists** — it is a sibling of the box); × focus
  ring; × amber lineage path. The **midnight faint-tint** finding from 4.2 stands
  as flagged — the seal carrying the meaning where the tint is faint is **by
  design**; the token is deliberately not patched in this phase.
- **Scope divergence (recorded 4.3, closed 4.8).** The prerequisite chips in
  the "Before this lesson" callout were out of 4.3 scope and kept a text `✓`
  via their own `::before`. As of 4.8 the chip's `LessonCheck` span is no
  longer visually hidden: it renders the seal as the chip's leading mark
  (`order: -1`, 1em, `--seal-ink` = the chip fill `--state-complete-bg`) and
  the `✓` rule is gone. Every completion surface now draws the one seal.
- **`aria-hidden`** on every seal; the surrounding markup carries the spoken
  state (the syllabus `.lesson-check` span's `aria-label="completed"`, the
  button's "Completed" text, the canvas node's label). Paint only — feeds no
  layout, so the canvas fingerprint is identical with progress present or absent.

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
