# learn-sociology

An open-source, graph-navigable platform for self-learning Sociology.

## About

Sociology has no shortage of online courses, but almost all of them are linear: a fixed sequence of lessons you follow from start to finish. This project explores a different approach — treating the discipline as a *network of interconnected concepts* that learners can navigate in whatever way suits them, whether that's a traditional course order, a top-down concept hierarchy, or free exploration through the links between ideas.

The goal is a platform that is:

- **Free and open source** — all content and code are openly licensed and publicly developed.
- **Graph-navigable** — concepts, theories, and thinkers are connected, and those connections are first-class navigation tools rather than an afterthought.
- **Multi-perspective by design** — sociology's major paradigms (functionalism, conflict theory, symbolic interactionism) are competing lenses, and contested topics are presented through each of them rather than flattened into a single narrative.
- **Community-extensible** — the long-term aim is a framework that others can expand, with content contributions handled through ordinary pull requests.

## Navigation modes

The final version of the platform is intended to provide four navigational modes for course content:

1. **Course order** — an ordered structure, reminiscent of introductory university courses, for learners who want a guided path.
2. **Concept hierarchy** — a collapsible map formatted similarly to a hierarchy chart, where core concepts branch out into progressively more niche ones.
3. **Concept network** — a navigable network of concepts and theories that visualizes how they interconnect and relate to each other, with broadly applicable ideas near the center and specialized ones toward the periphery.
4. **Sociologist network** — a navigable network of sociologists that visualizes the scale of their contributions and how their work is interconnected.

The initial proof of concept targets modes 1 and 2. Mode 3 is expected to emerge largely from the same underlying tag and link data, and mode 4 is planned last.

## How it works

Content lives in this repository as plain Markdown files with YAML frontmatter — one file per **concept node**. Each node defines a concept's name, definition, prerequisites, tags, related theorists, and curated external resources. The site is generated from these files, and the graph views are derived from the prerequisite and tag relationships between nodes.

This means the repository itself is the content database: contributing a lesson, fixing an error, or proposing a new connection is just a pull request.

```
content/   Lesson / concept-node markdown files
docs/      Design documents and the concept-node schema
```

## Content sources

Portions of the content are adapted from [*Introduction to Sociology 3e*](https://openstax.org/details/books/introduction-sociology-3e) by OpenStax (Rice University), licensed under CC BY 4.0. Adapted material is restructured and rewritten to fit the concept-node format, and files that draw on OpenStax material identify this in their frontmatter. See [LICENSE-CONTENT.md](LICENSE-CONTENT.md) for full attribution details.

## Status

**Early scoping — not yet usable.**

Current focus:

- [x] Define the concept-node schema and tag taxonomy
- [ ] Select the initial set of ~40–60 seed concepts
- [ ] Draft sample nodes to validate the schema
- [ ] Sketch the proof-of-concept designs for navigation modes 1 and 2

Contributions will be very welcome once the framework is further defined. In the meantime, feel free to open an issue with ideas, feedback, or interest in contributing.

## License

This project uses a dual license:

- **Code** is licensed under the [MIT License](LICENSE.md).
- **Content** (everything in `content/`, including lesson text, concept-node data, and accompanying images) is licensed under [CC BY 4.0](LICENSE-CONTENT.md).

By contributing to this repository, you agree that your contributions are licensed under these same terms.
