# Task Brief — Phase 2.4: Node Page (Wireframe Frame 3)

**Destination:** `docs/tasks/phase-2.4-node-page.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 2, Step 2.4 — the lesson page both navigation modes land on. Ships before either mode because both only exist to reach it.

## Precondition — verify 2.3 landed

Confirm `lib/content.ts` exists and `scripts/pipeline-smoke.mjs` (or equivalent) passes, and that the 2.3 commits are pushed to `main`. **If the content pipeline is absent, stop and report — do not build it inline here.** If it exists locally but is unpushed, push it first as its own commits before starting 2.4.

## Context (read first)

- `docs/wireframes.md` — Frame 3 section and the traceability table are the spec; structure is locked to them
- `docs/wireframes/node-page.svg` — the visual layout
- `docs/schema.md` — field semantics, lifecycle, body headings contract
- `content/labeling-theory.md` — the reference node exercising the most features
- `lib/content.ts` — the only data source; the page must not read the filesystem directly

## Scope

Statically generated route `app/node/[slug]/page.tsx` (App Router, `output: 'export'`) rendering every node via `generateStaticParams()` from `getAllSlugs()`. **Structure only** — no visual styling beyond minimal layout CSS; the palette/typography pass is Step 2.9. Semantic HTML and clear class names now make 2.9 a stylesheet job, not a refactor.

## Page structure (top to bottom, per Frame 3)

1. **Shared shell / top bar** — project name linking home, four-tab mode switcher (**Course**, **Hierarchy** as links — dead links or `#` targets are fine until 2.5/2.6 — and **Network**, **Sociologists** rendered disabled, not hidden), and a search box rendered as an inert input (search behavior is not in 2.4; leave a TODO comment referencing the wireframes' search scope of `title` + `summary`). Build the shell as a reusable component (`components/Shell.tsx` or similar) since Frames 1 and 2 reuse it.
2. **Breadcrumb** — walk the `parent` chain to the root via the pipeline's tree/node data; each ancestor links to its own node page. (Linking into Mode 2 comes with 2.6; for now ancestors link to their lesson pages.)
3. **Title block** — `title`, `difficulty` badge, and a maturity banner whenever `status !== "published"` (wording per status, e.g. "This lesson is a stub/draft/in review — content is incomplete"). Since all 53 nodes are currently stubs, the banner will appear everywhere; that's correct behavior, not a bug.
4. **Lede** — `summary` as a standout paragraph.
5. **Prerequisites callout** — each prerequisite as a link with its title (resolve via `getNode`). Completion state is a Mode 1 / localStorage concern (Step 2.5); render the list without checkmarks now, structured so 2.5 can add state without markup changes.
6. **Body** — the rendered HTML from the pipeline. Do not re-parse Markdown here. The fixed headings (Definition / In depth / Perspectives / Examples) live in the content files themselves, not the template.
7. **Right rail** — `related` as links to node pages; `thinkers` as plain text (annotate in a comment: Mode 4 seed data, deliberately inert); `tags` as chips (inert — filtering is deferred).
8. **Giscus placeholder** — an empty, clearly-commented region at the page bottom for Step 2.7. No Giscus script yet.
9. **Attribution footer** — when `adapted_from` is present, render it as a visible CC BY line linking to `LICENSE-CONTENT.md` (match the phrasing pattern in that file's reuse template). Omit the line entirely for nodes without `adapted_from`.

## Constraints

- Every element must trace to the wireframes' traceability table; if something seems to need an eleventh schema field, the page design is wrong — stop and report.
- Server components throughout; the only client component permitted is the shell's disabled-tab tooltip if you add one (prefer not to — zero client JS is the ideal for this step).
- Handle a bad slug at build time with a clear error, not a runtime 404 fallback (static export has no server).
- Root node `sociology` has no parent: breadcrumb renders just "sociology", no prerequisites callout if the list is empty.

## Verification (report results)

1. `npm run build` succeeds; static export contains 53 node pages
2. `labeling-theory` page shows: breadcrumb `sociology / deviance-and-social-control (or actual parent chain) / labeling-theory`, two prerequisite links, thinkers text, tag chips, attribution footer
3. A node without `adapted_from` shows no attribution line
4. Stub banner appears on all stub nodes
5. All internal links resolve within the exported site (spot-check plus a link count vs. slug registry)
6. `npm run lint:content` still passes; no changes to `/content`, `docs/schema.md`, or the lint script

## Commits

(1) shared shell component, (2) node page route + supporting components, (3) any pipeline bugfixes surfaced (separate commit, explained). Main message: `Node page: Frame 3 route with breadcrumb, prerequisites, right rail, and attribution footer (Phase 2, Step 2.4)`.

## Stop-and-report conditions

- Missing/unpushed 2.3 pipeline
- Any rendered node whose body HTML is empty or malformed
- Breadcrumb walk failing to reach the root (indicates tree data bug — fix in `lib/content.ts` as its own commit, or report if non-obvious)
- Anything requiring schema, taxonomy, or lint changes
