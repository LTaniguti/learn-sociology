# Writing a Lesson

This is the contributor's front door. Follow it top to bottom and you will have
written one lesson node — from picking a concept to opening a pull request —
without needing a local development environment or any prior GitHub experience.
Everything here can be done in a web browser at github.com; the site's own
content was built exactly this way.

> **The contracts govern; this tutorial only teaches.** Where the steps below
> paraphrase a rule to make it followable, the specifications are authoritative:
> **on any conflict, [`docs/schema.md`](schema.md), [`docs/taxonomy.md`](taxonomy.md),
> and [`docs/quiz-schema.md`](quiz-schema.md) win.** This page is deliberately not
> a second rulebook — it links each contract at the moment you need it and never
> restates one in full.

---

## 1. Before you start

A lesson is a **concept node**: one Markdown file in [`/content`](../content),
holding one concept, that becomes one node in the site's navigation graphs. The
filename *is* the concept's ID — lowercase kebab-case, e.g. `social-norms.md` —
and other nodes point at it by that name. Pick the filename once and carefully;
renaming it later breaks every link into it.

Each file has two parts: a **frontmatter** block (structured metadata between
`---` fences that the platform reads to build its graphs) and the **body** (the
prose a learner reads). You will write both.

Every node also carries a `status` telling readers how finished it is:

> `stub` → `draft` → `review` → `published`

A **stub** has complete metadata but no lesson yet — that is what most concepts
are today, and each one is a lesson waiting for an author. **You will submit your
work as `draft`.** A maintainer moves it onward to `review` and then `published`;
you never set those yourself. The ladder exists precisely so nothing has to be
perfect on arrival.

The exact rules for every field, tag, and quiz live in the three contracts named
in the box above. Keep them open in another tab as you go — this tutorial tells
you *what to do*; they tell you *exactly what is allowed*.

## 2. Set up in the browser

You do not need to install anything. The whole flow lives on github.com:

1. **Fork the repository.** On the project's GitHub page, click **Fork**
   (top-right). This gives you your own copy to edit freely.
2. **Create your file.** In your fork, open the `content/` folder and then the
   discipline folder inside it — `sociology/` — click **Add file → Create new
   file**, and name it `your-concept-slug.md` (the slug you chose in step 3
   below). GitHub edits it right in the browser. (The folder is organizational:
   your slug is the filename alone, and it must be unique across all of
   `content/`.)
3. **Commit.** When you have written something worth saving, scroll down, write a
   short commit message, and choose **Commit directly** to a new branch in your
   fork.
4. **Open a pull request.** GitHub shows a **Compare & pull request** button;
   click it, write a sentence about what you wrote, and submit. That sends your
   lesson to the project for review.

That is the entire loop: fork → edit → commit → pull request. You will refine and
re-commit many times before the PR is ready; each commit updates the same PR.

> **Optional — lint locally.** If you happen to have [Node.js](https://nodejs.org)
> installed, you can check your work before pushing with `npm run lint:content`.
> This is a convenience, not a requirement: the same checks run automatically on
> your pull request (see step 10), so the browser-only path is fully supported.

## 3. Pick your concept

Write a lesson for an existing **stub** — don't invent a new concept (proposing
new concepts or tags is a separate, Issue-first process; see
[`CONTRIBUTING.md`](../CONTRIBUTING.md)). Stubs are easy to spot:

- In the **Course** view, a stub lesson is flagged as not-yet-written.
- In the **Network** view, stub nodes render as **dashed pills**.
- The authoritative list — every concept, its place in the tree, and its
  prerequisites — is [`docs/concept-list.md`](concept-list.md).

**Claim it before you write.** To avoid two people writing the same article,
**comment on the relevant module Issue** to claim the node, exactly as
[`CONTRIBUTING.md`](../CONTRIBUTING.md) describes. If you later step away from a
claimed node, drop a note so someone else can pick it up.

## 4. The frontmatter, field by field

Frontmatter is the YAML block at the very top of the file, between two `---`
lines. There are **exactly ten fields, and that is the ceiling** — the schema's
field budget is spent, and adding an eleventh is a schema-change proposal, not an
authoring choice. Every field below already powers a feature; none is collected
"just in case."

The fastest start is to copy [`templates/node-template.md`](../templates/node-template.md),
which is this skeleton with every field ready to fill. Below, each field is
walked on **one illustrative worked example** — a node called `moral-panic`.

> ⚠️ **`moral-panic` is illustrative — this node does not exist in the
> repository.** It is used here so the example never goes stale the day someone
> writes the real one. Do not copy its slug; copy its *shape*.

