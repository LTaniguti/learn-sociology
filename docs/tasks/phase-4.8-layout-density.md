# Task Brief — Phase 4.8: Layout Density — Reclaiming Dead Space, Perspectives Three-Across

**Destination:** `docs/tasks/phase-4.8-layout-density.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** owner-directed design pass. Two connected observations: (1) the course view carries an excess of empty space at the sides of the text, (2) the three-paradigm Perspectives section wraps two-over-one where it should sit three across. Both are width-allocation problems with one shared fix philosophy: **prose keeps its reading measure; everything else stops pretending to be prose.**

**The design anchors (state them in `components.md` when done):**
- Body prose reads best at roughly **60–75 characters per line** — the article column's current constraint near that range is *load-bearing readability*, not dead space, and does not get widened to "fill" the viewport. (Cite the measure as the rationale; this is the standard practice the owner asked to be referenced.)
- **Wide elements deserve breakout width.** Cards, tables, and multi-column sections aren't prose and needn't obey the prose measure. The fix for two-over-one is *not* shrinking cards below their 220px readability minimum to cram three into a reading column — it's letting the Perspectives section spill into the gutters.
- Gutters and rails must earn their width at every breakpoint. Space that frames the reading column is doing a job; space left over from a grid that never adapts between 640px and desktop is the dead space to reclaim.

**Measurement first, opinions second — this is the phase's method:** before changing anything, audit and record the actual numbers at 1440, 1024, 768, and 390: course-view grid template (sidebar / article / rail widths + gaps), article `max-width` in `ch` and px, effective characters-per-line at body size, gutter widths, and where the two-over-one wrap actually triggers. The report's before/after table is built from this audit. No spacing change ships without its before-number.

**Sanctioned scope:** layout-level CSS — `course.css`, `node-page.css` (now sanctioned; the 4.3 prereq-chip seal inconsistency flagged there may be fixed *if* trivially adjacent, reported either way), `perspectives.css`, any page-shell/grid CSS these views share — plus, for Item 3b only, `NodeRail.tsx` and the server pass-through of the already-extracted perspectives data (no new extraction, no pipeline change). **Tripwire:** typography tokens (sizes, line-heights, font families), spacing *tokens* (adjust layouts' use of tokens, never token values), all canvases, `SelfCheck`/quiz components, `lib/content.ts` beyond passing existing fields, content, themes.

**Post-4.7 note:** the content reorg landed first — nothing in it affects this phase (pure renames, zero CSS/route changes), but scratch fixtures created during verification now live under `content/sociology/` (and `content/sociology/quizzes/`).

## Standing rules (inherited)

Tokens + hex grep (layout values may be raw px/fr/ch where the system already uses them in layout context — match existing convention); improvisations reported; determinism (canvases untouched); `prefers-reduced-motion` (nothing should move); the promoted screenshot quirk with its evidence substitution; queued-runner patience. The `masteryMode` two-derivation observation stands logged; this phase touches neither file.

---

## Item 1 — The audit (commit nothing yet)

Produce the measurement table described above, plus a one-paragraph diagnosis per view: where the space goes at each breakpoint and which allocations aren't earning it. Include the Perspectives wrap math: available section width vs. `3 × 220px + 2 gaps`. This lands in the report and drives Items 2–3; if the audit contradicts an assumption below, the audit wins — say so and adjust.

## Item 2 — Course view density

Guided by the audit, reclaim what isn't working, typically some of:
- Grid gaps and outer gutters tightened at the widths where they balloon (often the 700–1100px band, where a desktop grid renders with mobile-scale content).
- The sidebar and any rail sized to their content's needs (`fit-content`/tighter `fr` ratios) rather than a fixed share of the viewport.
- The article column may grow **only within the prose measure** (if it currently sits at the low end, ~60ch, drifting toward ~70ch is legitimate; past ~75ch is not — record the chosen value and its ch measurement).
- Intermediate breakpoints added if the audit shows a dead band between the existing ones — fewer, wider-spanning breakpoints that adapt beat many that don't.

Not all space goes: the composition must still breathe — the owner's instruction is *reduce excess*, not maximize density. Judgment call per change, defended by its before/after numbers.

Commit: `Design: course view density — gutters, rails, and measure earn their width (4.8)`

## Item 3 — Perspectives three-across (breakout width)

- Give the Perspectives section (and structure the mechanism so future wide elements can reuse it) a **breakout width**: wider than the prose column, bounded by a sane max (align with the course grid's content edge or a named breakout track), centered, symmetric. Implementation options in order of preference: a named grid track on the article layout (`prose | breakout` columns), or a negative-margin + max-width pattern if the article isn't a grid — executor picks per the actual DOM, reports which.
- With breakout width, `auto-fit minmax(min(100%,220px),1fr)` should land three-across for the trio at desktop **without touching the 220px minimum**. Verify at 1440 and 1024; define and record the width below which two-across (and then one) is the *correct* rendering — wrapping at genuinely narrow widths is responsive design, not the bug.
- Two-item sections (theory nodes like `labeling-theory`) sit two-across at breakout width — confirm they don't stretch into absurdly wide cards (cap card `max-width` if the audit shows they do).
- 390px: unchanged single-column stack, no overflow.

Commit: `Design: Perspectives breakout — the trio sits three-across at desktop (4.8)`

## Item 3b — Perspectives surfaced in the right rail (owner-directed addition)

When a node has structured perspectives (the 4.5 extraction — reuse `node.perspectives`, extract nothing new), `NodeRail` gains a small **Perspectives block**:

- One chip per item, in the established chip vocabulary: attributed items show the canonical paradigm name with their paradigm accent (the same one-language rule the quiz chips and section cards already follow); neutral items show their authored label, unaccented.
- Each chip is an **anchor link** to the Perspectives section (give the section's `<h2>` a stable `id`, e.g. `#perspectives`) — the rail's job is orientation: *this concept is read three ways; jump there*. Smooth-scroll only via existing site behavior; add none.
- Rendered only when `perspectives` is non-null — no empty block, no placeholder, and prose-fallback nodes (like `sociological-imagination` today) show nothing, consistent with the section itself.
- Placement within the rail follows the rail's existing order logic (likely after related concepts — executor judges against the rail's current anatomy, reports the position). The block must not meaningfully change the rail's width demands measured in Item 1 — it's chips, not prose.

