# Task Brief — Phase 2.7: Giscus Lesson Forums

**Destination:** `docs/tasks/phase-2.7-giscus.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 2, Step 2.7 — Giscus embedded in the node page's placeholder region (Frame 3), backed by the repo's existing GitHub Discussions. Mapping: **one discussion per lesson, keyed by slug**.

## Human prerequisites (Lucas, in the browser — before Claude Code runs)

1. Install the **giscus GitHub App** on `LTaniguti/learn-sociology` (https://github.com/apps/giscus)
2. In repo Discussions, create a category named **Lessons** with the **Announcements** format — announcement-type categories mean only giscus and maintainers can open discussions, so the one-per-lesson mapping can't be polluted by manually created threads
3. On https://giscus.app, select the repo and the Lessons category, and copy the generated `data-repo-id` and `data-category-id` values into this brief (or paste them to Claude Code).
4. Aforementioned ID's : data-repo-id="R_kgDOTU5rmQ"
                         data-category-id="DIC_kwDOTU5rmc4DBgJA"

**Claude Code: if the repo ID / category ID are not provided, stop and report.** Do not invent values or scrape them.

## Precondition — verify 2.6 landed and pushed

Confirm `/hierarchy` builds and the 2.6 commits are on `origin/main`. If not, stop and report.

## Context (read first)

- `docs/wireframes.md` — Frame 3's Giscus placeholder annotation
- `src/components/NodeArticle.tsx` — the commented placeholder region from 2.4 is the mount point
- https://giscus.app documentation for attribute reference

## Architecture decisions (pre-made — follow, don't relitigate)

1. **Mapping must be `specific` with `data-term` = the node's slug.** Not `pathname`, not `title`. The shared renderer means the same lesson exists at `/node/[slug]` and `/course/[slug]`; pathname mapping would split every lesson's discussion in two, and titles can be edited. Slugs are the stable identity the whole system is built on (and the lint script validates). This is the single most important line in this brief.
2. **Implementation:** a small client component (`src/components/LessonComments.tsx`) that receives `slug` as a prop and injects the giscus `<script>` into a ref'd container on mount. Prefer this over adding `@giscus/react` — it's ~20 lines and keeps the dependency count where it is. If script injection fights React strict-mode double-mounting, guard with a "already injected" check rather than switching to the package.
3. **Attributes:** `data-repo="LTaniguti/learn-sociology"`, the provided repo/category IDs, `data-mapping="specific"`, `data-term={slug}`, `data-strict="1"` (exact term matching), `data-reactions-enabled="1"`, `data-input-position="bottom"`, `data-loading="lazy"`, `data-theme="preferred_color_scheme"` (revisit in 2.9), `data-lang="en"`.
4. **Placement:** replace the 2.4 placeholder region inside `NodeArticle`, under a heading like "Discussion". It renders in both modes — that's intended; both surfaces share one discussion per slug.
5. Comments require sign-in with GitHub via giscus's own flow — no auth code, no tokens, nothing touches this repo's code beyond the embed.

## Constraints

- No new npm dependencies (per decision 2)
- No changes to `/content`, schema, taxonomy, `course.yaml`, or the lint script
- `progress.ts` remains the only `localStorage` owner; giscus manages its own iframe state

## Verification (report results)

1. `npm run build` succeeds; `npm run lint:content` passes
2. In a local preview, `/node/labeling-theory` and `/course/labeling-theory` both render the giscus iframe in the Discussion section
3. Post one test comment on a single lesson (human step if auth is needed): confirm exactly one discussion is created in the **Lessons** category, titled with the slug, and that the comment appears on *both* routes for that lesson
4. A lesson with no comments shows the empty giscus state, not an error
5. Exported HTML for a node page contains no giscus iframe at build time (it's client-injected) — confirms the static export stays clean

## Commits

(1) `LessonComments` component + `NodeArticle` mount. Message: `Lesson forums: Giscus embed keyed by slug in the shared node article (Phase 2, Step 2.7)`.

## Stop-and-report conditions

- Repo/category IDs not provided
- The Lessons category missing or not Announcements-format
- Anything pushing toward pathname/title mapping or a new dependency