```yaml
---
title: Moral Panic
summary: A wave of intense public concern over a group or behavior cast as a threat to society's values, typically amplified by media and out of proportion to the actual danger.
parent: deviance
prerequisites: [deviance]
related: [labeling-theory, social-control, social-movements]
tags: [discipline/sociology, level/macro, type/concept, subfield/deviance]
difficulty: intermediate
thinkers: [Stanley Cohen]
adapted_from: "OpenStax Introduction to Sociology 3e, Section 7.1"
status: draft
---
```

Field by field — *what it does in the product*, then the rule:

- **`title`** — the concept's display name. `Moral Panic`. See
  [`schema.md`](schema.md).
- **`summary`** — one or two sentences. This is the tooltip in the graph views
  and the search-result blurb, so it must define the concept on its own. Forces
  every concept to be sayable briefly.
- **`parent`** — the node's single home on the **Hierarchy** canvas (Mode 2).
  Exactly one parent keeps the hierarchy a true tree; the root (`sociology`) is
  the only node with `parent: null`. Here, `deviance`. It must match the Parent
  column in [`concept-list.md`](concept-list.md).
- **`prerequisites`** — a list (may be empty) of nodes a learner should meet
  first. These draw the **amber dependency path** and let the course order stay
  honest. `[deviance]`. Distinct from `parent`: often overlapping, but they serve
  different modes and stay separate.
- **`related`** — non-hierarchical "these ideas connect" edges that power the
  **Network** view (Mode 3). Relation is not dependence. `[labeling-theory,
  social-control, social-movements]`.
- **`tags`** — from the controlled vocabulary only; they drive filtering, network
  proximity, and the paradigm accents. Covered in full in the next section.
- **`difficulty`** — `intro` | `intermediate` | `advanced`, nothing finer. Lets
  learners self-filter.
- **`thinkers`** — a list of names, seeding the future Sociologists view. Cheap
  now, expensive to backfill. `[Stanley Cohen]`.
- **`adapted_from`** — attribution, required whenever you draw on a source. See
  section 8.
- **`status`** — set it to `draft`. Always.

Every value that names another node (`parent`, `prerequisites`, `related`) must
be a slug that actually exists, and `parent`/`prerequisites` must agree with
[`concept-list.md`](concept-list.md) — the linter checks all of this. The exact
type, requiredness, and purpose of each field is specified in
[`schema.md`](schema.md); read it once before your first node.

## 5. The tag system

Tags are written `category/value`, all lowercase kebab-case, and **every tag must
already exist in [`docs/taxonomy.md`](taxonomy.md)** — free-form tags fragment the
graph, and the linter rejects any tag not in that file. Read the taxonomy once;
it is short and organized by category.

The counting rules a node must satisfy (enforced by the linter):

- exactly **one** `discipline/` — currently always `discipline/sociology`;
- exactly **one** `level/` — `micro` | `meso` | `macro`, the level at which *this*
  node teaches the concept;
- exactly **one** `type/` — `concept` | `theory` | `method`;
- **one or two** `subfield/` — the topical home(s); if you want a third, the node
  is probably two concepts;
- **`paradigm/`** — zero or more, and **usually zero.**

That last one matters most to authors, because `paradigm/*` is what puts the
colored dot on a node's pill and ties it to the Perspectives cards. Tag a
paradigm **only when the concept belongs to that paradigm** — originates in it or
is primarily meaningful within it. Do *not* tag a paradigm merely because it *has
an opinion* about the concept; that opinion belongs in the body's Perspectives
section, not the tags. So `moral-panic`, a concept several paradigms interpret,
carries **no** `paradigm/` tag — while [`labeling-theory`](../content/sociology/labeling-theory.md),
which *is* an interactionist theory, correctly carries `paradigm/interactionism`.

If you miscount or use a tag that doesn't exist, the linter will tell you exactly
which rule you broke — you cannot get this silently wrong.

## 6. The body, heading by heading

Below the frontmatter comes the lesson. Use this heading set, in this order
(Perspectives and Further reading are optional):

```
## Definition
## In depth
## Perspectives        (optional)
## Examples
## Further reading      (optional)
```

Aim for **500–1,500 words** of lesson prose overall, and open with a hook — a
question, case, or puzzle — rather than a dictionary line.

- **`## Definition`** — 2–4 sentences that stand completely alone. A learner who
  arrives by clicking this node in a graph should get the core idea here without
  scrolling. Format key terms in **bold** the first time they appear, like
  **folk devils**.
- **`## In depth`** — the main lesson. This is where adapted source material
  lives, restructured to fit the concept. When you point at another concept in
  prose, write its slug in backticks, e.g. "closely related to `labeling-theory`"
  — backticked, not a live link; the graph provides the navigation. Ordinary
  Markdown works throughout: `**bold**`, `*italic*`, `-` bullet lists, and
  `[link text](https://example.org)` for external URLs.
