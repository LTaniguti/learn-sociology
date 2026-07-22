Concept-node markdown lives one discipline folder deep — `sociology/<slug>.md`,
with each node's optional self-check quiz beside it in `sociology/quizzes/<slug>.yml`.
A second discipline lands as a sibling folder (`anthropology/…`).

The folder is for humans browsing the repo; it carries no meaning to the
platform. A node's identity is its filename basename (the slug), which must be
unique across all of `content/`. `course.yaml` (Mode 1's manifest) stays at this
root. See [`docs/schema.md`](../docs/schema.md) for the full contract.
