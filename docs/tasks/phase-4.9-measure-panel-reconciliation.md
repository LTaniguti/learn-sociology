# Task Brief — Phase 4.9: Measure–Panel Reconciliation

**Destination:** `docs/tasks/phase-4.9-measure-panel-reconciliation.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** owner-directed design refinement following the 4.8 report. Owner observation (desktop, `social-norms` as the reference page): the Perspectives panel is markedly wider than the article prose and the pair reads as mismatched; the body could be somewhat wider and the whole composition more uniform.

**Read first:** `components.md` (4.8 design anchors, before/after table, rail Perspectives entry), the 4.8 commit bodies covering the `.node-main` named-track grid and the `display: contents` split mechanism, and the current theme token definitions. Documents win over this brief's prose, as always.

## The design rationale (record it in `components.md` when done)

- The prose measure does **not** widen to the panel's width. Current 70ch ≈ 77 real CPL (incl. spaces) is already at the top of the 60–75 readability range; matching the 832px panel would exceed 100 CPL. The 4.8 anchor stands.
- The owner's "wider and more uniform" is honored from **both sides**: prose moves to the top of the documented range, and the panel's cap stops being a free-standing pixel value and becomes a **function of the measure** — prose plus a symmetric overhang. A systematic relationship is what makes a width difference read as intentional.
- The remaining difference is made legible with a **container treatment**: the panel becomes a visually framed feature band (the standard editorial "popout" pattern), not bare cards at an unexplained width.

## Item 1 — Prose measure to 75ch

- `.node-main` prose track: `minmax(0, 70ch)` → `minmax(0, 75ch)`. Expected default width 618.75px (ch = 8.25px at the 16.5px body).
- Verify the A−/A/A+ steps scale the column as before: expected 562.5 / 618.75 / 675px, CPL constant across steps.
- Record the new real CPL (expect ≈82 incl. spaces) in `components.md` with the rationale: top of the documented 60–75ch range, owner preference for a fuller column; **this is the ceiling** — future passes do not widen further.

## Item 2 — Panel cap tied to the measure

- Replace the panel's current effective bound (832px content / 864px `.node-main` max-width) with: **panel content width = prose measure + 2 × overhang**, overhang declared in ch, target **9ch per side** (→ 93ch = 767.25px content at default). Executor may choose 8–10ch per side if 9 fights the existing gutter minimums; record the final value and why.
- Implement via the `.node-main` bound: reduce its max-width so `[breakout-start]…[breakout-end]` resolves to the new cap (content + the existing 16px × 2 padding). The two `minmax(24px, 1fr)` gutter tracks are unchanged.
- The 4.8 principle that **both hosts share one panel bound** stands: the course article column adopts the same new bound; the rail and page gutters absorb the difference. If sharing the bound would regress the 4.8 rail-width audit, stop and report before improvising.
- Because prose and overhang are both in ch, confirm the panel scales with the A−/A/A+ steps alongside the prose (no fixed-px panel at any step).
- Card math at the new cap: three-across must clear the 220px readability minimum (expect ≈230–240px cards at 767px content with existing gaps). If it cannot, stop and report — do not shrink the minimum.
- Two-item sections: the 4.8 cap of 2×360px centered may now exceed the panel. Recompute the two-card cap to fit inside the new bound with existing gaps (expect ≈2×350px), keep it centered, record the value.
- **Re-record all wrap thresholds.** The 4.8 numbers (three-across ≥724px article column; the non-monotonic course flip at the 1150 rail boundary) were computed against the old cap and are now stale. Re-derive and record the new thresholds for both hosts, including whether the 1150 flip still exists and where the trio now returns with the rail inline.

## Item 3 — Container treatment for the panel

- The Perspectives section (the element carrying `grid-column: breakout`) gets: a subtle surface-tint background from the **existing token set** (no new hex — the standing rule), border-radius consistent with the existing card radius, and internal padding so cards never touch the container edge. A hairline border is optional if the token set has one in use; executor judges against the current card styling and records the choice.
- The treatment must hold in every theme the site ships — verify each, not just default.
- The anchor-jump behavior from the rail chips (heading lands at viewport top, both hosts) must survive the added padding; re-verify on `social-norms` live.
- Known artifact: the embedded-browser `:has()` style-invalidation lag observed in 4.8 may fire during live-toggle testing of the tinted background. As before, the static build and reload state are authoritative; note it if seen, change nothing for it.
- The prose-fallback nodes (e.g., `sociological-imagination`) render no section and therefore no container — confirm no empty band appears.

## Verification

1. Computed-style + geometry evidence (per the standing below-fold substitution rule where screenshots fail) at 1440, 1024, 768, 390 for both hosts on `social-norms`, plus `labeling-theory` (two-card cap) and `sociological-imagination` (no panel).
2. Prose column exactly 75ch at all three font steps; panel exactly measure + 2×overhang at all three steps; both hosts sharing the bound.
3. The four margin-collapse boundaries re-pinned in 4.8 re-verified (expect 34px unchanged; if the container padding shifts any, re-pin and record).
4. 390 unchanged: 358px, one column, no overflow, container treatment intact at full width.
5. New wrap-threshold table recorded; card widths at each breakpoint noted.
6. Canvas fingerprint untouched, no new hex anywhere in the diff, lints + `lint:content` + build green, deploy success, live spot-check `social-norms` and a course lesson at desktop and phone width.

## Commits

Two commits: Item 1 + Item 2 together (they are one geometric system) — `Design: prose measure to 75ch; Perspectives panel bound to measure via symmetric ch overhang (4.9)` — and Item 3 — `Design: Perspectives panel container treatment from existing tokens (4.9)`. `components.md` updates ride with the commit whose content they document.

## Stop and report (do not improvise past these)

- Three-across cannot hold ≥220px cards at the new cap at 1440.
- Sharing the new bound across hosts regresses the 4.8 rail audit.
- The token set has no suitable surface tint (do not invent one).
- Any schema/docs conflict — documents win; flag it.

## Report back

The new measure and panel cap with real CPL; the chosen overhang and card widths; the recomputed two-card cap; the full re-recorded wrap-threshold table (including the fate of the 1150 flip); the container treatment as implemented per theme; boundary re-verification; improvisations.
