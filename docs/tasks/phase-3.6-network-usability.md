# Task Brief — Phase 3.6: Network Usability — First-Scroll Teleport, Density, Active-Edge Legibility

**Destination:** `docs/tasks/phase-3.6-network-usability.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 3.6 — Mode 3 hardening. 3.5 shipped the radial tidy tree; live use surfaced three defects: (1) the first scroll after page load teleports the view, (2) the graph is too spaced out — near-unusable at 390px, (3) a selected concept's relationship edges are invisible against the skeleton (only the amber lineage reads). All three have diagnosed causes below; this brief is fix-and-tune, not redesign.

**Sanctioned scope:** `NetworkCanvas.tsx` (effect ordering, initial view, selection-state class), `network/layout.ts` (ring radii, label wrapping, geometry constants), `network-canvas.css` (active-edge treatment, dimming), the three theme files **only if** Item 3's Option B is taken, `components.md` + `themes.md` sync. Hierarchy view, preview card, deep links, tabs, content, pipeline: untouched — tripwire applies outside this set.

## Standing rules (inherited)

Tokens + hex grep (`public/giscus` exempt); improvisations reported for `components.md`; determinism (no randomness anywhere — identical fingerprint across reloads remains a verification gate); environment quirks verbatim (front the window before measuring; dispatched `KeyboardEvent`s); queued-runner patience.

---

## Item 1 — Fix: first scroll after load teleports the view (P0)

### Diagnosis (verified against `origin/main`)

Effect-ordering race in `NetworkCanvas.tsx`:

- The initial view is applied in a `useLayoutEffect` (~line 259) via `applyTransform(initialTransform())`.
- The d3-zoom behaviour is registered in a plain `useEffect` (~line 232).
- On mount, **layout effects run before passive effects**, so at initial-view time `zoomRef.current` is `null` and `applyTransform` (~line 215) takes its silent fallback: `setTransform(next)` directly, **never syncing d3's internal `__zoom` property on the SVG**.
- `selection.call(behaviour)` then initialises `__zoom` at identity. The first wheel/drag gesture computes from identity → the rendered transform snaps toward identity → the "teleport." From then on d3 and React are synced, so it never recurs — matching the observed load-only symptom.

The comment above `applyTransform` ("so d3's internal transform never drifts from what is rendered") names exactly this hazard; the fallback branch defeats it. The `#slug` deep-link path is a `useEffect` that runs *after* zoom setup, so it was never affected — preserve that.

### Fix

1. Move the zoom-behaviour registration into a `useLayoutEffect`, declared **textually before** the initial-view layout effect, so the behaviour exists before any transform is applied. Everything inside it is DOM-ref work with no paint dependency; this is safe.
2. **Remove the silent fallback** in `applyTransform`. If the behaviour is missing when a transform is applied, that is a bug — fail loudly in dev (`console.error` or throw) rather than desync quietly. This makes the whole class of drift bug impossible to reintroduce.
3. Re-verify the deep-link path (`/network#slug` still centres + previews, no teleport on subsequent scroll) and the breakpoint flip (resize across 640px re-runs the initial view without desync).

### Verification

- Load `/network`, do nothing else, scroll once: the view must move smoothly from the initial position — no jump. Test wheel, trackpad pinch, and drag as the *first* gesture, on desktop width and 390px.
- Load `/network#culture`, first scroll: same.
- Automated guard if cheap: after mount, read the SVG's `__zoom` and assert it equals the rendered transform. If not cheap in this harness, note it and rely on the manual check.

Commit: `Fix: sync d3-zoom internal transform before initial view (3.6)`

---

## Item 2 — Density: shrink the extent at its source; mobile follows

### Why it is too spaced out (from the 3.5 report — do not rediscover, verify)

`ringSpacing 600` is not arbitrary: the binding constraint is the `sociological-research` sector — three very wide single-line pills (`quantitative-and-qualitative-methods`, `scientific-method`, `research-ethics`) in a narrow wedge. One sector's worst case sets the *global* ring spacing, which inflates the extent to ~3584×3416, which drops fit below the 0.4 floor at 390px, which is why mobile starts at one pill in a void. Attack the pill widths and the uniform-radius rule, and the rest follows.

### 2a — Two-line pill labels

- In `layout.ts`, wrap titles longer than a threshold (start ~16–18 chars; tune) onto **two lines**, balanced break at a word boundary (no hyphenation, no truncation — every title must remain fully readable). `pillWidth` becomes the wrapped max-line width; pill height for wrapped nodes grows to fit two lines of `fontSize 13.5` within a taller capsule (keep ≥40px tap target; wrapped pills may be ~54px).
- The separation function and `EDGE_GAP` trimming consume the new per-node width/height — verify the pill-boundary edge trim (`trimToPill`) handles the two heights.
- Report the width distribution before/after (max, p90) — the max is what was binding.

### 2b — Per-ring, data-driven radii

Replace `radius = depth × ringSpacing` with a computed radius per depth:

- After `tree()` assigns angles, for each depth `d` compute the minimum radius at which **no adjacent pair at that ring overlaps**: for every adjacent pair, `angularGap × r ≥ (wᵃ + wᵇ)/2 + sepGapArc` (keep the existing horizontal/vertical chord checks from 3.5's overlap verification as the acceptance test, not just the arc heuristic).
- `radius(d) = max(computed minimum, radius(d−1) + minRingGap)` with `minRingGap` a new geometry constant (start ~260; a ring must clear the previous ring's tallest pill plus breathing room). Deterministic by construction — no iteration order dependence.
- Ring 1 holds 10 nodes and should land far closer in than 600; ring 2 (30 nodes) is where the real requirement lives. Report the resolved radii as the v4 design constants, and the new extent.
- Ring guides move to the computed radii automatically (they are drawn from node radii — verify, don't assume).

### 2c — Re-run the fit decision with the new numbers

- Recompute fit scale at the standard breakpoints (desktop, 768, 390). **Expected outcome:** the new extent brings 390px fit above the `MIN_FIT_SCALE 0.4` floor, and `fit` becomes the initial view everywhere — that is the success criterion for this item.
- **If 390px still lands below the floor:** change the fallback from "root at 1:1" to **fit-to-ring-1** — scale such that ring 1 plus its pills fills the short viewport dimension. The learner starts seeing the core neighbourhood (root + all ten depth-1 concepts), not one pill in emptiness. Report which case applied with the numbers.
- Zero pill overlaps ring by ring, and the deterministic-fingerprint check, remain gates exactly as in 3.5.

### 2d — Shapes (conditional stretch — only if 2a–2c leave mobile still poor)

Render-level semantic zoom: below a scale threshold (~0.45), render nodes as fixed-size discs without label text; full pills at/above it. This changes **rendering only** — layout coordinates are identical, so the "same shape across breakpoints / deep links / screenshots" doctrine holds. Do **not** implement this if 2a–2c get 390px fit above the floor; if implemented, it is an improvisation for `components.md` with the threshold recorded. Either way, report the recommendation.

Commit: `Feature: wrapped pill labels + per-ring radii shrink network extent (3.6)`

---

## Item 3 — Active-edge legibility: the selected concept's relationships must read

### Diagnosis (verified against `network-canvas.css`)

On selection, incident cross-links come "forward" as: prerequisites → `stroke: var(--color-edge)` (`.nwcross-prerequisite`), related → `var(--color-border-subtle)` at 0.85 opacity (`.nwcross-related`). But `--color-edge` **is the ink of all ~52 idle tree edges**, and `--color-border-subtle` is quieter still. The only edges that change hue on selection are the lineage (amber `--color-edge-active`) — hence the user-reported symptom: the orange path to the root is visible, the relationships are not.

### Option A (primary — stays inside the single-accent discipline)

1. Active incident cross-links go **amber** too: prerequisites at `--color-edge-active` + `--border-thin` + arrowheads (arrowhead fill moves to `--color-edge-active`); related at `--color-edge-active`, thinner/`opacity ~0.75`, unmarked. Lineage keeps `--border-med`. The prerequisite/related distinction stays carried by weight + arrow, never hue — the CVD rationale in the CSS comment survives intact.
2. **Dim the field under selection:** when a node is selected, non-lineage, non-incident tree edges drop to `--color-edge-faint` (a `.has-selection` class on the canvas group; CSS only, `transition-fast`). This is the cheap, high-leverage half: the lit edges pop because everything else recedes. Deselect returns the skeleton to full `--color-edge`. Non-published dashes and pill treatments unchanged.

### Option B (fallback — only if A visually muddles lineage vs relationships)

A dedicated token `--color-edge-related` in `tokens.css` + both theme files: a clearly distinct value from both `--color-edge` and the amber, legible against the canvas bg in all three themes. This widens scope to the theme files (sanctioned above, conditionally) and is a `themes.md` entry. Take A first; take B only on a documented visual failure of A, with screenshots of the failure in the report.

### Verification

Select `culture` (or any node with ≥2 cross-links pointing somewhere other than the root): all incident relationship edges must be identifiable at a glance in Midnight **and** Light, at fit zoom and at 1:1. Legend updated if the treatment description changes. Esc/deselect returns to the quiet state with no residue.

Commit: `Fix: selected concept's relationship edges legible against skeleton (3.6)`

---

## Item 4 — Docs sync

- `components.md`: network section v4 — effect-ordering note (zoom behaviour must precede initial view; fallback removed), wrapped-label rule + threshold, per-ring radii + `minRingGap`, resolved v4 constants and extent, the fit decision outcome per breakpoint, the active-edge treatment (and dimming) as shipped.
- `themes.md`: only if Option B introduced a token.
- If 2d was implemented: record the semantic-zoom threshold and rationale.

Commit: `Docs: components v4 — network usability constants and treatments (3.6)`

---

## Verification (the whole gate, in order)

1. `npm run lint:content` — green (do not regress the 3.5 fix).
2. `npm run lint` — clean.
3. `npm run build` — all static pages.
4. Manual, desktop + 390px, Midnight + Light: load → first scroll smooth (wheel, pinch, drag each tested as first gesture); initial view is fit (or documented ring-1 fallback); zero pill overlaps; wrapped labels fully readable; select a mid-graph node → relationships legible, lineage amber, deselect clean; keyboard traversal across a cross-link still works; `/network#slug` deep link unaffected.
5. Deterministic fingerprint identical across reloads.
6. Push, watch the deploy run to green, spot-check the live `/network` on a phone-width viewport.

## Report back

Per house convention: v4 constants (wrap threshold, `minRingGap`, resolved per-ring radii, new extent), fit scales per breakpoint and which initial-view case applied, width distribution before/after wrapping, Option A vs B outcome with visual evidence, whether 2d was needed, and any `parent:`/title findings for the content phase (a title that resists a clean two-line break is an editorial finding — list slugs, do not rename).
