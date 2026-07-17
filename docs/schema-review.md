# Schema Stress-Test Review (Stage 0, Step 6)

**Status:** Complete. Three sample nodes written end-to-end against schema v0.1: `sociological-imagination` (root-adjacent hub), `social-norms` (mid-tree concept with prerequisites), and `labeling-theory` (paradigm-tagged theory node with cross-branch prerequisites). Together they exercised every frontmatter field, all four tag categories, both optional body sections, and the intro/intermediate difficulty values.

**Verdict:** The schema survives with **one breaking fix** (a missing `parent` field), **two documentation fixes**, and **one template clarification**. No field proved unnecessary, no field was missing beyond `parent`, and the body structure held up for all three node types. Both open questions in `docs/schema.md` can now be answered.

---

## Findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | **Breaking** | Schema has no `parent` field, but Mode 2 requires one | Add `parent` to the schema (see Amendment A) |
| 2 | Docs bug | Schema's example frontmatter is invalid against the taxonomy and concept list | Replace the example (see Amendment B) |
| 3 | Docs drift | `thinkers` (schema) vs. `theorists` (concept-list deferred section) | Standardize on `thinkers` (see Amendment C) |
| 4 | Template gap | `Perspectives` semantics are undefined for `type/theory` nodes | Clarify in template comment (see Amendment D) |
| 5 | Deferred | No automated validation of slugs, tags, or required fields | Open a GitHub Issue for a Phase 1 lint script |

### Finding 1 — the schema contradicts the concept list on how Mode 2 is built (breaking)

`docs/schema.md` says the `prerequisites` field "powers Mode 2: the tree is generated from these edges." But `docs/concept-list.md` (written later) establishes the correct design: a singular **Parent** column drives the Mode 2 tree, while prerequisites are cross-cutting dependency arrows that may point anywhere in the graph.

The sample nodes prove these cannot be the same data. `labeling-theory` has prerequisites `[deviance, symbolic-interactionism]` — two edges into two different branches. If the tree were generated from prerequisites, this node would have two parents and Mode 2 would not be a tree. The concept list already resolved this ("One tree, one root... cross-cutting relationships belong in prerequisites"); the schema was never updated to match.

**Fix:** add a required `parent` field to the frontmatter (Amendment A). This brings the field count to exactly ten — the schema's stated ceiling — which is worth noting as a design constraint now fully spent.

### Finding 2 — the schema's example frontmatter fails its own rules (docs bug)

The example in `docs/schema.md` predates the taxonomy and concept list, and now violates both:

- `paradigm-neutral` is not a taxonomy value and doesn't follow the `category/value` format (paradigm-neutrality is correctly expressed by *omitting* the `paradigm/` tag).
- It carries no `type/` tag, which the taxonomy requires on every node.
- `related: [social-structure, agency-vs-structure]` references slugs that don't exist in the concept list — dead links the moment Mode 3 renders.
- It lacks `parent` (Finding 1).

**Fix:** replace the example with the real, validated frontmatter from `content/sociological-imagination.md` (Amendment B). The example should always be a copy of a real node so it can never drift again.

### Finding 3 — field-name drift: `thinkers` vs. `theorists` (docs drift)

The schema defines the field as `thinkers`; the "Deliberately deferred" section of `docs/concept-list.md` refers to "the `theorists` frontmatter field." One word, but slugs and field names are contracts — Mode 4 will eventually parse this field programmatically. The sample nodes use `thinkers`, matching the schema.

**Fix:** one-word edit in `docs/concept-list.md` (Amendment C).

### Finding 4 — `Perspectives` means something different on theory nodes (template gap)

For concept nodes (`sociological-imagination`, `social-norms`), the Perspectives section works exactly as designed: three paradigms, three readings. But `labeling-theory` *is* one of the paradigms' theories — an "interactionist view of labeling theory" subsection would be circular. The natural adaptation, used in the sample node, is to record how the *other* paradigms respond to or extend the theory.

This isn't a schema change — the section flexed fine — but future authors of the ~10 `type/theory` nodes in the seed list will hit the same question, so the template should answer it once (Amendment D).

### Finding 5 — nothing enforces the rules (deferred, recommend an Issue)

Writing three nodes by hand surfaced how easy it is to violate the contracts silently: a typo'd slug in `related`, a tag missing its category prefix, a forgotten required field. None of this fails loudly until the PoC tries to render. The schema's "manifest and frontmatter keep each other honest" build check should be generalized: a small script that validates every node's tags against `taxonomy.md`, every slug reference against actual filenames, and required-field presence.

