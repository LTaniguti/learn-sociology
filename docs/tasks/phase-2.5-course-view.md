# Task Brief — Phase 2.5: Mode 1 Course View (Wireframe Frame 1)

**Destination:** `docs/tasks/phase-2.5-course-view.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 2, Step 2.5 — the linear course view. Mode 1 is a navigation shell around the node page (Frame 3), never a second content renderer. This step also **resolves wireframe open question 3**: where Mode 1 progress lives on a statically hosted site.

## Precondition — verify 2.4 landed

Confirm `src/app/node/[slug]/page.tsx` and `src/components/Shell.tsx` exist on `main` and `npm run build` currently succeeds with 53 exported node pages. **If 2.4 is absent or unpushed, stop and report — do not build it inline here.**

## Context (read first)

- `docs/wireframes.md` — Frame 1 section and the traceability table are the spec; structure is locked to them
- `docs/wireframes/mode1-course.svg` — the visual layout
- `content/course.yaml` — the *only* source of course order (11 modules, 53 lessons); no frontmatter field stores sequence
- `src/app/node/[slug]/page.tsx` — the existing Frame 3 rendering that Mode 1 wraps
- `lib/content.ts` — `getCourse()` and friends; the sidebar must not read the filesystem or parse YAML itself
- `scripts/lint-content.mjs` — the slug registry progress keys must stay consistent with

## Architecture decisions (pre-made — follow, don't relitigate)

1. **Route:** `src/app/course/[slug]/page.tsx`, statically generated for every slug in `course.yaml` (flattened module order) via `generateStaticParams()`. `src/app/course/page.tsx` renders the same layout with the **first lesson** of the manifest (`sociology`) — static export has no redirects, so the index *is* the first lesson.
2. **No duplicated node rendering.** Extract the Frame 3 article (breadcrumb → title block → lede → prerequisites → body → right rail → Giscus placeholder → attribution footer) from `node/[slug]/page.tsx` into a shared server component (e.g., `src/components/NodeArticle.tsx`) that both routes render. `/node/[slug]` keeps working unchanged from the reader's perspective. Do this refactor as its **own commit before** any Mode 1 work.
3. **Progress storage (resolves open question 3):** one client module, `src/lib/progress.ts`, is the sole owner of the storage shape:
   - Key: `learn-sociology:progress:v1`
   - Value: a single JSON object keyed by slug — `{ "social-norms": true, … }`
   - Exports something like `getProgress()`, `isComplete(slug)`, `setComplete(slug, boolean)`, `countComplete(slugs)`. No other file touches `localStorage`.
   - Keys are the same slugs the lint script validates; unknown keys found in storage are ignored, never thrown on.
4. **Client/server boundary:** the page, sidebar structure, and Prev/Next targets are all server-rendered from `getCourse()`. Only the progress-dependent pieces are client components (checkmarks, progress line, the "mark complete" control). Read `localStorage` inside `useEffect` and render the zero-progress state until mounted, so static HTML and first client render match — **no hydration mismatch warnings**.
5. **Prev/Next order** is the manifest flattened across module boundaries (last lesson of Module 1 → first lesson of Module 2). First lesson has no Previous; last has no Next — omit the control, don't disable it.

## Page structure (per Frame 1)

Two-pane layout inside the shared `Shell`:

1. **Left sidebar — syllabus.** Modules in `course.yaml` order, each a collapsible group (`<details>`/`<summary>` is fine — no JS needed for collapse); lessons as links to `/course/[slug]` labeled with their `title`. Current lesson highlighted (`aria-current="page"`). Completed lessons carry a checkmark (client component). Sidebar footer: progress line — "N of 53 lessons" (client component; shows "0 of 53" pre-hydration).
2. **Main pane — Frame 3 via `NodeArticle`,** with two Mode-1-only additions:
   - A **position line** above the title: "Module 3 · Lesson 2 of 6" (module-local index), server-computed from the manifest.
   - **Previous / Next controls** below the article, labeled with the adjacent lessons' titles.
3. **Mark-complete control** — a single toggle button near the Prev/Next controls ("Mark complete" / "Completed ✓"), writing through `progress.ts`. The prerequisites callout inside `NodeArticle` may now show per-prerequisite completion checkmarks (the 2.4 markup was shaped for this); if wiring that requires markup changes inside `NodeArticle`, keep them minimal and note them.

## Shell updates

- **Course tab** now links to `/course` and shows an active state when on a `/course` route. **Hierarchy** stays a dead link until 2.6; Network/Sociologists stay disabled.
- Replace the create-next-app boilerplate in `src/app/page.tsx` with a minimal real landing: project name, one-paragraph description (reuse the README's framing), and links to **Start the course** (`/course`) and the GitHub repo. Structure only — styling is Step 2.9. Delete the unused boilerplate assets (`next.svg`, `vercel.svg`, `page.module.css`) if nothing else references them.

## Constraints

- Every element must trace to `content/course.yaml`, a schema field, or an explicitly deferred feature. **No "prerequisite not met" blocking state** — the lint script's ordering check is the guarantee, per the wireframes.
- No accounts, no backend, no cookies, no analytics. Progress is device-local by design; the verification system is a later phase.
- Structure only: minimal layout CSS with semantic class names, consistent with the 2.4 approach, so 2.9 is a stylesheet job.
- `lib/content.ts` stays server-only. If the sidebar needs typed course data client-side, pass it down as props from the server component.

## Verification (report results)

1. `npm run build` succeeds; export contains 53 `/course/[slug]` pages plus `/course` and the new landing page; the 53 `/node/[slug]` pages still build identically
2. `/course/social-norms`: sidebar highlights it inside "Culture", position line reads "Module 3 · Lesson 3 of 6", Previous = "Values and Beliefs", Next = "Symbols and Language"
3. First lesson (`sociology`) has no Previous; last (`social-movements`) has no Next
4. Marking a lesson complete updates its sidebar checkmark and the progress count without reload; state survives a page refresh; `localStorage` contains exactly one key (`learn-sociology:progress:v1`)
5. No hydration warnings in the browser console on `/course/[slug]`
6. `/node/labeling-theory` renders byte-for-byte the same article content as before the `NodeArticle` refactor (diff the exported HTML)
7. `npm run lint:content` still passes; no changes to `/content`, `docs/schema.md`, or the lint script

## Commits

(1) `NodeArticle` extraction refactor, (2) progress module, (3) course route + sidebar + Prev/Next, (4) shell + landing page updates. Main message: `Mode 1: course view with syllabus sidebar, Prev/Next, and localStorage progress (Phase 2, Step 2.5)`.

## Stop-and-report conditions

- Missing/unpushed 2.4 work
- Any lesson in `course.yaml` without a matching content file, or vice versa (this indicates lint drift — report, don't patch)
- The `NodeArticle` refactor changing rendered output for `/node/[slug]`
- Anything requiring schema, taxonomy, `course.yaml`, or lint-script changes
