# Task Brief — Phase 3.4: Radial Network Restructure (+ Giscus light rider)

**Destination:** `docs/tasks/phase-3.4-radial-network.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 3.4 — restructure Mode 3's layout from free force clustering to a concentric degrees-of-separation structure: core concepts at center, rings outward by conceptual distance, branches holding angular sectors. This realizes the original Mode 3 vision ("central ideas at center, peripheral at edges") and prepares the geometry that future content — including eventual interdisciplinary gateway nodes at the periphery — will slot into automatically. **Layout-module change only:** rendering, interactions, themes, pan/zoom, and the preview card survive as-is.

---

## Item 0 — Rider: Giscus light theme gets the amber

Default and Midnight custom themes are confirmed good. Light currently uses giscus's built-in `light`, whose GitHub-green accents clash with the palette.

1. Derive `public/giscus/light.css` from the built-in `light` theme source (same giscus repo path as before), replacing the green accent/interaction colors with the **light theme's derived accent** from `theme-light.css` (the deeper amber that passed contrast on paper — not the base `#e08a3c`). Surfaces/text may stay near the built-in values where they already harmonize; only change what clashes. Same header contract: `token-name → hex` map, generated-file note.
2. Update the `LessonComments` mapping: light → the new URL. All three themes now use owned CSS; update the header comments accordingly.
3. Verification: deployed-only, and the known tool limitation applies (the cross-origin iframe screenshots black) — verify the CSS serves 200 with correct values and the config passes the URL, then **flag for the user's manual visual look**, as with the previous two.

Commit: `Design: token-matched Giscus light theme (3.4)`

## Standing rules (inherited)

Token discipline + hex grep on `src/` (public/giscus exempt as established); improvisations reported for `components.md` back-fill; determinism preserved (no `Math.random` — the phyllotaxis-seed principle from 3.3 continues); no content pipeline or schema changes (the schema gets a docs-only reserved note, Item 3); environment quirks from 3.2/3.3 apply verbatim (front the window before measuring; dispatched `KeyboardEvent`s for keyboard passes).

## Item 1 — The radial layout

All changes in `layout.ts` (and its constants), consumed by the existing renderer.

### Center and rings

- **Center is pinned, not computed:** a named constant `CENTER_SLUG = "society"` with a comment stating it's an editorial choice (highest-degree node at time of writing, and the discipline's natural root). Computing it from degree would let future content silently move the center; pinning makes recentering a deliberate one-line decision.
- **Ring index = BFS depth from center** over the undirected union of prerequisite + related edges. This is the placement rule that makes future content self-locating: a node's frontmatter determines its ring. Unreachable nodes → outermost ring + listed in the report as content findings (currently zero; that must stay checkable).

### Forces

- Keep: `forceLink`, `forceManyBody` (charge), and the **rectangle separation force** from 3.3 (its rationale stands).
- Add: `forceRadial` per node at `ringRadius(depth)`, strong (start ~0.8) — this is now the dominant positional force.
- Remove: the asymmetric gravity (its letterbox-fighting job is superseded by radial geometry; note the removal beside the 3.3 parameter comments rather than deleting the reasoning history).
- Retune and **document the new parameters the same way 3.3's were** — ring radii spacing, link distance/strength, charge — they are the design values of this mode, v2.

### Angular coherence (what makes it read like branches, not a dartboard)

Seed each node's initial angle from its BFS parent's angle plus a small deterministic offset (hash of slug — no randomness), so subtrees settle into angular sectors like the reference structure. Ring-1 nodes distribute evenly around the center. The phyllotaxis seed remains the fallback for anything without a parent angle. Verify layout is identical across runs, as in 3.3.

### Ring guides

Muted dashed concentric circles behind the graph at each occupied ring radius — wayfinding furniture, not chrome. New token expected (e.g. `--color-ring-guide` in the edge group; flag it) — do **not** reuse the non-published dash treatment's color/prominence; the two dashed meanings must read differently (guides sit far behind at low opacity). One line added to the legend: rings = conceptual distance from the core.

### Grammar and view updates

- `Home` now focuses the **center node** (was highest-degree — the layout gives "home" a literal meaning). Update the keyboard docs in `components.md` and the `aria-label`.
- Initial view: `fit` where it clears the legibility floor; the fallback centers `CENTER_SLUG` (which the radial layout makes equivalent to centering the structure). Re-verify the 390px decision — the radial extent may differ enough from 3.3's ~1693×967 to change which branch fires; report the new numbers.
- Everything else — edge treatments, selection highlighting, preview card, deep links, zoom cluster, adjacency arrow-traversal — must need **zero changes**. If anything outside `layout.ts` (plus the small grammar/legend/docs touches above) demands editing, stop and report: that's the module boundary leaking.

Commit: `Feature: radial degrees-of-separation network layout (3.4)`

## Item 2 — Spec and docs sync

- `components.md`: the network section's layout description, ring guides, revised `Home`, and the v2 parameter set.
- `docs/schema.md`: add a short **"Network placement"** note documenting the derived rule — a node's ring is its prerequisite/related distance from the core — so content authors in the coming phase understand that frontmatter *is* placement. No schema fields change.

Commit: `Docs: components + schema notes for radial network (3.4)`

## Item 3 — Reserved future: interdisciplinary gateways (docs only)

Encode the long-term intent without building any of it:

- `docs/schema.md`, a **"Reserved fields"** subsection: a future `discipline:` (or `branch:`) frontmatter field for periphery nodes that bridge into adjacent social sciences (economics, anthropology, political science, psychology). Reserved means: not valid yet, the content linter should continue to reject it, and no node may use it until a future phase specifies semantics.
- `README.md` Roadmap, Further out: add "Interdisciplinary gateway nodes — periphery concepts bridging into adjacent social sciences, opening future branches beyond sociology." (Sits naturally beside the Mode 4 line.)

Commit: `Docs: reserve interdisciplinary gateway direction (3.4)`

## Verification

1. Lints, content lint, build; hex grep clean; determinism check (two runs, identical positions).
2. Visual: rings legible, branches sectored, center anchored; zero overlaps at settle; compare general structure against the reference intent (concentric + branching), not pixel-for-pixel — there is no mockup, the structure is the spec.
3. All three themes across idle / selected / preview / guides — still zero theme-conditional code.
4. Keyboard pass per updated grammar (dispatched events); `Home` → center.
5. 390px: initial-view decision re-verified against the new extent.
6. Reduced motion unchanged (settled layout).
7. Push; CI green (runner patience); deployed spot-check + Giscus light flagged for manual look.

## Completion report

Report: the v2 force/ring parameters and settled extent, ring occupancy (how many nodes per ring — this is a content-shape finding: a bloated ring 1 or empty ring 3 tells the content phase where depth is missing), the 390px decision with numbers, new tokens, whether the module boundary held (it should), Giscus light URLs/values for the manual look, and any node whose ring placement looks editorially wrong despite being derivationally correct — those are prerequisite-frontmatter findings for the content phase, list slugs.
