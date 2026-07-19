# Task Brief — Phase 2.6: Mode 2 Hierarchy View (Wireframe Frame 2)

**Destination:** `docs/tasks/phase-2.6-hierarchy-view.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 2, Step 2.6 — the collapsible concept hierarchy. This step **resolves wireframe open questions 1 and 2**: the tree is pure HTML/CSS/React with no graph library, and touch devices use tap-to-preview.

## Precondition — verify 2.5 landed

Confirm `src/app/course/[slug]/page.tsx`, `src/components/NodeArticle.tsx`, and `src/lib/progress.ts` exist on `main` and `npm run build` succeeds. **If 2.5 is absent or unpushed, stop and report.**

## Context (read first)

- `docs/wireframes.md` — Frame 2 section and the traceability table are the spec
- `docs/wireframes/mode2-hierarchy.svg` — the visual layout
- `docs/concept-list.md` — the tree's shape on paper: one root (`sociology`), ten first-level branches, max depth 4
- `lib/content.ts` — `getTree()` / `getAllNodes()`; the view must not read the filesystem itself
- `src/components/Shell.tsx` — the Hierarchy tab goes live in this step

## Architecture decisions (pre-made — follow, don't relitigate)

1. **Route:** `src/app/hierarchy/page.tsx`, one statically generated page. The server component builds the tree from the `parent` field and passes a **serializable tree** as props to a client `HierarchyTree` component. Each tree node carries only what the frame needs: `slug`, `title`, `summary`, `difficulty`, `tags`, `children`, and a precomputed `descendantCount`. `lib/content.ts` stays server-only.
2. **No graph library (resolves open question 1).** The tree is nested HTML driven by React state. Cytoscape/D3 is deferred until Mode 3 actually needs force-directed layout. If anything in this step seems to require a graph library, the design is wrong — stop and report.
3. **Layout:** root at the left, depth growing rightward, per the frame. An indented nested-list layout satisfies this — do not reach for absolute positioning or SVG edges. Cross-cutting edges (`prerequisites`, `related`) are **deliberately not drawn**; they belong to Mode 3.
4. **Expansion state** lives in one React state object in `HierarchyTree` (a `Set` of expanded slugs or equivalent). Initial state: root and its ten first-level children visible, everything deeper collapsed. Expanded nodes show a "−" control; collapsed nodes show "+" and their descendant count (e.g., a collapsed `deviance-and-social-control` communicates its weight). Controls: **Expand all / Collapse all** buttons above the canvas. Expansion state is ephemeral — do not persist it to `localStorage`; `progress.ts` stays the only storage owner.
5. **Preview card (resolves open question 2).** Desktop: hovering or keyboard-focusing a node title raises the card. Touch: first tap on the title opens the card; the card's **"Open lesson"** button navigates. Implementation guidance: make the card toggle on click for *all* pointer types and additionally show on hover/focus for desktop — that gives correct touch behavior without user-agent sniffing. Card contents, straight from the schema: `summary`, `difficulty` badge, `tags` chips, "Open lesson" link. One card open at a time; Escape or clicking elsewhere closes it.
6. **Navigation target:** "Open lesson" links to `/node/[slug]` — the mode-neutral lesson page, consistent with 2.5's shared-renderer decision.
7. **Deep linking:** the tree reads `window.location.hash` on mount (client-side; static export has no server routing). `/hierarchy#labeling-theory` expands the ancestor path to that node, scrolls it into view, and highlights it. Unknown hashes are ignored silently.
8. **Zoom:** a minimal text-scale control (e.g., three steps applied via a CSS variable or font-size on the canvas). This satisfies the frame's "zoom" annotation without pan/zoom machinery a nested list doesn't need.

## NodeArticle addition (minimal, both modes)

Per the wireframes, the node page breadcrumb "doubles as the you-are-here link back into Mode 2" — deferred from 2.4 to now. Implement it as **one small addition, not a breadcrumb rework**: ancestors keep linking to their lesson pages; append a single "View in hierarchy" link at the end of the breadcrumb row pointing to `/hierarchy#<slug>`. It renders in both `/node` and `/course` (it's mode-neutral navigation, traceable to `parent`). Keep the markup change minimal and note it in the report.

## Accessibility

- Expand/collapse controls are real `<button>`s with `aria-expanded`; the tree uses nested `<ul>`/`<li>` markup
- Preview card is reachable by keyboard (focus opens, Escape closes) and its "Open lesson" is a real link
- Descendant counts are text, not title-attribute-only

## Shell updates

**Hierarchy tab** now links to `/hierarchy` with an active state on that route. Course/Network/Sociologists unchanged. Update the landing page's description or links only if it currently implies the hierarchy isn't available.

## Housekeeping

Add `.claude/` to `.gitignore` (own commit, e.g. `chore: ignore local .claude tooling config`). Do not commit `.claude/launch.json`.

## Constraints

- The tree is built from **exactly one source: the `parent` field**. No other relationship may influence tree structure.
- Structure only: minimal layout CSS, semantic class names; visual polish is Step 2.9.
- No new dependencies. No `localStorage` writes outside `progress.ts` (this step writes none).
- Every element must trace to a schema field or an explicitly deferred feature per the traceability table.

## Verification (report results)

1. `npm run build` succeeds; export contains `/hierarchy` plus all pages from 2.4/2.5 unchanged (diff `/node/labeling-theory` HTML against the previous build — only the "View in hierarchy" breadcrumb addition may differ)
2. Initial view shows `sociology` plus its ten first-level children; collapsed root state shows descendant count 52
3. Expanding `theoretical-paradigms` reveals exactly its three paradigm children (`functionalism`, `conflict-theory`, `symbolic-interactionism`)
4. Descendant counts sum correctly: each node's count equals total descendants, and first-level counts + 10 + 1 = 53
5. Preview card for `labeling-theory` shows its summary, difficulty, tags, and a working "Open lesson" link to `/node/labeling-theory`
6. Expand all / Collapse all work; Collapse all leaves the root visible
7. `/hierarchy#intersectionality` on fresh load expands the path to it, scrolls, and highlights
8. Keyboard-only pass: tab to a node, open its card, follow "Open lesson"
9. `npm run lint:content` still passes; no changes to `/content`, `docs/schema.md`, `content/course.yaml`, or the lint script

## Commits

(1) gitignore housekeeping, (2) tree data + server page, (3) `HierarchyTree` client component with preview card and controls, (4) shell + "View in hierarchy" breadcrumb link. Main message: `Mode 2: collapsible hierarchy with preview cards and deep linking (Phase 2, Step 2.6)`.

## Stop-and-report conditions

- Missing/unpushed 2.5 work
- More than one root, a cycle, or a `parent` referencing a nonexistent slug (lint drift — report, don't patch)
- Anything seeming to require a graph library or an eleventh schema field
- Anything requiring schema, taxonomy, `course.yaml`, or lint-script changes