- **`## Examples`** — 1–3 concrete cases. Sociology lands through cases, so this
  section is where an abstract idea becomes real; it is worth as much care as the
  definition.
- **`## Further reading`** — 2–3 curated external resources or primary texts.

Two living lessons show the whole shape at the right length:
[`content/sociology/social-norms.md`](../content/sociology/social-norms.md) and
[`content/sociology/labeling-theory.md`](../content/sociology/labeling-theory.md). Read them before
writing — imitating a real node is the fastest way to get the register right.

## 7. Perspectives, properly

The `## Perspectives` section exists because sociology is **multi-perspective by
design**: many concepts are read differently by the major paradigms
(functionalism, conflict theory, symbolic interactionism), and the section makes
that structural instead of leaving it to chance.

There are **two legitimate shapes**, and the renderer accepts **either** —
[`schema.md`](schema.md) is the authority here:

1. **A `###` subsection per reading**, or
2. **A bold-led bullet per reading** (optionally with a short intro paragraph
   above the bullets).

Both exemplars happen to use the bullet shape; use whichever reads better.

Two patterns, by node type:

- **A concept** several paradigms interpret gives each paradigm a short reading of
  the concept. See [`content/sociology/social-norms.md`](../content/sociology/social-norms.md).
- **A theory that itself belongs to a paradigm** instead records how the *other*
  paradigms respond to, critique, or extend it — often with a one-line intro
  explaining that inversion. See
  [`content/sociology/labeling-theory.md`](../content/sociology/labeling-theory.md).

**Lead each reading with the paradigm's name** — "Functionalist…", "Conflict…",
"Interactionist…" / "Symbolic…" — and that card earns the paradigm's accent
color. And the safety net: **anything the renderer doesn't recognize still
renders**, just as a plain (unaccented) card. You cannot break the page by
writing a Perspectives section — the worst case is a neutral card, so write
freely and lead with the paradigm name to get the accent.

## 8. Attribution

Much of the seed content adapts **OpenStax *Introduction to Sociology 3e***,
which is CC BY 4.0 — free to reuse *with attribution*. The rules, in plain words:

- **Adapt, never copy.** Restructure and rewrite source material to fit the node;
  do not paste it.
- **Record the source** in `adapted_from`, naming the section:
  `"OpenStax Introduction to Sociology 3e, Section 3.2"`. If a node draws on two
  sections, comma-separate them in the one string. Omit the field only for a
  fully original node.
- **By contributing, you license your work under CC BY 4.0.** Submitting content
  to `content/` means agreeing to that license.

The full terms are in [`LICENSE-CONTENT.md`](../LICENSE-CONTENT.md).

## 9. Quizzes (optional)

A node may carry an optional **self-check quiz** — a few questions shown below the
lesson, graded in the browser. It lives in its **own companion file**,
`content/sociology/quizzes/<slug>.yml` (same slug as the node), never in the node's
frontmatter. The format — `version: 1`, a `status`, and 1–8 `choice`/`reflect`
questions, each `choice` option carrying a `why` — is specified in full in
[`docs/quiz-schema.md`](quiz-schema.md).

One editorial rule to know up front: **no question may grade a paradigm-contested
claim as neutral fact.** Attribute it (a `paradigm:` field plus "According to
conflict theory, …" in the prompt) or make it an ungraded `reflect` question.

And one warning to take seriously:

> **Publish deliberately.** A `published` quiz with any `choice` question becomes
> the *completion mechanism* for its lesson — mastering it is the only way that
> lesson gets marked complete, and there is no un-mark control. So **submit your
> quiz as `status: draft`** and let review decide when to publish. A draft quiz
> never ships to the live site; it reserves the slot and passes the linter.

## 10. Submitting and what happens next

Open the pull request (section 2, step 4). When you do, **CI automatically lints
your work** — the same `npm run lint:content` from section 2, run for you. It
checks that your frontmatter fields are valid, every referenced slug resolves,
your tags exist and are counted correctly, the tree stays intact, and any quiz is
well-formed.

If something is off, the check fails with a specific message. They read like
this:

```
✗ moral-panic: tag not in taxonomy: paradigm/functionalist
```

That one means a tag isn't in [`taxonomy.md`](taxonomy.md) — here, the value
should be `paradigm/functionalism`. Each message names the file and the exact
rule, so fix the file, commit again, and the check re-runs on the same PR. (CI
runners sometimes sit queued for a bit — that's normal; wait rather than assume
it failed.)

Then a maintainer reviews the content and moves it along the ladder —
`draft` → `review` → `published`. **Imperfect drafts are welcome.** The whole
point of the status ladder is that nothing has to be perfect on arrival: submit
your best draft, and review is there to help it the rest of the way.
