# Proof-of-Concept Wireframes — Modes 1 & 2

**Status:** v0.1 — Stage 0, Step 7 (final Stage 0 deliverable). These are low-fidelity wireframes: they fix *structure, information placement, and schema traceability*, not visual style. Colors, typography, and spacing are deliberately absent and will be decided during the PoC build.

Three frames live in `docs/wireframes/`:

| Frame | File | What it shows |
|---|---|---|
| 1 | `mode1-course.svg` | Mode 1 — linear course view |
| 2 | `mode2-hierarchy.svg` | Mode 2 — collapsible concept hierarchy |
| 3 | `node-page.svg` | The lesson (node) page both modes land on |

All example content in the frames is real: node titles, slugs, parents, and prerequisites come from `docs/concept-list.md`, and the node page uses `content/labeling-theory.md`. Descendant counts on collapsed tree nodes are illustrative only.

## Design rules carried over from the schema

The schema's first principle is *every field must power a feature*. The wireframes apply the inverse discipline: **every UI element must be traceable to a schema field, `content/course.yaml`, or an explicitly deferred feature.** Nothing on screen may require metadata the schema doesn't have — if a wireframe element needed a new field, the wireframe would be wrong, not the schema (the ten-field budget is spent).

A second rule: **Modes 1 and 2 are navigation shells around the same node page.** Neither mode renders lesson content itself; both terminate in Frame 3. This keeps the PoC to three screens and means adding Mode 3 later is a new shell, not a new content pipeline.

## Shared shell (all frames)

A single top bar appears on every screen: project name (links home), a four-tab mode switcher — **Course**, **Hierarchy**, and disabled **Network** and **Sociologists** tabs — and a search box. The deferred tabs are shown disabled rather than hidden on purpose: the four-mode vision is the project's identity, and the UI should advertise the roadmap honestly. Search operates over `title` and `summary` only in the PoC.

## Frame 1 — Mode 1: Course view (`mode1-course.svg`)

A two-pane layout. The **left sidebar** is the syllabus: modules and their ordered lessons, rendered by walking `content/course.yaml` top to bottom. Modules collapse; the current lesson is highlighted; completed lessons carry a checkmark. A progress line ("12 of 50 lessons") sits at the bottom of the sidebar.

The **main pane** is Frame 3 (the node page) with two Mode-1-only additions: a position line ("Module 1 · Lesson 4 of 7") above the title, and **Previous / Next** controls below the lesson, labeled with the adjacent lessons' titles.

Key annotations in the frame:

- Course order is read *exclusively* from `content/course.yaml` — per the schema, sequence is a property of the course, not the concept, and no frontmatter field stores it.
- Progress checkmarks are **client-side only** in the PoC (browser local storage). Accounts and the verification system are deferred, and the wireframe records that boundary so the PoC doesn't accidentally grow a backend.
- A build-time check (see the open lint-script Issue) guarantees the manifest never places a node before its `prerequisites`, so the UI never needs a "prerequisite not met" blocking state in Mode 1 — the ordering itself is the guarantee.

## Frame 2 — Mode 2: Hierarchy view (`mode2-hierarchy.svg`)

A full-canvas collapsible tree, root at the left, depth growing rightward. The tree is built from **exactly one source: the `parent` field** — the v0.2 amendment that the stress test forced. Expanded nodes show a "−" control; collapsed nodes show "+" and a descendant count so a collapsed branch communicates its weight. The `sociology` root and its ten first-level children are drawn from the concept list; `theoretical-paradigms` is shown expanded to its three paradigm children as the worked example.

Hovering a node raises a **preview card**: the node's `summary`, its `difficulty`, and its `tags`, with an "Open lesson" affordance. This is the `summary` field doing exactly the job the schema assigned it — the graph-view tooltip — and it means a learner can skim the whole territory without leaving the map. Clicking a node navigates to Frame 3.

Canvas controls are minimal: expand all / collapse all and zoom. Cross-cutting edges (`prerequisites`, `related`) are **deliberately not drawn** in Mode 2; the concept list's "one tree, one root" principle exists so this view stays a clean tree, and those edges belong to Mode 3.

## Frame 3 — Node page (`node-page.svg`)

The destination of every navigation action, shown populated with `labeling-theory` — chosen because it exercises the most schema features at once (a theory node with a paradigm tag, two prerequisites in different branches, thinkers, and OpenStax attribution).

Top to bottom: a **breadcrumb** walking the `parent` chain (`sociology / deviance / labeling-theory`), doubling as the "you are here" link back into Mode 2; the `title` with a `difficulty` badge and — when `status` is not `published` — a maturity banner; the `summary` as a standout lede; a **prerequisites callout** listing each prerequisite with its own completion state and link; then the schema's fixed body headings (**Definition, In depth, Perspectives, Examples**), with the Perspectives section annotated to show the theory-node variant ("how the other paradigms respond") established in the stress test.

A **right rail** carries the graph-adjacent metadata: `related` concepts as links, `thinkers` as plain text (explicitly annotated as Mode 4 seed data, not yet links), and `tags` as filter chips. The page footer renders `adapted_from` as a visible CC BY attribution line linking to `LICENSE-CONTENT.md` — attribution traveling with the material on screen, not only in the repo.

## Traceability table

| UI element | Source | Frame(s) |
|---|---|---|
| Syllabus sidebar, module grouping, Prev/Next, position line | `content/course.yaml` | 1 |
| Hierarchy tree edges, breadcrumb | `parent` | 2, 3 |
| Prerequisites callout; manifest ordering check | `prerequisites` | 1, 3 |
| Preview card blurb; search results; lede | `summary` | 1, 2, 3 |
| Node labels, page title, link labels | `title` | 1, 2, 3 |
| Difficulty badge; preview card | `difficulty` | 2, 3 |
| Tag chips; preview card | `tags` | 2, 3 |
| Related-concepts rail | `related` | 3 |
| Thinkers line (inert) | `thinkers` | 3 |
| Attribution footer | `adapted_from` | 3 |
| Draft/review banner | `status` | 3 |
| Progress checkmarks and count | Local storage (deferred: accounts) | 1 |
| Network / Sociologists tabs (disabled) | Roadmap (Modes 3–4 deferred) | all |

## Deferred by these wireframes

Accounts and cross-device progress, the verification system, Giscus lesson forums (a placeholder region is annotated at the bottom of Frame 3 but nothing is designed), Mode 3 and Mode 4 views, gamification, and mobile layouts. Each is deferred to keep the PoC at three screens; none is precluded by the layouts chosen.

## Open questions for the PoC build

1. **Tree rendering:** does Mode 2 need Cytoscape.js/D3 at all, or is a pure HTML/CSS collapsible tree enough for the PoC? The wireframe works either way; the decision belongs to the build phase, but a no-library tree would defer the graph dependency until Mode 3 actually needs it.
2. **Preview card on touch devices:** hover doesn't exist on mobile. Likely answer: first tap opens the card, second tap (or the card's button) opens the lesson — decide when a real device is in hand.
3. **Where Mode 1 progress state lives** if the PoC is statically hosted (GitHub Pages): local storage is assumed, but the exact shape should be decided alongside the lint script so slugs are validated consistently.
