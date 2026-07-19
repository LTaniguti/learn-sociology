# Task Brief: Phase 1.3 — Stub Node Generation

**Repo:** learn-sociology
**Goal:** Populate `/content` with placeholder ("stub") concept-node files for every seed concept, so Phase 2 (PoC build) has complete graph data. Full lesson articles will be written later as an ongoing content project.

## Source of truth (read these first — do not restate or reinvent their rules)

1. `docs/schema.md` — frontmatter field definitions
2. `docs/taxonomy.md` — controlled tag vocabulary and counting rules
3. `docs/concept-list.md` — the canonical list of slugs, modules, parents, and prerequisites
4. `templates/node-template.md` — node file format
5. Existing sample nodes in `/content` — reference examples of correct style

If anything in this brief conflicts with those documents, the documents win; flag the conflict rather than guessing.

## Step 1 — Extend the schema

Edit `docs/schema.md`: add `stub` as a valid `status` value, making the lifecycle `stub → draft → published`. Define it in one line: a stub has complete, valid frontmatter and a real `summary`, but no lesson body yet.

Commit: `docs: add stub status to node lifecycle`

## Step 2 — Generate stub files

For **every slug in `docs/concept-list.md`** that does not already have a file in `/content`, create `content/<slug>.md` with:

- **Complete frontmatter** per `docs/schema.md`. `parent`, `prerequisites`, and module placement come directly from `docs/concept-list.md`. Tags must obey the counting rules in `docs/taxonomy.md`.
- **`summary`:** 1–2 original sentences accurately and concisely explaining the concept. Write these in your own words — do not copy OpenStax text. Include `adapted_from` only if the summary meaningfully draws on OpenStax *Introduction to Sociology 3e* material.
- **`status: stub`**
- **Body:** exactly this placeholder block and nothing else:

```markdown
> **Placeholder.** This node has complete metadata but no lesson content yet.
> The full article is planned — see the module Issue for this node's status,
> and see `CONTRIBUTING.md` if you'd like to help write it.
```

Do **not** overwrite the existing sample nodes. Instead, verify their frontmatter still conforms to the current schema and taxonomy; fix only nonconformities, leave their content alone.

Commit stubs one module at a time, e.g.: `content: stub nodes for Module 3 — Culture`

## Step 3 — Update project status messaging

- `README.md`: in the status section, add 1–2 sentences noting that the full concept structure is now in place as stub nodes, article writing is in progress, and content contributions are welcome.
- Do not close the Phase 1 module Issues — they remain the article-writing backlog. If Issue bodies say nodes are unwritten, that is still accurate (stubs ≠ written).

Commit: `docs: note stub-based content status in README`

## Step 4 — Verify before finishing

Run these checks and report results:

1. Every slug in `docs/concept-list.md` has exactly one file in `/content`.
2. Every `parent` and every entry in `prerequisites` resolves to an existing slug.
3. Exactly one root node (`parent: null`); no cycles in the parent tree.
4. All tags are valid taxonomy values and obey the per-category counting rules.
5. All YAML frontmatter parses cleanly.
6. Every generated file has `status: stub`; sample nodes retain their existing status.

If any check fails, fix and re-verify before the final commit.

## Out of scope

- No lesson body writing beyond the placeholder block.
- No changes to `content/course.yaml` beyond confirming slugs match (flag mismatches, don't silently edit).
- No new tags, concepts, or schema fields beyond Step 1. Propose additions via Issue instead.