Commit: `Feature: right rail surfaces a node's perspectives as anchored paradigm chips (4.8)`

## Item 4 — Docs sync

`components.md`: the design anchors (measure range + chosen value, breakout rationale and mechanism, the "wrapping below X px is correct" line), the before/after table's headline numbers, the rail's Perspectives block (anatomy, anchor behavior, non-null rule, position), and — if the prereq-chip seal was fixed in passing — that entry's flag closed.

Commit: `Docs: layout density anchors and breakout mechanism (4.8)`

---

## Explicitly deferred

Homepage layout (its own roadmap entry as of 4.7); canvas viewport/fit changes; typography scale changes; a general design-system breakout audit beyond establishing the mechanism (future wide elements adopt it when they're built).

## Verification (the whole gate, in order)

1. `npm run lint:content` green; `npm run lint` clean; `npm run build` all pages.
2. Canvas fingerprint untouched (no canvas file diffs — grep the diff).
3. Manual at 1440 / 1024 / 768 / 390, all three themes:
   - Course view: the audit's dead-space diagnoses visibly addressed; sidebar, article, and rail all functional; no overflow, no cramped collisions at any width in between (drag-resize sweep).
   - Article prose: characters-per-line within the recorded measure at every width.
   - Perspectives: `social-norms` three-across at 1440 and 1024; `labeling-theory` two-across, cards not absurdly wide; stacked at 390; neutral-card scratch fixture unaffected (removed after; fixture lives under `content/sociology/` post-4.7).
   - Rail block: `social-norms` shows three accented chips, `labeling-theory` two, `sociological-imagination` none; clicking a chip lands the Perspectives heading in view (both hosts of the article); chips wrap cleanly at whatever width the rail collapses/stacks; no rail-width regression against the Item 1 audit.
   - Below-fold proof via the standing quirk's substitution where needed, noted.
4. Before/after screenshots (or substituted evidence) at each breakpoint for both views.
5. Push, deploy green, live spot-check course view and `social-norms` at desktop and phone width, including one rail-chip anchor jump.

## Report back

The full audit table with before/after; the chosen article measure in ch; the breakout mechanism as implemented and its max width; the wrap thresholds recorded as correct behavior; the rail block's position within the rail's anatomy and how it behaves where the rail collapses on narrow viewports; whether the prereq-chip seal flag was closed in passing or remains; improvisations.
