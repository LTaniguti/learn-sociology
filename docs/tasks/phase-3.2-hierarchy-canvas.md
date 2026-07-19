# Task Brief — Phase 3.2: Hierarchy Canvas (node-and-edge tree)

**Destination:** `docs/tasks/phase-3.2-hierarchy-canvas.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 3.2 — replace Mode 2's ruled-rows tree with the positioned node-and-edge canvas from the hi-fi. This resolves `docs/wireframes.md` open question 1 (which the ruled-rows variant deferred). Data, routes, and every other screen stay untouched.

---

## Item 0 — Housekeeping: close out 3.1 first

3.1 ended with commits pushed (`805dbbd..22cb5aa`) but verification step 7 incomplete — CI run [29708243624](https://github.com/LTaniguti/learn-sociology/actions/runs/29708243624) was still queued waiting for a runner when the session ended.

1. Check that run's final status. If it eventually ran: confirm green + Pages deploy. If it's still queued or was cancelled as stale: re-trigger (`gh run rerun` or an empty commit) and watch it through.
2. Complete the deferred deployed spot-check: all three themes on the live site, hard-refresh no-flash check included.
3. **Sanctioned one-line fix (sign-off now given):** the 2.10 `.syllabus-collapsed` padding bug — collapsed padding is declared above `.syllabus` at equal specificity so it never applies. Fix using the same doubled-class pattern the node rail used (`.syllabus.syllabus-collapsed`), making the two rails' CSS consistent. Verify the collapsed sidebar visually; this is a bug fix, not a redesign.

Commit: `Fix: syllabus collapsed padding specificity (3.2 item 0)`

**If CI cannot be made green here, stop — do not build a phase on a red main.**

## Preconditions

- Item 0 complete: CI green on `main`, three-theme deployed check done.
- Design references present: `docs/design/hifi/hierarchy-view@2x.png`, the hierarchy sections of `docs/design/components.md`, and `docs/design/direction.md`.

## Standing rules (inherited)

- All visual values are tokens; hex grep guard on `src/`; new semantic needs → new token, flagged.
- Improvised states (anything `components.md` doesn't specify) get listed in the report for back-fill.
- No changes to the content pipeline, schema, or other screens. The tree's data comes from the same parent-relationship structure the ruled-rows view already consumes.
- Themes are free: because this feature renders SVG in the DOM styled by classes → tokens, all three themes must work with **zero** theme-specific code. If you find yourself reading a computed color in JS, stop — that's the design being violated.

## Decision record — rendering approach (decided, not open)

- **Layout math:** `d3-hierarchy` (install this module only, not the d3 bundle) — `hierarchy()` + `tree()` tidy layout.
- **Rendering:** React renders the SVG (nodes as positioned `<g>` groups, edges as `<path>` béziers). D3 computes coordinates; it never touches the DOM.
- **Rationale (record in the component's header comment):** canvas-based graph libraries bypass CSS tokens, theming, and focus semantics; SVG-in-DOM keeps all three for free. Phase 3.3 (network view) reuses this exact split with `d3-force` as the math module.

## The build

### 1 — Data + layout

A pure function: content tree → `d3.hierarchy` → tidy layout → node positions + edge paths, parameterized by the set of collapsed node ids. Orientation and spacing to match the hi-fi's composition. Collapse state lives in React state (session-only — no `localStorage` key for this; note it in the report as a deliberate choice, revisitable if users ask). Default expanded depth per the hi-fi (modules open, deeper levels collapsed).

### 2 — Canvas surface

The tree sits in a scrollable viewport (both axes) on the canvas background with the dotted grid from the shipped styling. No zoom in this phase — sizing should aim for the full default-collapsed tree fitting a desktop viewport width; deep expansion scrolls. (Pan/zoom gets revisited in 3.3 where it's unavoidable; don't build it twice.)

### 3 — Nodes

Per `components.md` hierarchy spec and the hi-fi: collapsed vs expanded fills and borders, descendant-count badges, paradigm dots, status treatment for non-published nodes (the dashed honesty treatment carries over from the ruled rows). Each node is interactive: activation toggles collapse for branch nodes; a second affordance (per hi-fi — the node body vs the badge, or an explicit control) opens the preview card.

### 4 — Edges

SVG bézier paths in `--color-edge`. When a node is selected/previewed, its ancestor path renders in `--color-edge-active`. Edge strokes are styled by class, not attribute-level colors.

### 5 — Preview card

The shipped preview card (title, summary, paradigm dot, link to `/node/[slug]`) repositioned to anchor to the selected node's coordinates, flipping sides near viewport edges, `--shadow-pop`. Dismiss on Esc, outside click, or selecting another node.

### 6 — Keyboard: WAI-ARIA treeview

This is the phase's real accessibility work; don't improvise a lighter pattern:
- Container `role="tree"`, nodes `role="treeitem"` with `aria-expanded` where branch, `aria-level`/`aria-setsize`/`aria-posinset`.
- Roving tabindex — one tab stop for the whole tree; ↑/↓ move visible nodes, → expands/steps in, ← collapses/steps out, Home/End jump, Enter opens the preview card.
- Moving focus scrolls the focused node into view; focus ring per the global rule.

### 7 — Mobile (390px)

The canvas remains the interface: touch scroll both axes, nodes at a comfortable tap size (reuse mobile-size tokens where they exist; new ones flagged). Verify the default-collapsed tree is discoverable without horizontal disorientation — if the hi-fi's orientation is hopeless at 390px, switching orientation at the mobile breakpoint is an allowed judgment call; report it.

### 8 — Replace and retire

The canvas replaces the ruled-rows tree on the hierarchy route. Delete the ruled-rows component and its CSS (git history preserves it; no dead code kept "just in case"). Update `docs/wireframes.md`: mark open question 1 resolved, one line, dated, pointing at this brief.

## Motion

Expand/collapse animates positions with `--transition-fast` at most; the existing global `prefers-reduced-motion` rule must cover it (if the animation approach escapes that rule — e.g., JS-driven interpolation — wire the media query in explicitly). Methodology note from 3.1: the preview browser can run `document.hidden === true`, freezing CSS transitions at their start value — verify motion in a visible window before diagnosing any "broken" transition, and don't restructure working CSS to chase that phantom.

## Verification

1. Lints, content lint, build; hex grep clean.
2. Full keyboard pass per the treeview pattern above — every listed key works, one tab stop, no traps.
3. All three themes on all states (collapsed, expanded, selected path, preview card) — expect zero theme-conditional code.
4. `prefers-reduced-motion` collapses animation to instant.
5. 390px pass: tap targets, scroll, preview card placement.
6. Compare against `hierarchy-view@2x.png`; `components.md` wins any conflict, discrepancies reported.
7. Push; CI green; deployed spot-check (watch for the queued-runner behavior from Item 0 — if runs sit unclaimed again, note it as an infra pattern worth a support look rather than re-debugging code).

## Commits

1. `Fix: syllabus collapsed padding specificity (3.2 item 0)`
2. `Feature: d3-hierarchy layout + SVG tree scaffold (3.2)`
3. `Feature: hierarchy nodes, edges, preview card per spec (3.2)`
4. `Feature: treeview keyboard pattern + mobile pass (3.2)`
5. `Chore: retire ruled-rows tree, resolve wireframes open question 1 (3.2)`

## Completion report

Report: Item 0 outcome (CI history + deployed check), new tokens (and groups), improvised values for `components.md` back-fill, the collapse-state persistence decision as recorded, orientation choice at mobile, any place the tidy layout and the hi-fi composition couldn't be reconciled, bundle impact of `d3-hierarchy`, and anything learned that should shape the 3.3 network brief (pan/zoom needs, performance at 53 nodes vs what a denser network will demand).
