# Tag Taxonomy

**Status:** Draft v0.1 — Stage 0. Expect small revisions after the first sample nodes are written; expect additions (not restructuring) as content grows.

This is the controlled vocabulary for the `tags` field in node frontmatter (see `docs/schema.md`). Tags power filtering and the Mode 3 concept network: shared tags create graph proximity, and tag frequency drives node centrality in force-directed layouts. Free-form tags fragment the graph — **every tag on every node must come from this file.**

## Tag format

Tags are written as `category/value`, all lowercase kebab-case:

```yaml
tags: [level/macro, subfield/foundations, type/theory]
```

The `category/` prefix keeps values unambiguous (`conflict` could be a paradigm or a topic; `paradigm/conflict` cannot be misread) and lets the platform group filters by category automatically.

## Categories

### 1. `level/` — level of analysis (required, exactly one)

Every node gets exactly one. If a concept genuinely spans levels, tag the level at which it is *taught* in this node.

| Tag | Meaning |
|---|---|
| `level/micro` | Face-to-face interaction, individual meaning-making |
| `level/meso` | Groups, organizations, communities, institutions in the middle range |
| `level/macro` | Whole societies, large-scale structures, historical change |

### 2. `type/` — what kind of node this is (required, exactly one)

| Tag | Meaning |
|---|---|
| `type/concept` | A defined idea or term (e.g., norms, status, stigma) |
| `type/theory` | An explanatory framework or named theory (e.g., labeling theory) |
| `type/method` | A research method or methodological idea (e.g., surveys, ethnography) |

### 3. `paradigm/` — theoretical paradigm (optional, zero or more)

Tag only when the concept **belongs to** a paradigm — i.e., it originates in or is primarily meaningful within one. Do not tag merely because a paradigm *has an opinion* about the concept; that belongs in the node body's Perspectives section. Most concepts will carry no paradigm tag, which is correct and keeps these tags meaningful.

| Tag | Meaning |
|---|---|
| `paradigm/functionalism` | Structural functionalism (Durkheim, Parsons, Merton) |
| `paradigm/conflict` | Conflict theory and its descendants (Marx, Weber-influenced, feminist conflict approaches) |
| `paradigm/interactionism` | Symbolic interactionism and micro-interpretive approaches (Mead, Goffman) |

### 4. `subfield/` — topical subfield (required, one or more)

Values mirror the chapter structure of OpenStax *Introduction to Sociology 3e*, so every seed concept has an obvious home and the taxonomy stays auditable against the source text.

| Tag | Corresponding territory |
|---|---|
| `subfield/foundations` | What sociology is, the sociological imagination, history of the discipline |
| `subfield/research-methods` | Research design, ethics, data |
| `subfield/culture` | Culture, values, norms, subcultures |
| `subfield/socialization` | Socialization, self, life course |
| `subfield/interaction` | Social interaction, groups, networks, organizations |
| `subfield/deviance` | Deviance, crime, social control |
| `subfield/stratification` | Class, inequality, poverty, global stratification |
| `subfield/race-ethnicity` | Race, ethnicity, minority–dominant relations |
| `subfield/gender-sexuality` | Gender, sex, sexuality |
| `subfield/family` | Marriage, family, relationships |
| `subfield/religion` | Religion as a social institution |
| `subfield/education` | Education as a social institution |
| `subfield/politics-economy` | Government, politics, work, economic systems |
| `subfield/health-medicine` | Health, medicine, the body |
| `subfield/population-environment` | Demography, urbanization, environment |
| `subfield/media-technology` | Media, technology, digital society |
| `subfield/social-change` | Collective behavior, social movements, social change |

## Rules of use

1. **Every node:** exactly one `level/`, exactly one `type/`, at least one `subfield/`, and `paradigm/` only when the concept belongs to a paradigm.
2. **Two subfields maximum.** If a node seems to need three, it is probably two concepts and should be split.
3. **New values require a pull request to this file first**, with a one-line justification. Tags never appear in a node before they exist here.
4. **Values are added, not renamed.** Like node slugs, tag values are contracts — renaming one is a breaking change across every node that uses it.

## Deliberately excluded (for now)

- **Theorist tags** — covered by the `thinkers` frontmatter field; duplicating them as tags would double-count edges in Mode 3.
- **Difficulty tags** — covered by the `difficulty` frontmatter field.
- **Region/era tags** (e.g., `era/classical`, `region/global-south`) — plausible future additions once content exists to justify them; premature at 50 nodes.

## Open questions (revisit after sample nodes)

- Is `type/` doing enough work to justify being required, or should it become optional?
- Should `paradigm/` gain a `paradigm/feminist` value, or is feminist theory better handled under `paradigm/conflict` plus the Perspectives body section? (Leaning toward adding it once gender/stratification nodes are written.)