**Fix:** not now — it needs the PoC's tooling context. Open a GitHub Issue titled "Content lint script: validate frontmatter against schema, taxonomy, and slug registry" and label it for the PoC build phase. This is exactly the paper trail worth having on the record.

---

## Answers to the schema's open questions

Both open questions in `docs/schema.md` can now be closed with evidence:

**"Does `related` need edge labels for Mode 3, or are unlabeled edges enough for the PoC?"** Unlabeled is enough. Across three nodes, every `related` entry was self-explanatory once the body prose existed (`social-norms` → `deviance`: norms define what deviance is; `labeling-theory` → `strain-theory`: rival explanations). Edge labels would triple the authoring decisions per link for no PoC payoff. Revisit only if Mode 3 user testing shows confusion.

**"Should `tags` be split into separate fields per taxonomy category?"** No. The `category/value` prefix already makes the single list self-describing and machine-parseable, and splitting would spend field-count budget (already at the ceiling after adding `parent`) on structure a lint script can enforce for free. Keep the list.

One taxonomy rule also earned its keep: the `level/` guidance to "tag the level at which it is *taught*" resolved a genuine ambiguity on `social-norms` (norms are enforced micro but taught in this node as a culture-wide, macro phenomenon → `level/macro`). No change needed — the rule works.

And one non-finding worth recording: `adapted_from` as a single string was sufficient for all three nodes; each mapped cleanly to one OpenStax section. If a future node draws on two sections, comma-separate them inside the string rather than converting to a list — revisit only if multi-source nodes become common.

---

## Amendments to apply

### Amendment A — add `parent` to `docs/schema.md`

In the frontmatter field table, insert this row directly below `summary`:

```
| `parent` | node ID | yes (`null` for the root only) | **Powers Mode 2**, the hierarchy chart. Exactly one parent per node keeps the hierarchy a true tree. Matches the Parent column in `docs/concept-list.md`. The parent is usually also a prerequisite, but the fields serve different modes and stay separate. |
```

Then correct the `prerequisites` row's purpose text — replace:

> **Powers Mode 2**, the hierarchy chart: the tree is generated from these edges. Also lets Mode 1 verify that course order never places a concept before its prerequisites.

with:

> Dependency arrows for learners and build checks: lets Mode 1 verify that course order never places a concept before its prerequisites, and supplies cross-cutting edges that the Mode 2 tree (built from `parent`) deliberately excludes.

Finally, update design principle 3 to acknowledge the budget is spent: "Ten fields or fewer" → note that with `parent` the schema now sits at exactly ten, so any future field must replace an existing one.

### Amendment B — replace the example frontmatter in `docs/schema.md`

Replace the current example block with:

```yaml
---
title: The Sociological Imagination
summary: C. Wright Mills's term for the ability to see the connection between personal experiences and the larger social and historical forces that shape them.
parent: sociology
prerequisites: [sociology]
related: [levels-of-analysis, society, social-change]
tags: [level/macro, type/concept, subfield/foundations]
difficulty: intro
thinkers: [C. Wright Mills]
adapted_from: "OpenStax Introduction to Sociology 3e, Section 1.1"
status: draft
---
```

Add one line beneath it: *"This example is a copy of the live frontmatter in `content/sociological-imagination.md`; if the schema changes, update both."*

### Amendment C — fix `theorists` → `thinkers` in `docs/concept-list.md`

In the "Deliberately deferred" section, change "the `theorists` frontmatter field" to "the `thinkers` frontmatter field."

### Amendment D — clarify Perspectives in `templates/node-template.md`

Extend the Perspectives comment block with:

```
<!-- For type/theory nodes that belong to a paradigm, this section instead records
     how the OTHER paradigms respond to, critique, or extend the theory.
     See content/labeling-theory.md for the pattern. -->
```

Also add `parent:` to the template's frontmatter block, directly below `summary:`.

---

## Stage 0 status after this step

- [x] Concept-node schema defined (`docs/schema.md`) — amended per this review
- [x] Tag taxonomy defined (`docs/taxonomy.md`) — validated, no changes needed
- [x] Seed concept list (`docs/concept-list.md`) — one-word fix per Amendment C
- [x] Sample nodes written and schema stress-tested (this document)
- [ ] Wireframes for navigation modes 1 and 2 (Step 7 — final Stage 0 item)
