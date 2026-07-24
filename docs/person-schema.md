# Person Schema

**Status:** v1 — Phase 6.0, rendering as of 6.1. The registry ships as 16 stub
entries seeded from the names already in the corpus, and each one renders as a
profile page at `/people/<slug>`, reachable by direct URL. The profile's concept
list is derived by inverting nodes' `people:` (rule 1 below); no field here
changed to make the page possible. Entry points from the lesson page and a
People surface in the top bar are later phases.

**Docs-sync:** any phase that changes this file, `docs/schema.md`,
`docs/taxonomy.md`, or `docs/quiz-schema.md` must check
[`docs/writing-a-lesson.md`](writing-a-lesson.md) for staleness **in the same
commit** — the contributor tutorial paraphrases these four contracts for
teachability and rots if they drift.

A **person** is the platform's second content entity, alongside the concept node.
Person entries live in their own files:

```
content/people/<slug>.md
```

`content/people/` is a **non-node directory** (`docs/schema.md` → content
structure): the node walkers skip it, and this document's loader claims it. This
is the same move quizzes made — a whole entity type added with the node schema
left completely untouched. The ten-field node budget (schema design principle 3)
is spent, so `people:` on a node is a *list of display names*, and everything the
platform knows about a person lives here.

Like a node, a person file must **make sense viewed raw on GitHub** (schema
principle 4): plain YAML frontmatter, prose-like values, no encoding tricks.

## Identity and the shared slug namespace

The slug is the filename basename, lowercase kebab-case, **diacritics folded**
(`Émile Durkheim` → `emile-durkheim.md`). Diacritics stay intact in `name`; only
the filename folds them, so the slug is typeable and URL-safe without escaping.

Slugs are **globally unique across all of `content/`** — nodes and people share
one namespace. A cross-reference is therefore never ambiguous, and a future
unified search never has to disambiguate by entity type. `scripts/lint-people.mjs`
enforces this against every node slug as well as every other person's.

## Frontmatter fields

| Field | Type | Required | Purpose |
|---|---|---|---|
| `name` | string | yes | Display name, diacritics intact (`Émile Durkheim`). The canonical form; everything else is an alias. |
| `aliases` | list of strings | yes | Every *other* string a node's `people:` may use, plus obvious variants (`Durkheim`, `E. Durkheim`). **Never repeats `name`** — resolution checks `name` first, then `aliases`, so a repeat adds nothing and invites drift. May be an empty list when no node uses a variant. |
| `summary` | string (1–2 sentences) | yes | Card blurb, preview, and search-result text. Forces every entry to be sayable briefly, exactly as a node's `summary` does. |
| `lived` | string | yes | `1858–1917` (en dash) for the dead, `b. 1959` for the living. A string, not two date fields: dates in the history of ideas are frequently approximate, and a string holds `c. 1820–1895` without inventing precision. Drives era banding later. |
| `active` | string | no | Period of principal work, **only when it diverges sharply from the lifespan** — e.g. someone who published for a decade of an eighty-year life. Omit otherwise; a redundant `active` is noise. |
| `disciplines` | list (from `docs/taxonomy.md`) | yes | One **or more** `discipline/` values. See *One node, one discipline; one person, many* below. |
| `traditions` | list (from `docs/taxonomy.md`) | no | Zero or more `paradigm/` values. Empty is common and correct — tag only where the person is genuinely of that tradition, mirroring the taxonomy's rule for `paradigm/` tags on nodes. |
| `works` | list of strings | no | 1–5 principal works as `Title (Year)`. A hint at the shape of a body of work, not a bibliography. Not a separate entity — see *Deliberately absent*. |
| `sources` | list of strings | yes | Where this entry's claims come from. CC BY attribution travels with the material, the same rule `adapted_from` enforces for nodes; and see *Living people*, for which sourcing is not merely good practice. |
| `status` | `stub` \| `draft` \| `review` \| `published` | yes | Mirrors the node ladder exactly, with the same meanings. A `stub` has complete, valid frontmatter and a real `summary`, but no body prose. |

Ten fields, matching the node schema's ceiling — and the same discipline applies:
an eleventh field must replace one of these, not extend the list. Authoring cost
is the dominant cost of this project, and it is paid per entry.

Unknown keys are a lint error, by name. `scripts/lint-people.mjs` parses the
table above rather than hardcoding it, so **this document is the allowlist** —
the same arrangement `docs/schema.md` has with `scripts/lint-content.mjs`.

## Example

