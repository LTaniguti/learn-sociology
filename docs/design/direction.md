# learn-sociology — Visual Direction

## Direction: **Open Commons** (dark)

### In one line
Warm ink on dark paper: a reading-first sociology commons that also wears its open-source, repo-as-database nature on its sleeve.

### Rationale
The design pairs a humanist reading serif (**Spectral**) for all prose with a monospace (**IBM Plex Mono**) for every piece of metadata — breadcrumbs, section eyebrows, tags, badges, attribution. That split is the whole idea: the *content* reads like a well-set book, while the *scaffolding* reads like the plaintext Markdown/GitHub substrate it actually is. The surface is a warm near-black (`#100c08` → `#191512`) rather than a neutral gray, so the page feels like aged paper under lamplight, not a SaaS dashboard. A single amber accent (`#e08a3c`) carries wayfinding — current node, links, primary actions — and never competes with content.

The subject supplies the personality, not decoration. Two motifs recur:
- **Ideas as a connected network** — the hierarchy is a literal node-and-edge canvas; the node page carries a mini-tree locator; breadcrumbs and "In the map" reinforce position.
- **Multiple lenses on one thing** — the Perspectives section renders the three paradigms side by side as equal, colour-coded columns (functionalism / conflict / interactionism), never flattened into one voice. Those same three paradigm colours reappear as colour tags on related concepts and as dots in the tree, so the multi-paradigm system is legible everywhere.

### Personality
Scholarly but approachable · honest about its own maturity (the draft banner and disabled future-mode tabs are styled first-class, not hidden) · plainspoken and un-glossy · quietly technical. No gradients, no mascots, no stock ed-tech blue.

### Rules of thumb for screens we haven't designed yet
Apply these so any new surface (a future Mode 3 "Network" view, a settings page, a contributor dashboard) inherits the system without re-deciding it:

1. **Surface ladder.** Backgrounds step `--color-canvas` (behind everything) → `--color-surface` (panels) → `--color-surface-sunken` (sidebars/rails) → `--color-surface-raised` (bars, nodes, popovers). Never introduce a new gray; pick the nearest rung.
2. **Two-font rule.** Prose, titles, and anything a learner *reads* → serif. Anything that is *data about* the content (labels, counts, tags, paths, status, timestamps, keyboard hints) → mono, usually uppercase with letter-spacing. If you're unsure which, ask "is this the lesson, or is this metadata about the lesson?"
3. **Amber is for wayfinding only.** Use `--color-accent` for the current/selected item, links, and the single primary action on a screen. If two things on a screen are amber, one of them is wrong.
4. **Paradigm colours are semantic, not decorative.** Only ever use the paradigm trio to denote functionalism / conflict / interactionism. Don't repurpose teal or rose for unrelated UI.
5. **Honesty is styled, not buried.** Any "not done yet" state — draft/review status, disabled future modes, empty/reserved regions, device-local-only limitations — gets an explicit, legible treatment (dashed border, muted-but-readable text), never a hidden or fake-complete one.
6. **Every value comes from `tokens.css`.** No ad-hoc hex, size, or radius. New semantic needs get a new token (added to the right group), not an inline literal.
7. **No accounts, ever.** Progress is device-local. Never imply login, profiles, streaks, or social. Metadata is limited to: title, summary, parent, prerequisites, related, tags, difficulty, thinkers, source, status. Don't design anything that needs data outside that set (no ratings, view counts, authors, durations).
8. **Attribution is UI.** The CC BY line is a permanent, styled footer element on any content screen — mono, muted, but always present.
9. **Density & rhythm.** Content column caps at ~660px for readability; the right rail is a fixed 288px. Section headings use the mono eyebrow treatment except the Perspectives signature, which earns a larger serif heading. Generous vertical spacing from the `--space-*` scale (sections ~30–34px apart).

---

## Typography sourcing note

This is an open-source repository, so every font must be freely redistributable. Both families in this direction qualify — no substitution was required.

### Spectral — reading & display serif
- **Weights used:** 300 (lede/summary), 400 (body), 600 (serif section headings, wordmark alt), 700 (titles, wordmark). Italic 400 used for term emphasis in prose.
- **Where to get it:** Google Fonts — https://fonts.google.com/specimen/Spectral · source repo https://github.com/productiontype/Spectral
- **License:** SIL Open Font License 1.1 — free to bundle and self-host in an open-source project.
- **Self-hosting:** designed by Production Type for Google; ship the OFL `woff2` files in the repo (`/public/fonts`) and declare `@font-face` rather than relying on the Google CDN, so the site works offline and without third-party requests.

### IBM Plex Mono — metadata / labels / repo texture
- **Weights used:** 400 (tags, captions, breadcrumb, body meta), 500 (eyebrows, badges, tabs), 600 (mono section headings).
- **Where to get it:** Google Fonts — https://fonts.google.com/specimen/IBM+Plex+Mono · source repo https://github.com/IBM/plex
- **License:** SIL Open Font License 1.1 — free to bundle and self-host.
- **Self-hosting:** same approach — bundle the OFL `woff2` files.

### Fallback stacks (also in `tokens.css`)
```
--font-serif: "Spectral", Georgia, "Times New Roman", serif;
--font-mono:  "IBM Plex Mono", ui-monospace, "SFMono-Regular", "Menlo", "Consolas", monospace;
```

### Recommended `@font-face` weights to ship
Spectral: 300, 400, 400 italic, 600, 700 · IBM Plex Mono: 400, 500, 600. Subset to Latin (+ Latin-Extended if lessons need it). Use `font-display: swap`.

**Amendment (Step 2.9):** both families are loaded via `next/font/google`, which downloads at build time and self-hosts the output — same goals (no runtime third-party requests, OFL, `swap`, Latin subset) without committing woff2 binaries to the repo.
`tokens.css` bridges the scoped variables: `--font-serif: var(--font-spectral, "Spectral"), …` / `--font-mono: var(--font-plex-mono, "IBM Plex Mono"), …`.
