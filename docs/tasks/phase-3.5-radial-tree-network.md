# Task Brief — Phase 3.5: Network as Radial Tree + Quiet Cross-links

**Destination:** `docs/tasks/phase-3.5-radial-tree-network.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 3.5 — Mode 3's layout moves from force-with-radial-constraint to a **radial tidy tree of the Mode 2 hierarchy**, with prerequisite/related edges rendered as a quiet overlay that comes forward on selection. Rationale (record in `layout.ts`'s header): ring depth becomes *declared* specialization (the curated `parent:` chain) instead of derived BFS distance, branching is guaranteed by tidy-tree construction instead of tuned by forces, and the cross-link web becomes contextual instead of constant. One source of truth for "how core is this concept" — the hierarchy — shared by Modes 2 and 3.

**Sanctioned scope is wider than 3.4's:** `layout.ts` (rewrite), the edge-rendering portion of `NetworkCanvas.tsx` (faint/emphasis treatment), legend, grammar doc touches, and the linter rider below. Preview card, zoom, deep links, themes, tabs, and all other screens stay untouched — the tripwire still applies outside the sanctioned set.

---

## Item 0 — Rider: linter unknown-key rejection (sanctioned pipeline change)

Closing the gap 3.4 reported: `scripts/lint-content.mjs` silently ignores unknown frontmatter keys, which makes "reserved" unenforceable and lets contributor typos (`prerequisite:` for `prerequisites:`) pass as valid.

1. Add an allowlist check: every frontmatter key must be in the known-field set from `docs/schema.md`. Unknown key → lint error naming the key and the file.
2. Reserved fields (`discipline:` / `branch:`) get a **distinct** error message: reserved for a future phase, not yet valid — matching the schema note's wording.
3. Run against all 53 nodes; any existing unknown keys found are findings — fix obvious typos, report anything editorial.
4. Update the schema note from 3.4: the "current gap" sentence is now resolved; reserved is mechanically enforced.

Commit: `Lint: reject unknown frontmatter keys, enforce reserved fields (3.5)`

## Standing rules (inherited)

Tokens + hex grep (`public/giscus` exempt); improvisations reported for `components.md`; determinism (tidy tree is deterministic by construction — keep it that way, no randomness anywhere); environment quirks verbatim (front the window before measuring; dispatched `KeyboardEvent`s); queued-runner patience.

## Item 1 — The layout rewrite

### Tree source and center

- Consume the **same tree construction Mode 2 uses** — do not build a parallel hierarchy. If that tree has a single root node, it is the center. If it is a forest of module roots, introduce a **virtual hub**: a small labeled disc ("Sociology") at the origin that is visually distinct from content pills (it is not a node — no preview card, no dashed states; it is furniture). Report which case applied and the hub treatment if improvised.
- `CENTER_SLUG` is retired; the center is structural now.

### Radial tidy layout

- `d3-hierarchy`'s `tree()` (already installed since 3.2) with angular coordinates: `size([2π − gap, 1])`, radius = `depth × ringSpacing`, polar → cartesian. A separation function that gives leaves even angular spacing and holds sibling subtrees in contiguous sectors — this is what produces the branching read by construction.
- Keep the rectangle-aware spacing concern: pills are wide, so angular separation at inner rings must account for pill width at that radius (a separation function scaled by `1/depth` is the standard move; verify no overlaps ring by ring, and report the ring spacing / gap values as the v3 design constants).
- **Remove `d3-force`** from the dependency tree entirely; report the bundle delta. `d3-zoom` stays.

### Edge rendering (the sanctioned `NetworkCanvas` change)

- **Tree edges** (parent links): the structural skeleton — full `--color-edge` weight, curved radially (arcs or radial béziers, matching the branching aesthetic).
- **Cross-links** (prerequisites + related, from the existing edge module): faint by default — new token expected (e.g. `--color-edge-faint`, or an opacity approach if it themes cleanly; flag whichever) — **no arrowheads at faint weight** (markers at whisper opacity read as dirt).
- **On selection:** the selected node's incident cross-links come up to full weight with the 3.3 treatments restored (arrowheads on prerequisites, lighter-vs-full weight distinction), plus its tree path back to the center in `--color-edge-active`. Neighbor highlighting unchanged. Deselect returns everything to quiet.
- Non-published dash on nodes: unchanged. Ring guides: stay, now at hierarchy depths; legend updated — rings = specialization depth; faint lines = relationships (shown fully for the selected concept).

### Grammar and view

- Keyboard adjacency for arrow traversal = **union** of tree edges and cross-links (the tree alone would strand keyboard users off the skeleton's cross-connections). `Home` → the center (root or hub — if hub, `Home` lands on the first ring-1 node instead, since the hub isn't focusable content; report the choice). Update `components.md`.
- Initial view / 390px: re-run the fit-vs-center decision against the new extent with numbers, as in 3.4.
- Deep link `/network#slug`: unchanged behavior, re-verified.

### Resolved-by-construction (verify and note in report)

3.4's editorial findings should dissolve under hierarchy depth: the paradigm trio are hierarchy siblings → same ring; the research-methods chain sits at its curated depth, not its prerequisite-chain depth. Confirm both. Any placement that *still* looks editorially wrong is now a `parent:` finding for the content phase — list slugs.

Commit: `Feature: network as radial tidy tree with quiet cross-link overlay (3.5)`

## Item 2 — Docs sync

- `components.md`: network section v3 — layout basis, edge two-state treatment, legend, grammar changes, v3 constants.
- `docs/schema.md` "Network placement" note: placement is now hierarchy (`parent:`) depth; prerequisites/related render as the relationship overlay. Keep it to a few lines — authors need the rule, not the implementation.

Commit: `Docs: components + schema notes for tree-based network (3.5)`

## Verification

1. Lints (including the new allowlist behavior — prove it fires on a scratch file with a bogus key, then delete the scratch), content lint on all nodes, build, hex grep.
2. Determinism: two runs, identical fingerprints.
3. Visual: branching sectors, distinct rings, quiet idle web; selection brings up exactly one node's relationships; compare against the structural intent (the branching reference from 3.4's discussion) — structure is the spec, no mockup.
4. Three themes × idle / selected / preview / guides / faint edges — zero theme-conditional code; check the faint treatment specifically in Light (low-opacity edges on paper are where faintness goes invisible; if the faint token needs a different value per theme, that's what the theme files are for — not code).
5. Keyboard per updated grammar, dispatched events; traversal reaches nodes whose only connection is a cross-link.
6. 390px decision with numbers; reduced motion unchanged.
7. Push; CI green; deployed spot-check across themes.

## Completion report

Report: linter findings from the allowlist run, root-vs-hub case and treatments, v3 layout constants and settled extent, ring/sector occupancy under hierarchy depth (the new content-shape picture — where the *hierarchy* wants depth added), bundle delta from dropping `d3-force`, faint-edge approach per theme, grammar decisions (`Home`, adjacency union), confirmation the 3.4 editorial findings dissolved, any remaining editorially-odd placements as `parent:` findings (slugs), and whether the sanctioned boundary held.
