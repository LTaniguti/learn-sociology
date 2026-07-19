# Task Brief — Phase 2.3: Content Pipeline

**Destination:** `docs/tasks/phase-2.3-content-pipeline.md`
**Executor:** Claude Code, working in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 2, Step 2.3 — build-time loading of `/content`, no client-side fetching, everything static.

## Context (read these first)

- `docs/schema.md` — node frontmatter contract (v0.2, ten-field budget, lifecycle `stub → draft → review → published`)
- `docs/taxonomy.md` — tag vocabulary and counting rules
- `content/course.yaml` — Mode 1 ordering manifest (single source of course order)
- `docs/concept-list.md` — slug registry (53 nodes)
- `scripts/lint-content.mjs` — existing validation logic; the pipeline must agree with it, not duplicate-and-drift from it
- `docs/wireframes.md` — the three screens this data will eventually feed

## Task 0 (optional, do first if quick) — close out Step 2.2

`npm run lint:content` exists but no GitHub Actions workflow does. Create `.github/workflows/content-lint.yml` running on `push` and `pull_request`: checkout, setup-node (LTS, npm cache), `npm ci`, `npm run lint:content`. Commit separately: `CI: run content lint on every push and PR (closes Step 2.2)`. If Issue #1 is still open, include `Closes #1` in the commit body only if it wasn't already closed by the lint-script commit — check first.

## Task 1 — dependencies

Add: `gray-matter`, `remark`, `remark-html` (or the `remark-rehype` + `rehype-stringify` pair if GFM/heading-slug plugins are wanted — your call, but keep the plugin set minimal and note the choice in the commit message). `js-yaml` is already present. Stop and report if installation requires `--force` or triggers unexpected peer-dependency changes.

## Task 2 — the pipeline module

Create `lib/content.ts` (create `lib/` at repo root). All functions are **server/build-time only** — they read the filesystem and must never be imported into client components.

### Types

```ts
export type NodeFrontmatter = {
  title: string;
  summary: string;
  parent: string | null;      // null only for the root node `sociology`
  prerequisites: string[];
  tags: string[];
  difficulty: "intro" | "intermediate" | "advanced";
  status: "stub" | "draft" | "review" | "published";
  related?: string[];
  thinkers?: string[];
  adapted_from?: string;      // match the actual shape in schema.md — verify before typing
};

export type ConceptNode = NodeFrontmatter & {
  slug: string;
  html: string;               // rendered body
};

export type CourseModule = { title: string; nodes: string[] };
export type Course = { course: string; modules: CourseModule[] };

export type TreeNode = { slug: string; title: string; children: TreeNode[] };
```

**Verify every type against `docs/schema.md` and one real content file before committing** — the shapes above are my best reading of the schema; the schema doc wins on any conflict, and if you find a conflict, report it rather than silently adapting.

### Functions

- `getAllSlugs(): string[]` — every `.md` file in `/content` (excluding `content/README.md`), sorted.
- `getNode(slug: string): Promise<ConceptNode>` — gray-matter parse + remark render. Throw with a clear message on missing file or missing required fields (the lint script is the real gate; this throw is a build-time backstop).
- `getAllNodes(): Promise<ConceptNode[]>` — all nodes; cache the result in a module-level variable so repeated calls during a static build don't re-read 53 files.
- `getCourse(): Course` — parse `content/course.yaml` with js-yaml.
- `getTree(): TreeNode` — build the Mode 2 hierarchy from each node's `parent` field. Exactly one root (`parent: null`); throw if zero or multiple roots, or on a cycle. Children sorted by their position in `course.yaml` where present, alphabetically otherwise.

### Constraints

- No client-side fetching, no runtime filesystem access in the browser bundle. If any helper is needed client-side later, data gets passed as props from server components — note this in a comment at the top of the file.
- Do not modify `scripts/lint-content.mjs`. If the pipeline surfaces a contract the lint script doesn't check, open an Issue instead.

## Task 3 — smoke test

Add a minimal proof the pipeline works end-to-end, without building any real UI (that's Steps 2.4+):

- A temporary route or a plain script `scripts/pipeline-smoke.mjs` (script preferred — no throwaway UI) that calls `getAllNodes()`, `getCourse()`, `getTree()` and prints: node count (expect 53), course module count, tree depth, and the first rendered node's HTML length.
- Run it, then run `npm run build` and confirm the static export still succeeds.

## Verification checklist (report results)

1. `getAllNodes()` returns 53 nodes, all typed fields present
2. Every slug in `course.yaml` resolves via `getNode`
3. `getTree()` yields exactly one root, no cycles, depth ≤ 4
4. `npm run build` succeeds with static export
5. `npm run lint:content` still passes (nothing regressed)
6. No `fs`/`path` imports reachable from client code

## Commits

Separate, in order: (0) CI workflow, (1) dependencies, (2) `lib/content.ts`, (3) smoke script + any fixes. Suggested message for the main commit: `Content pipeline: build-time loaders for nodes, course manifest, and tree (Phase 2, Step 2.3)`.

## Stop-and-report conditions

- Any frontmatter shape in real content files that contradicts the types above
- Dependency installation requiring `--force`
- Any node failing to parse or render
- Anything that tempts you to edit schema.md, taxonomy.md, or the lint script