```yaml
---
name: Émile Durkheim
aliases: [Durkheim, E. Durkheim, Emile Durkheim]
summary: French sociologist who established the discipline as an autonomous science of social facts, and whose studies of solidarity, suicide, and religion founded the functionalist tradition.
lived: 1858–1917
disciplines: [discipline/sociology]
traditions: [paradigm/functionalism]
works:
  - "The Division of Labour in Society (1893)"
  - "Suicide (1897)"
  - "The Elementary Forms of Religious Life (1912)"
sources:
  - "OpenStax Introduction to Sociology 3e, Section 1.2"
  - "OpenStax Introduction to Sociology 3e, Section 1.3"
status: stub
---
```

Note the two shapes: short single-token values (`aliases`, `disciplines`,
`traditions`) use flow style, matching node frontmatter; `works` and `sources`
use a block sequence with quoted strings, because titles contain the commas that
flow style would read as separators.

This example is a copy of the live frontmatter in
`content/people/emile-durkheim.md`; if the schema changes, update both.

## Three rules that must not be "fixed" later

Each of these is the kind of thing a future phase would otherwise improve in the
wrong direction, so each is stated with its reasoning.

### 1. `concepts` is derived, never stored

A person's concepts are computed by **inverting every node's `people:`** — the
edge is authored once, on the node, in the file where the connection is actually
made. There is no `concepts:` field here and there must not be one.

Storing it would create two sources of truth that diverge the moment a lesson is
edited: an author who adds `people: [Max Weber]` to a new node would have to
remember to edit `max-weber.md` too, and the day they forget, the person page and
the node disagree with nothing to adjudicate. This is the same reasoning that
keeps Mode 3's network placement derived (`docs/schema.md` → Network placement)
and course order out of node frontmatter.

### 2. One node, one discipline; one person, many

A node carries **exactly one** `discipline/` tag. A person carries **one or
more**. The asymmetry is deliberate, not an oversight to be harmonised:

- A node must pick a single home so Mode 2's hierarchy stays a true tree. A
  concept with two parents is not a tree, and a concept with two disciplines
  would want two homes.
- No such constraint applies to a person. Nobody's tree depends on Marx being
  filed under exactly one discipline, and the historical record is plainly that
  he is not.

This is precisely what makes the person registry the platform's **natively
interdisciplinary layer**: as the taxonomy grows past `discipline/sociology`, a
person is the first place two disciplines can meet without either giving way.
Retrofitting single → multi later would be a data migration across every entry;
shipping multi from the start costs nothing.

Note the sequencing: the multi-value *capability* ships now, the *values* wait for
the taxonomy. `discipline/sociology` is currently the only valid value, so every
seeded entry carries exactly that — including entries where a second discipline is
obviously true. Do not invent taxonomy values to fill the gap; add them to
`docs/taxonomy.md` first, by its own rules.

### 3. Living people

Entries for living people carry a higher bar, and it is an editorial rule, not
only a lint rule. Record **sourced claims only** — what someone wrote, when, and
where it was published. Do **not** characterise anyone's current views, positions,
or affiliations, which change and which a stub entry will silently misstate for
years. Include **no personal detail that is not professionally relevant**: not
health, family, employment disputes, politics, or anything a reader would
reasonably consider private. `sources` is required on every entry partly for this
reason — an unsourced sentence about a living person is the failure mode this rule
exists to prevent. When in doubt, write less; a shorter entry is not a defect.

## Deliberately absent

Recorded so the omissions read as decisions rather than gaps:

- **No `influences` field.** It only ever paid for graph edges in a
  person-to-person network, and that graph was cut. A field that powers no
  feature violates schema design principle 1, and "who influenced whom" is a
  contested scholarly claim that a one-line list flattens badly.
- **No work-level entity.** `works` is a list of strings, not a `content/works/`
  directory. A separate entity would earn its keep only if works needed their own
  pages, cross-references, or edges; none of that is planned, and the authoring
  cost lands immediately.
- **No citation metrics.** No h-index, no citation counts, no "influence score".
  They would need an external data source the project has no way to keep current,
  they encode one discipline's prestige economy as if it were fact, and they
  measure nothing a learner needs.

## People are not completable

There is **no progress key, no rollup, and no seal** for a person — not now, and
not as a future addition. The completion invariant (`docs/schema.md`) stores
per-learner state **per node, never per anything else**, and every rollup is
derived at read time. A person is not a lesson: there is nothing to finish.

This is stated explicitly because "add a visited-people tracker" is exactly the
plausible improvisation the invariant exists to prevent. A phase that adds one
reopens the storage-migration problem the invariant was written to close.
