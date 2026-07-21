# Contributing

Thanks for your interest in helping build an open, graph-navigable way to learn sociology. This page covers everything you need to make your first contribution.

## What we need most right now

**Writing full lesson articles for stub nodes.** Every seed concept exists in `content/` with complete metadata but a placeholder body (`status: stub`). Each stub is an article waiting for an author. The full list of concepts, their tree positions, and their prerequisites is in [`docs/concept-list.md`](docs/concept-list.md).

## How to claim work

Before you start writing, **comment on the relevant module Issue** to claim the node. This avoids two people writing the same article. If you stop working on a claimed node, drop a note so someone else can pick it up.

## How to write a node

- Follow the file format in [`templates/node-template.md`](templates/node-template.md) and the frontmatter field definitions in [`docs/schema.md`](docs/schema.md). Tags must come from the controlled vocabulary in [`docs/taxonomy.md`](docs/taxonomy.md).
- Per-node authoring checklist:
  - **500–1,500 words** of lesson prose.
  - **An opening hook** — start from a question, case, or puzzle, not a dictionary entry.
  - **A Perspectives block** for theory nodes and contested topics (see the standard below).
  - **2–3 curated external resources** in Further reading.
- **Adapt — never copy — OpenStax material.** Restructure and rewrite it to fit the node, and record the source in the `adapted_from` frontmatter field (e.g. `"OpenStax Introduction to Sociology 3e, Section 3.2"`).
- Set `status: draft` in your pull request. Maintainer review moves the node through `review` → `published`.

## How to add a self-check quiz

A node may carry an optional **self-check quiz** — a few questions shown below
the lesson, graded in the browser with immediate feedback. It is
self-assessment, not a test.

- **File location:** `content/quizzes/<slug>.yml`, where `<slug>` is the node's
  filename (the quiz belongs to exactly that node). The node schema is untouched
  — quizzes are companion files.
- **Format:** follow [`docs/quiz-schema.md`](docs/quiz-schema.md) — `version: 1`,
  `status: draft | published`, and 1–8 `choice`/`reflect` questions. Every
  `choice` option needs a `why` (the wrong-answer explanations are where the
  teaching happens).
- **The contested-claim rule (most important):** no question may grade a
  paradigm-contested claim as neutral fact — attribute it (`paradigm:` + "According
  to conflict theory, …" in the prompt) or make it an ungraded `reflect` question.
- **Placeholders** are welcome: a `status: draft` file with one `PLACEHOLDER —`
  `choice` and one `reflect` passes the linter and reserves the slot. Only
  `published` quizzes render on the site.
- **Publishing gates completion (since 4.3):** setting a quiz to `status:
  published` makes finishing it **required** to mark that lesson complete in the
  course view (the learner must answer every `choice` question correctly before
  the mark-complete button unlocks) — so publish deliberately.
- **Lint before you push:** `npm run lint:content` validates quizzes alongside
  nodes.

## Multi-perspective standard

Sociology's major paradigms are competing lenses, not settled facts. Contested topics must present each major paradigm's reading fairly — functionalist, conflict, and interactionist at minimum where they differ — and **no single framing may be presented as neutral fact**.

## Licensing

By contributing **content** (anything in `content/`), you agree it is licensed under [CC BY 4.0](LICENSE-CONTENT.md). **Code** contributions are licensed under [MIT](LICENSE.md).

## Everything else

Want to propose a new concept, a new tag, or a schema change? **Open an Issue first** — don't add them directly in a content pull request. New tags and concepts need to land in `docs/taxonomy.md` / `docs/concept-list.md` before any node can use them.
