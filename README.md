# learn-sociology

An open-source, graph-navigable platform for self-learning sociology.

**Live proof of concept:** https://ltaniguti.github.io/learn-sociology/

## What this is

Most sociology courses are linear: one syllabus, one order, one voice. This project treats sociology as what it actually is — a connected web of concepts with multiple valid paths through it, and multiple theoretical lenses on every topic.

Every lesson is a Markdown file with YAML frontmatter in this repository. The repo **is** the database: the site is statically generated from these files, contributions are pull requests, and every change is lint-checked in CI before it can deploy.

## Navigation modes

| Mode | View | Status |
|---|---|---|
| 1 | **Course** — a linear, university-style path with progress tracking | Live |
| 2 | **Hierarchy** — a node-and-edge canvas of the concept tree, from core to niche | Live |
| 3 | **Network** — a navigable graph of how concepts interrelate | Live |
| 4 | **Sociologists** — a citation-weighted network of thinkers and their work | Planned |

The remaining planned mode appears in the interface as a visible, disabled tab on purpose: the roadmap is part of the project's identity.

## How it works

- **Content:** `/content` holds one Markdown file per concept node (53 starter seed concepts across 11 modules, drawn from OpenStax *Introduction to Sociology 3e*). `content/course.yaml` defines the Mode 1 sequence. `docs/schema.md` and `docs/taxonomy.md` define the frontmatter contract and tag vocabulary.
- **Validation:** `npm run lint:content` checks every node (slugs, parents, prerequisites, tags, status, ordering). It runs on every push and pull request, and a failing lint blocks deployment.
- **Site:** Next.js static export, deployed to GitHub Pages by Actions on every merge to `main`. Progress and preferences are device-local (`localStorage`) — there are no accounts and no tracking.
- **Design:** the visual system ("Open Commons") lives in `docs/design/` — direction, tokens, and component specs. Every visual value in the app is a token; the token file itself is imported as live code. The site ships three themes — the Open Commons dark default, a higher-contrast "Midnight Draft", and a warm light theme — selectable from the top bar and remembered device-locally. Themes are token overrides only: no component knows a theme name.
- **Discussion:** each lesson embeds a Giscus thread backed by this repo's GitHub Discussions.
- **Multi-perspective by design:** contested topics present sociology's paradigms side by side rather than flattening them into one narrative. This is a design principle rather than an afterthought.

## Status

The proof of concept is live with Modes 1, 2 and 3. The current focus is **content**: replacing stub nodes with full human written draft lessons that are ready to later be peer-reviewed.

## Roadmap

Near term:
- Content push — stub nodes → published lessons + quizzes ready for peer review 
- Mode 4: sociologist profiles and citation network

Further out:
- Interdisciplinary gateway nodes — periphery concepts bridging into adjacent social sciences, opening future branches beyond sociology
- Expanding Sociology stubs from the current starter set of 53
- Stub nodes for more interdisciplinary subjects and in the far future other social sciences added to network view 
- Sound & motion pass — subtle animation and optional sound design to make completing lessons more satisfying and the interface more dynamic
- Settings panel — motion and sound preferences (layered over OS-level reduced-motion, never replacing it), plus clearing device-local data: course progress, quiz attempts, and saved preferences
- End-of-unit tests — module-level assessments for completing course units, paired with the sound & motion pass so finishing a unit feels like something
- Homepage redesign — a proper front door that orients new visitors, surfaces the navigation modes, and shows a returning learner their progress at a glance

## Contributing

Contributions are welcome — see `CONTRIBUTING.md`. Lessons are Markdown files; proposing one is a pull request, and the content linter will tell you if the frontmatter is off.

## Licensing

Dual-licensed: **code** under MIT ([LICENSE](LICENSE.md)), **content** under CC BY 4.0 ([LICENSE-CONTENT.md](LICENSE-CONTENT.md)). Portions of the content are adapted from *Introduction to Sociology 3e* by OpenStax (Rice University), CC BY 4.0 — see the content license for full attribution.
