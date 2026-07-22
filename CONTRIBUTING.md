# Contributing

Thanks for your interest in helping build an open, graph-navigable way to learn
sociology! This page covers everything you need to make your first contribution.

## Want to write a lesson? Start here!

**→ [Writing a Lesson](docs/writing-a-lesson.md)** is the step-by-step tutorial:
it walks you through picking a concept, the frontmatter, tags, the body,
Perspectives, attribution, quizzes, and opening a pull request. Everything is intended 
to be done in the browser, no local setup required. If you are here to write content, 
that is your first resource; the rest of this page is the surrounding context.

## What we need most right now

**Writing full lesson articles for introductory stub nodes.** Every seed concept exists in
`content/` with complete metadata but a placeholder body (`status: stub`). Each
stub is an article waiting for an author. The full list of concepts, their tree
positions, and their prerequisites is in
[`docs/concept-list.md`](docs/concept-list.md).

## How to claim work

Before you start writing, **comment on the relevant module Issue** to claim the
node. This avoids two people writing the same article. If you stop working on a
claimed node, drop a note so someone else can pick it up.

## Writing nodes and quizzes

The [Writing a Lesson](docs/writing-a-lesson.md) tutorial is the walkthrough. The
contracts it teaches from are authoritative, so keep them open as you write:

- Frontmatter fields: [`docs/schema.md`](docs/schema.md)
- Tag vocabulary: [`docs/taxonomy.md`](docs/taxonomy.md)
- Self-check quizzes: [`docs/quiz-schema.md`](docs/quiz-schema.md)
- File skeleton to copy: [`templates/node-template.md`](templates/node-template.md)

Two rules worth stating here as well, as they carry legal and pedagogical
weight:

- **Adapt — never copy — OpenStax material.** Restructure and rewrite it to fit
  the node, and record the source in the `adapted_from` frontmatter field (e.g.
  `"OpenStax Introduction to Sociology 3e, Section 3.2"`).
- **Publish quizzes deliberately.** A `published` quiz with a `choice` question
  becomes the completion mechanism for its lesson (since 4.4). Submit quizzes as
  `status: draft`; let review publish them. The tutorial and
  [`docs/quiz-schema.md`](docs/quiz-schema.md) explain why.

Set `status: draft` in your pull request. Maintainer review moves the node
through `review` → `published`.

## Multi-perspective standard

**Sociology's major paradigms are competing lenses, not settled facts.** Contested
topics must present each major paradigm's reading fairly — functionalist,
conflict, and interactionist at minimum where they differ — and **no single
framing may be presented as neutral fact.** Lead each Perspectives subsection
(`###`) or bullet (`- **…**`) with the paradigm's name to earn its accent; any
other lead still renders as a neutral card. The tutorial's
[Perspectives section](docs/writing-a-lesson.md#7-perspectives-properly) shows how.

## Licensing

By contributing **content** (anything in `content/`), you agree it is licensed
under [CC BY 4.0](LICENSE-CONTENT.md). **Code** contributions are licensed under
[MIT](LICENSE.md).

## Everything else

Want to propose a new concept, a new tag, or a schema change? **Please open an Issue
first** — don't add them directly in a content pull request. New tags and
concepts must land in `docs/taxonomy.md` / `docs/concept-list.md` before any
node can make use of them.
