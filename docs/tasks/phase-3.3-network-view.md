# Task Brief — Phase 3.3: Network View v1 (+ shell and Giscus riders)

**Destination:** `docs/tasks/phase-3.3-network-view.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 3.3 — Mode 3 goes live: a navigable concept network, ending with the Network tab flipping from disabled to real. Carries three small riders (top-bar reorder, theme rename, custom Giscus themes) and opening housekeeping. The Course and Node screens stay untouched except where the riders say otherwise.

---

## Item 0 — Housekeeping

1. **CI sanity:** confirm latest run on `main` is green/deployed. The queued-runner pattern (runs sitting unclaimed 10–25 min) is known GitHub-side behavior — wait or rerun; don't debug code for it.
2. **Dependabot:** review the 1 moderate alert on the default branch. If it's a transitive dev-dependency fixable by a lockfile bump, take the bump, verify build, commit separately. If the fix requires a major-version jump of anything, report instead of upgrading.
3. **Spec sync:** `docs/design/components.md` has drifted from shipped code across 3.1–3.2. Update it from the code (code is ground truth): the theme control, both collapse toggles, and the hierarchy canvas (SVG focus-ring adaptation, dashed non-published treatment, preview-card states, geometry constants noted as living in `layout.ts`). Also the one-liner: open-question (a) still describes the retired rows toggle — mark it resolved by 3.2.

Commits: one per sub-item as applicable.

## Item 1 — Rider: top-bar reorder + theme rename

1. **Order (left → right):** logo · tabs · theme control · search. Search becomes the rightmost element (`margin-left: auto` moves to the theme control, or a wrapper groups the two with search last — whichever keeps the CSS simplest). Verify the 390px wrap still lands sensibly with the new order.
2. **Rename:** the default theme's visible label changes from `Dark` to `Default` (control label, any `aria-label`s, and the `themes.md`/`components.md` mentions). **No attribute or storage semantics change** — absence of `data-theme` still means default; stored values `midnight`/`light` untouched.

Commit: `Design: top bar order, Default theme label (3.3)`

## Item 2 — Rider: custom Giscus themes for Default and Midnight

The built-in `noborder_dark` never matched the warm palette; Light's built-in is fine. Replace the two dark mappings with token-matched custom themes:

1. Fetch the source of giscus's `noborder_dark` theme (giscus/giscus repo, `styles/themes/`) as the base. Derive two files: `public/giscus/default.css` and `public/giscus/midnight.css`, overriding its color values with the corresponding values from `tokens.css` / `theme-midnight.css` (surfaces, text, borders, link, accent).
2. These files necessarily contain hex literals (they're served to a cross-origin iframe that can't read our CSS variables). Required mitigations: a header comment in each stating it is generated from the token files and listing `token-name → hex` for every value used, so future token changes have a sync map; and they live in `public/giscus/`, outside the `src/` grep guard — confirm the guard still passes.
3. Update the `LessonComments` mapping: default → `https://ltaniguti.github.io/learn-sociology/giscus/default.css`, midnight → the midnight URL, light → built-in `light`. Theme switching continues through the existing origin-pinned `setConfig` postMessage (a URL is a valid `theme` value). Note: local dev will pull the *deployed* CSS — acceptable; mention in the header comment.
4. Verification for this item happens **post-deploy** (the URLs must exist): check comment threads under all three themes on the live site. Until then, spot-check by pasting the CSS URL into the giscus.app preview if convenient.
5. Close out the `TODO(post-2.9)` comment — it is now done for all three themes.

Commit: `Design: token-matched Giscus themes for Default and Midnight (3.3)`

## Item 3 — The Network view

### Design authority

No hi-fi exists for Mode 3. The contract is: the **shipped hierarchy canvas's visual language** (node pills, edge tokens, dotted-grid canvas, preview card, dashed non-published treatment) + `direction.md`'s rules of thumb for anything new. Every genuinely new element (legend, zoom controls, edge-style distinction) is an improvisation to list in the report for `components.md` back-fill. Amber discipline: the selected/active path is the wayfinding moment; the legend and controls stay muted.

### Data (no schema changes)

Nodes: all concept nodes. Edges from existing frontmatter only:
- `prerequisites` → directed edges (visually distinct — direction marker or stroke treatment; improvise, report).
- `related` → undirected edges, lighter stroke.
- **Not** shared-tag edges in v1 — at 53 nodes over 11 modules they'd produce hairball clutter; note as a deliberate exclusion, revisitable with filtering later.
Build the node/edge arrays in a pure module beside the content pipeline consumers; no pipeline changes.

### Layout: `d3-force`, settled

