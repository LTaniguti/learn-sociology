# Concept-Node Schema

**Status:** Draft v0.2 — Stage 0. Stress-tested against three fully written sample nodes (`sociological-imagination`, `social-norms`, `labeling-theory`); see `docs/schema-review.md` for the findings that produced this revision.

Every unit of content in this platform is a **concept node**: a single Markdown file in `/content` with a YAML frontmatter block (structured metadata) followed by the lesson body (prose). The frontmatter is what the platform reads to build its navigation graphs; the body is what the learner reads.

## Design principles

1. **Every field must power a feature.** No metadata is collected "just in case." Each field below maps directly to one of the four navigation modes, the attribution requirement, or the contribution workflow.
2. **The filename is the ID.** Files are named in lowercase kebab-case (e.g. `sociological-imagination.md`), and other nodes reference each other by that filename (without `.md`). This keeps links stable and human-readable with no database.
3. **Ten fields is the ceiling — and the budget is now spent.** With the addition of `parent` (v0.2), the schema sits at exactly ten fields. Any future field must demonstrate need across multiple nodes *and* replace an existing field, not extend the list. Authoring cost is the dominant cost of this project.
4. **Readable with zero software.** A node must make sense when viewed raw on GitHub, before any site exists.

## Frontmatter fields

| Field | Type | Required | Purpose |
|---|---|---|---|
| `title` | string | yes | Display name of the concept. |
| `summary` | string (1–2 sentences) | yes | Shown as the node preview/tooltip in graph views, and as the search-result blurb. Forces every concept to be definable briefly. |
| `parent` | node ID | yes (`null` for the root only) | **Powers Mode 2**, the hierarchy chart. Exactly one parent per node keeps the hierarchy a true tree. Matches the Parent column in `docs/concept-list.md`. The parent is usually also a prerequisite, but the fields serve different modes and stay separate. |
| `prerequisites` | list of node IDs | yes (may be empty) | Dependency arrows for learners and build checks: lets Mode 1 verify that course order never places a concept before its prerequisites, and supplies cross-cutting edges that the Mode 2 tree (built from `parent`) deliberately excludes. |
| `related` | list of node IDs | no | **Powers Mode 3**, the concept network: non-hierarchical "these ideas connect" edges. Distinct from prerequisites — relation is not dependence. |
| `tags` | list (from `docs/taxonomy.md`) | yes | Powers filtering and the tag-based network view; tag counts drive node centrality in force-directed layouts. Values must come from the controlled taxonomy (Stage 0 step 4) — free-form tags fragment the graph. Every node carries exactly one `discipline/` tag (currently always `discipline/sociology`), scoping the node for future multi-discipline expansion. |
| `difficulty` | `intro` \| `intermediate` \| `advanced` | yes | Lets learners self-filter and lets graph views visually distinguish depth. Three values only; finer scales invite endless debate. |
| `thinkers` | list of names | no | Seeds **Mode 4**, the sociologist network, later. Cheap to record now, expensive to backfill. |
| `adapted_from` | string (source + section) | when applicable | **License compliance.** CC BY 4.0 requires attribution to travel with the material, not just live in `LICENSE-CONTENT.md`. Format: `"OpenStax Introduction to Sociology 3e, Section 1.2"`. If a node draws on two sections, comma-separate them within the string. Omit only for fully original nodes. |
| `status` | `stub` \| `draft` \| `review` \| `published` | yes | Scaffolds the future peer-review workflow: pull requests move nodes from `stub` to `draft` to `review` to `published`. A `stub` has complete, valid frontmatter and a real `summary`, but no lesson body yet. Until then, it honestly signals maturity to readers. |

## Where Mode 1's course order lives

Linear course sequence is deliberately **not** stored in node frontmatter. Ordering is a property of the *course*, not the *concept* — a concept could appear in multiple courses someday, and reordering the syllabus should be a one-file edit, not a fifty-file edit.

Instead, a single manifest at `content/course.yaml` defines the modules and the ordered list of node IDs within each:

```yaml
course: introduction-to-sociology
modules:
  - title: "An Introduction to Sociology"
    nodes:
      - what-is-sociology
      - sociological-imagination
      - history-of-sociology
  - title: "Sociological Research"
    nodes:
      - scientific-method
      - research-ethics
```

The platform renders Mode 1 by walking this file in order. A build check can verify that no node appears before its `prerequisites` — the manifest and the frontmatter keep each other honest.

> **Completion invariant.** Per-learner state is stored per **node**, never per course, module, or discipline. Every rollup — course %, module counts, a future discipline's progress — is *derived* at read time from a manifest (or tag query) intersected with node progress. A future phase adding courses or disciplines adds manifests and derivations; it must not add stored rollup state. Phases that violate this reopen a storage-migration problem this note exists to prevent.

In code, the single derivation is `completionFor(slugs)` in `src/lib/progress.ts`; every rollup (the course footer, each module's "n of m", and later a discipline's progress — `completionFor(nodes tagged discipline/x)`) routes through it. The storage shape (`learn-sociology:progress:v1`, flat slug → bool) and key are frozen; expansion is more manifests and more calls, never a new stored field.

## Network placement (Mode 3)

A node's position in Mode 3's network is **derived, not stored**. As of the 3.4 radial layout, the map is concentric: an editorially pinned core (`society`) sits at the centre, and every other node lands on a ring by its **distance from the core** — the number of hops along the undirected union of its `prerequisites` and `related` edges (a breadth-first depth). The innermost ring is one hop out, and each ring outward is one more degree of separation.

