# Concept-Node Schema

**Status:** Draft v0.1 — Stage 0. Expect revisions after the first 2–3 sample nodes are written.

Every unit of content in this platform is a **concept node**: a single Markdown file in `/content` with a YAML frontmatter block (structured metadata) followed by the lesson body (prose). The frontmatter is what the platform reads to build its navigation graphs; the body is what the learner reads.

## Design principles

1. **Every field must power a feature.** No metadata is collected "just in case." Each field below maps directly to one of the four navigation modes, the attribution requirement, or the contribution workflow.
2. **The filename is the ID.** Files are named in lowercase kebab-case (e.g. `sociological-imagination.md`), and other nodes reference each other by that filename (without `.md`). This keeps links stable and human-readable with no database.
3. **Ten fields or fewer.** Every field added is something that must be filled in ~50 times in Phase 1. Authoring cost is the dominant cost of this project.
4. **Readable with zero software.** A node must make sense when viewed raw on GitHub, before any site exists.

## Frontmatter fields

| Field | Type | Required | Purpose |
|---|---|---|---|
| `title` | string | yes | Display name of the concept. |
| `summary` | string (1–2 sentences) | yes | Shown as the node preview/tooltip in graph views, and as the search-result blurb. Forces every concept to be definable briefly. |
| `prerequisites` | list of node IDs | yes (may be empty) | **Powers Mode 2**, the hierarchy chart: the tree is generated from these edges. Also lets Mode 1 verify that course order never places a concept before its prerequisites. |
| `related` | list of node IDs | no | **Powers Mode 3**, the concept network: non-hierarchical "these ideas connect" edges. Distinct from prerequisites — relation is not dependence. |
| `tags` | list (from `docs/taxonomy.md`) | yes | Powers filtering and the tag-based network view; tag counts drive node centrality in force-directed layouts. Values must come from the controlled taxonomy (Stage 0 step 4) — free-form tags fragment the graph. |
| `difficulty` | `intro` \| `intermediate` \| `advanced` | yes | Lets learners self-filter and lets graph views visually distinguish depth. Three values only; finer scales invite endless debate. |
| `thinkers` | list of names | no | Seeds **Mode 4**, the sociologist network, later. Cheap to record now, expensive to backfill. |
| `adapted_from` | string (source + section) | when applicable | **License compliance.** CC BY 4.0 requires attribution to travel with the material, not just live in `LICENSE-CONTENT.md`. Format: `"OpenStax Introduction to Sociology 3e, Section 1.2"`. Omit only for fully original nodes. |
| `status` | `draft` \| `review` \| `published` | yes | Scaffolds the future peer-review workflow: pull requests move nodes from `draft` to `review` to `published`. Until then, it honestly signals maturity to readers. |

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
- **Perspectives** — where a concept is read differently by major paradigms (functionalism, conflict theory, symbolic interactionism), each reading gets a short subsection. This implements the project's **multi-perspective by design** principle at the schema level rather than leaving it to author discretion.
- **Examples** — 1–3 concrete illustrations; sociology concepts land through cases.
- **Further reading** — external links or primary texts.

## Example frontmatter

```yaml
---
title: Sociological Imagination
summary: C. Wright Mills's term for the ability to connect personal experiences to larger social and historical forces.
prerequisites: []
related: [social-structure, agency-vs-structure]
tags: [paradigm-neutral, subfield/foundations, level/macro]
difficulty: intro
thinkers: [C. Wright Mills]
adapted_from: "OpenStax Introduction to Sociology 3e, Section 1.1"
status: draft
---
```

## Open questions (revisit after sample nodes)

- Does `related` need edge labels (e.g. "contrasts with", "extends") for Mode 3, or are unlabeled edges enough for the PoC?
- Should `tags` be split into separate fields per taxonomy category once the taxonomy exists?