- Install `d3-force` (module only). `forceSimulation` + `forceLink` + `forceManyBody` + `forceCollide` + `forceCenter`.
- **Compute to settlement synchronously on mount** (run ~300 ticks with `simulation.stop()` — no animated settling, no per-tick React renders). 53 nodes is instant; this structure is also what keeps a future 500-node graph from melting the render loop. React renders the settled positions once.
- No dragging of nodes in v1 (deliberate scope cut; report as such).

### Pan/zoom (the real one, per 3.2's handoff)

- Install `d3-zoom` as the gesture math: it listens on the SVG for wheel / pinch / drag and writes its transform into **React state**, which renders as a single `<g transform>`. The d3-computes/React-renders split from 3.2 holds; d3-zoom never mutates the DOM itself.
- Accessible controls: `+` / `−` / `fit` buttons on the canvas edge (mono, tokens, focus rings) so zoom never requires a wheel or trackpad. `fit` recenters and scales to the full graph; it is also the initial view.
- Constrain zoom extent to sane bounds; double-click zoom off (it fights node activation).

### Interaction

- Click / Enter on a node → the shared preview card (same component as 3.2), anchored, edge-flipping, Esc/outside dismisses.
- Selected node: incident edges render `--color-edge-active`; neighbor pills get the hover surface. This is the graph's ancestor-path equivalent.
- Deep link `/network#slug` centers and previews the node (parity with 3.2's hash behavior).
- **Keyboard:** single tab stop on the canvas; arrow keys move focus **along edges** to the adjacent node nearest that direction (adjacency-first, spatial disambiguation); `Home` focuses the highest-degree node, `End` the most recent focus history step back is unnecessary — keep Home only if End has no natural meaning; Enter previews; `+`/`−`/`0` keys mirror the zoom buttons. Focus movement pans the focused node into view. This is a novel pattern (no WAI-ARIA archetype fits a graph) — document the final grammar in `components.md` and the report. `role="application"` on the canvas with an `aria-label` explaining the keys; nodes get `aria-label`s (title + status).
- A small always-visible legend (edge types + non-published dash), muted mono, canvas corner.

### Enable the tab

Flip Network from disabled to live in `Shell.tsx`: remove `title="Coming soon"`, wire the route, active-tab state per the existing pattern. The Sociologists tab remains the only honest-disabled tab.

### Mobile (390px)

Canvas at `--tree-viewport-mobile-height`; pinch zoom and one-finger pan via the same d3-zoom binding; tap targets at the mobile node sizing from 3.2; zoom buttons remain (they're the accessibility floor on touch too). Initial `fit` view must show the whole graph legibly enough to orient — if it can't, initial view centers the highest-degree node at a readable zoom; report which.

### README

- Modes table: Network → Live. (While there: confirm the table's Hierarchy row description still matches the 3.2 canvas — 3.2's brief didn't touch the README.)
- Roadmap: remove the Mode 3 / hierarchy-canvas line (both halves now shipped). Sociologists line stays.

Commits (guideline, honest-intermediate-state rule from 3.2 applies):
1. `Feature: network data module + settled d3-force layout (3.3)`
2. `Feature: network canvas, pan/zoom, preview, keyboard grammar (3.3)`
3. `Feature: enable Network tab; README modes update (3.3)`

## Verification

Environment notes from 3.2, verbatim rules: front the preview window before measuring anything (it drops to `document.hidden`/zero-viewport after JS reloads, which also flips the mobile media query), and keyboard passes need dispatched `KeyboardEvent`s — synthetic key injection doesn't reach the page.

1. Lints, content lint, build; `src/` hex grep clean (Giscus CSS files exempt, in `public/`).
2. Keyboard pass per the documented grammar — every key, one tab stop, zoom reachable without pointer.
3. All three themes across: idle graph, selected node + active edges, preview card, legend, zoom controls. Zero theme-conditional code, as in 3.2.
4. `prefers-reduced-motion`: no motion to reduce in the settled layout, but verify zoom transitions (if any) go instant.
5. 390px: pinch/pan/tap pass; initial view decision verified.
6. Deep link parity check on `/network#slug`.
7. Push; CI green (queued-runner patience applies); deployed checks: three-theme network spot-check **and** the Item 2 Giscus verification that required the deployed URLs.

## Completion report

Report: housekeeping outcomes (Dependabot resolution, spec-sync summary), the edge-direction treatment chosen, the keyboard grammar as finalized, force parameters that produced a readable layout (they're the design values of this mode — record them like geometry constants), initial-view decision at mobile, bundle impact of `d3-force` + `d3-zoom`, all improvisations for back-fill, and anything the network's structure suggests about content (e.g., orphan nodes with no edges — those are content findings for the content phase, list the slugs).