The consequence for authors: **frontmatter *is* placement.** You never set a coordinate, a ring, or a region — you write a node's `prerequisites` and `related`, and its ring follows. A node wired to central concepts sits near the middle; one reachable only through a long dependency chain sits near the rim. A node with no path to the core at all falls to the outermost ring and is flagged as a content finding (currently none). This is what lets the coming content phase — and eventual periphery nodes bridging into adjacent disciplines — self-locate without any layout work. No schema fields are involved; this note only documents the rule.

## Discipline scoping and future expansion

Every node is scoped to one primary discipline via a `discipline/` tag
(currently the only value is `discipline/sociology`). This keeps the door
open to adjacent social sciences — anthropology, political science,
economics, psychology — without schema changes: expansion means adding
values to the taxonomy, not fields to the frontmatter, preserving design
principle 3's field budget.

Two rules follow:

- **One primary discipline per node.** A concept relevant to several
  disciplines (e.g., social capital) still gets exactly one home, keeping
  Mode 2's hierarchy a true tree.
- **Cross-discipline edges are derived, not stored.** When two nodes
  connected via `related` carry different `discipline/` tags, the platform
  can render that edge in a distinct style. No dedicated field is
  required — graph views compute it from data that already exists.

## Body structure

After the frontmatter, the lesson body uses a consistent set of headings:

```
## Definition
## In depth
## Perspectives        (optional)
## Examples
## Further reading     (optional)
```

- **Definition** — a tight, standalone explanation (2–4 sentences). A learner arriving from a graph click should get the core idea without scrolling.
- **In depth** — the main lesson prose. Adapted OpenStax material lives here, restructured to fit the node.
- **Perspectives** — where a concept is read differently by major paradigms (functionalism, conflict theory, symbolic interactionism), each reading gets a short subsection. This implements the project's **multi-perspective by design** principle at the schema level rather than leaving it to author discretion. For `type/theory` nodes that themselves belong to a paradigm, this section instead records how the *other* paradigms respond to, critique, or extend the theory — see `content/labeling-theory.md` for the pattern.
- **Examples** — 1–3 concrete illustrations; sociology concepts land through cases.
- **Further reading** — external links or primary texts.

## Self-check quizzes (companion files)

A node may carry an optional **self-check quiz** — a small set of questions
rendered below the lesson body, graded client-side. Quizzes live in a **separate
file**, `content/quizzes/<slug>.yml`, *not* in node frontmatter: the ten-field
budget (design principle 3) is spent, so this is precisely how a whole feature
was added with the node schema left **completely untouched**. Their format,
field rules, and the quiz-level multi-perspective (contested-claim) rule are
specified in [`docs/quiz-schema.md`](quiz-schema.md). Per-attempt learner state
is stored per node under its own key, honouring the *Completion invariant* below.

## Example frontmatter

```yaml
---
title: The Sociological Imagination
summary: C. Wright Mills's term for the ability to see the connection between personal experiences and the larger social and historical forces that shape them.
parent: sociology
prerequisites: [sociology]
related: [levels-of-analysis, society, social-change]
tags: [discipline/sociology, level/macro, type/concept, subfield/foundations]
difficulty: intro
thinkers: [C. Wright Mills]
adapted_from: "OpenStax Introduction to Sociology 3e, Section 1.1"
status: draft
---
```

This example is a copy of the live frontmatter in `content/sociological-imagination.md`; if the schema changes, update both.

## Reserved fields

The following frontmatter key is **reserved for a future phase and is not valid yet.** It is recorded here so the direction is legible, not so it can be used:

- **`discipline:`** (working name; may ship as `branch:`) — a marker for **periphery gateway nodes** that bridge sociology into an adjacent social science (economics, anthropology, political science, psychology). In the radial layout (Mode 3, see *Network placement*) such nodes sit naturally on the outer rings, and this field would let the platform render and route them as gateways into a neighbouring discipline's territory — the seam along which the map can grow beyond sociology.

Reserved means exactly three things: (1) it is **not part of the schema** — the ten-field budget (design principle 3) is untouched; (2) **no node may use it** until a future phase specifies its semantics (valid values, how many disciplines, tree/edge consequences); (3) the phase that activates it **owns adding linter enforcement**. As of 3.5 reserved is mechanically enforced: `scripts/lint-content.mjs` allowlists every frontmatter key against the *Frontmatter fields* table above and rejects anything else — a reserved key (`discipline:` / `branch:`) fails with a distinct "reserved for a future phase" error, any other unknown key (e.g. a `prerequisite:` typo for `prerequisites:`) fails as an unknown field. So an author who adds `discipline:` today is flagged, not silently ignored. Until a phase activates it this remains a direction, not a feature.

## Resolved questions

Two questions were left open in v0.1 and settled by the Stage 0 stress test (`docs/schema-review.md`):

- **Edge labels on `related`?** Not for the PoC. Unlabeled edges proved self-explanatory once body prose existed, and labels would multiply authoring decisions per link. Revisit only if Mode 3 user testing shows confusion.
- **Split `tags` into per-category fields?** No. The `category/value` prefix already makes the single list self-describing and machine-parseable; a future lint script enforces the counts for free, without spending field budget on structure.
