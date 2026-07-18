# Concept-Node Schema (v0.1)

Every file in /content is a "concept node": a Markdown file with YAML
frontmatter (metadata) followed by the lesson body.

## Frontmatter fields

​```yaml
---
id: social-stratification          # unique slug, kebab-case, matches filename
title: "Social Stratification"
node_type: concept                 # concept | theory | thinker | method
difficulty: intro                  # intro | intermediate | advanced
course_order: 9.1                  # position in Mode 1 (chapter.section style)
parent: social-structure           # single parent id, drives Mode 2 hierarchy
related: [social-class, inequality, weber-max]   # ids, drives Mode 3 network
tags: [inequality, macro, structural-functionalism]
summary: >
  One-sentence description used in graph tooltips and search results.
adapted_from: "OpenStax Introduction to Sociology 3e, Ch. 9.1"
adapted_from_url: https://openstax.org/books/introduction-sociology-3e/pages/9-1-what-is-social-stratification
status: draft                      # draft | review | published
---
​```

## Body structure

1. `## Overview` — plain-language introduction
2. `## Key Ideas` — the core content
3. `## Perspectives` — how major paradigms view this topic (multi-perspective by design)
4. `## Connections` — brief prose on why the `related` nodes matter
5. `## Sources & Further Reading`

## Rules

- `id` must equal the filename (minus `.md`) and be unique repo-wide.
- Every node except the root has exactly one `parent` (keeps Mode 2 a tree).
- `related` is for cross-links and may point anywhere (Mode 3 is a general graph).
- `adapted_from` is required whenever any OpenStax material is used.
