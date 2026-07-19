# Task Brief — Phase 3.1: Theme Switcher (+ right-rail toggle rider)

**Destination:** `docs/tasks/phase-3.1-theme-switcher.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 3.1(b) — implementation half of the theme switcher. The design half is done: the two themes exist as token-override CSS files produced by Claude Design. This step wires them in, adds the control, and carries one small rider (node-page right-rail toggle). Structure stays locked; this is chrome and plumbing.

---

## Preconditions

- 2.10 is merged and deployed (shell has working search; CI green on `main`).
- The design artifacts exist:
  - `docs/design/theme-midnight.css` — a single `[data-theme="midnight"] { ... }` block
  - `docs/design/theme-light.css` — a single `[data-theme="light"] { ... }` block
  - `docs/design/themes.md` — contrast tables and one-line character descriptions
  - Acceptance renders for both themes in `docs/design/hifi/`

**If any design file is missing, stop and report.** If the CSS files exist but use a different attribute value than `midnight`/`light`, stop and report rather than renaming anything.

## Standing rules (inherited)

- Token discipline: the theme files may only **override** variables that exist in `docs/design/tokens.css`. Components never reference theme names — they keep reading the same variables. The hex-literal grep guard applies to `src/` as before (the theme files live in `docs/design/` and are exempt, like `tokens.css`).
- `components.md` has no spec for the new controls; improvise within the direction's rules of thumb and **list every improvised value in the report** so the spec can be back-filled.
- One `localStorage` key per concern, one owner module per key, mirroring `progress.ts`.
- Direction rule 5: no inert controls; rule 3: amber wayfinding still means at most one amber emphasis per control.

---

## Item 1 — Wire in the theme files

Import both theme files in `src/app/layout.tsx` immediately **after** the `tokens.css` import (same out-of-`src` relative import pattern; same fallback-and-report rule as 2.9 if the tooling objects).

**Mechanical guard before anything else:** extract every `--*` property name declared in the two theme files and verify each exists in `tokens.css`. A one-off script or shell pipeline is fine; paste its output in the report. Any unknown variable → stop and report (it means the design export drifted from the frozen-names constraint).

Semantics: no `data-theme` attribute (or any unknown value) = the shipped Open Commons dark. **Do not** add any `prefers-color-scheme` behavior — the default is the default regardless of OS setting; this is a deliberate product decision.

Commit: `Design: import midnight + light theme overrides (3.1)`

## Item 2 — Theme state module + no-flash boot

- `src/lib/theme.ts`: owns one `localStorage` key. Valid values `"midnight" | "light"`; anything else (including absence) means default. Exposes get/set; `set` writes storage, sets/removes `data-theme` on `document.documentElement`, and dispatches a `themechange` CustomEvent (Item 4 consumes it).
- **No-flash boot:** a static export reading `localStorage` after hydration will flash the default theme on every load for midnight/light users. Prevent it with a tiny inline script in `<head>` (in `layout.tsx`), executed pre-paint: read the key inside `try/catch`, and set `data-theme` **only if** the value is exactly `"midnight"` or `"light"` — whitelist, never echo arbitrary storage contents into the DOM. Keep it under ~10 lines with a comment explaining why it must be inline. If a lint rule objects to the inline script, use the established justification-comment pattern from 2.6/2.10 rather than restructuring.

Commit: `Feature: theme state module with pre-paint boot script (3.1)`

## Item 3 — Shell control

A compact three-way segmented control in the top bar, right side (between search and the tab group's far edge, or wherever the 58px bar accommodates it cleanly at desktop widths — judgment call, report placement).

- Labels in mono at the control token size. Use the character names from `themes.md` if they're short enough to sit in the bar; otherwise `Dark / Midnight / Light`. Default option first.
- Active segment: amber text or amber underline — one amber treatment, not both. Idle segments muted; hover per the tab hover pattern.
- Semantics: `role="radiogroup"` with three `role="radio"` options (`aria-checked`), arrow-key movement within the group, focus ring per the global rule.
- Mobile: if the bar can't fit it at 390px, collapse to a single cycling button (mono glyph + `aria-label` announcing the current theme). Report which route was taken.

Commit: `Feature: theme control in shell (3.1)`

## Item 4 — Giscus follows the theme

- Mapping: default and `midnight` → `noborder_dark`; `light` → the built-in `light` theme.
- `LessonComments` reads the current theme at mount and subscribes to the `themechange` event. On change, update the embed via the giscus iframe `postMessage` config update (preferred — no reload of the thread) or, if that proves brittle, re-render with the new `theme` prop; report which.
- Keep the existing `// TODO(post-2.9)` for the token-matched custom theme, updating its wording to note it should eventually cover all three themes.

Commit: `Feature: Giscus theme follows site theme (3.1)`

## Item 5 — Rider: node-page right-rail toggle

Mirror the 2.10 course-sidebar toggle, applied to the node page's 288px right rail. Desktop only (the rail already stacks below on mobile).

- Toggle at the rail's top edge; `aria-label` "Hide details" / "Show details", `aria-expanded`; focus ring.
- Collapsed: rail animates to a slim rail holding only the toggle; the article column stays capped at its 660px measure and recenters — hiding the rail buys whitespace, not longer lines.
- Persistence: its own `localStorage` key and owner (extend the small-preference module pattern; **not** `progress.ts`, not the theme key).
- `--transition-fast`; honor `prefers-reduced-motion`.

Commit: `Feature: collapsible node-page right rail (3.1)`

## Item 6 — Docs touch-up

- `README.md` Roadmap: remove the theme switcher line from "Further out"; add a line to the "How it works" design bullet noting the site ships three themes with device-local selection.
- Confirm `docs/design/themes.md` is committed as delivered by the design session (don't rewrite it).

Commit: `Docs: README reflects shipped theme switcher (3.1)`

---

## Verification

1. `npm run lint`, `npm run lint:content`, `npm run build` pass; hex-literal guard clean; theme-variable guard output clean.
2. Manual, on the served export, **per theme × per screen** (course, hierarchy, node): switch applies instantly everywhere, persists across reload and navigation, and a hard refresh shows **no flash** of the default theme when midnight/light is stored.
3. Giscus visibly follows a theme change without losing the thread.
4. Keyboard: the segmented control is fully arrow-key operable; both new toggles (rail + control) show the focus ring; collapsed rail traps no focus.
5. `prefers-reduced-motion`: rail collapse and any control transitions go instant.
6. Light-theme spot-check against the light acceptance render — pay attention to shadows and the accent, the two places light themes drift.
7. Push; CI green; deployed spot-check in all three themes.

## Completion report

Report: the theme-variable guard output, control placement and mobile route taken, every improvised control/toggle value (for back-filling `components.md`), the Giscus update mechanism used, any token the light theme revealed as insufficiently abstracted (e.g., a component that still assumed dark), and confirmation the boot script is whitelist-only.
