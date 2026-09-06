# People — Mode 4 Roadmap

**Status:** Direction, not a contract. Each phase becomes its own brief in `docs/tasks/`. `docs/person-schema.md` governs over this file the moment it exists.

**Supersedes** the earlier "Sociologists / citation network" plan in full. What changed and why is recorded in §1, because the interface currently ships a disabled tab promising the superseded thing.

---

## 1. What this mode is, and what it stopped being

**Shipping:** a browsable registry of the people behind the concepts — profile pages, and a card index grouped by era. **Not shipping:** a citation-weighted network canvas.

Three findings killed the network:

- **The graph is too sparse to be a graph.** The corpus names 16 unique people; 12 appear on exactly one node. The "derived concept weight" that was supposed to replace citation counts is, for three quarters of the roster, the number 1. Full backfill of all 53 nodes yields perhaps 35–45 names with the same long tail — the introductory canon is small by construction, and density never arrives.
- **Influence edges form three short chains,** not a web: Marx→Weber, Durkheim→Parsons→Merton, Mead→Blumer/Cooley→Goffman, with Lemert→Becker hanging off the third. Crenshaw and Sumner are near-isolates. Mode 3 needed 53 nodes and 87 edges plus a layout doctrine reversal to read well; this would not get there.
- **Citation weighting was never buildable here.** It requires an external bibliometric corpus in a project whose architecture is *the repo is the database*, coverage for pre-1950 scholarship is poor, and no contributor can pull-request a citation count.

Cards win on the property that matters most for a registry growing at contributor pace: **partial coverage looks fine.** A grid of 16 is a grid of 16; a graph of 16 is a failure. That is what makes this the version of the feature that survives partial commitment — correct for a project whose critical path is 53 unwritten lessons.

The mode is called **People**, not Sociologists, and the frontmatter field becomes `people:`. Both changes are for the multi-discipline future: "thinker" strains for a psychologist known for one well-replicated experiment or a practitioner like Addams, and "sociologists" forecloses the platform rename.

---

## 2. Why the registry earns a surface at all

The load-bearing deliverable is the **profile page**, because the payoff it delivers cannot be assembled anywhere else. "One person, many concepts, spanning disciplines" exists only by inverting `people:` across the whole corpus — a lesson page can never show it. It is also the platform's single natively-interdisciplinary layer: a node must pick exactly one `discipline/` tag to keep Mode 2's hierarchy a true tree, but Marx is genuinely sociology *and* economics *and* political theory, and nothing breaks if a person carries three.

The index page is the front door and is deliberately cheap.

**The honest cost, stated once:** the authoring tax is perpetual, not one-time. Every new lesson wires its people; every new person needs a bio someone writes and reviews — harder than concept lessons, because living subjects, contested legacies, and canon composition all land on the author. This is accepted on the condition that `people:` stays optional and profiles may sit at `stub` indefinitely, exactly as concept nodes did.

---

## 3. Presentation

**Chronological, grouped into era bands, is the default view.** Chronology is a declared spine with the property that rescued Mode 3 — total, external, uncontested, and immune to shifting when someone edits an edge. It teaches while you scroll. Its known costs: band boundaries are editorial and permanently ours to defend, and chronology carries an implied progress narrative that is wrong for sociology, where classical theory is live rather than superseded. The mode's own framing should say so.

**Alphabetical is the one alternate toggle** — no information, but the only way to find a name you already know, which is the most common lookup a reference layer serves.

**Tradition is a chip on the card, not a grouping axis.** Grouping by tradition turns Mills and Crenshaw into an "other" bucket; a chip can simply be absent. Same data, no structural claim to defend in a PR.

**No filter rail at v1.** A discipline filter with one value and a tradition filter empty for half the roster are inert controls, which the project does not ship. Facets arrive when a second discipline and a few dozen entries make them discriminating. The grid is built so they can.

**A true time axis is rejected:** the dates bunch into 1890–1930, then a mid-century group, then Crenshaw alone in 1989. An axis over that distribution is whitespace punctuated by a pileup, and adjacency on an axis reads as influence — a causal suggestion the data does not support. Era bands are the honest eighty percent.

---

## 4. Colour, shape, and the multi-discipline future

Colour is one channel and two things want it: school-of-thought (constant, within a discipline) and discipline identity (rare, at crossings). **Colour keeps meaning school of thought**; discipline is carried by route, header, wordmark, and hue family. Cross-discipline edges already have their own answer in `schema.md` — rendered distinctly, derived from both ends' `discipline/` tags.

Three consequences, in cost-to-fix order:

- **Amber is doing two jobs.** All three themes set `--paradigm-interactionism` to the same literal as `--color-accent`. Fine today; breaks the moment discipline identity claims the accent, dragging interactionism into every non-sociology discipline. **Decouple now** — values stay identical, only the coupling breaks. Three lines. This is Phase 6.0 Item 0.
- **The token names are discipline-coupled, and one is ambiguous.** Anthropology's functionalism is Malinowski and Radcliffe-Brown — a different thing from Parsons. `--paradigm-functionalism` must become role-based or discipline-scoped before a second discipline lands. Not this phase; recorded so it isn't discovered late.
- **The trio doesn't scale.** Psychology's approaches run five to seven, economics' schools four to six, and categorical hue discrimination collapses past about five — worse across three themes under contrast requirements. Cap the coloured set at four or five per discipline; everything else is neutral. Already precedented three times: optional paradigm tags, the gracefully un-accented Perspectives card, the muted fourth homepage card.

**On shapes as extra capacity.** Shape is a legitimate *redundant* channel and arguably required regardless — colour alone should never be the sole carrier of meaning. But it does not extend capacity much: reliable shape discrimination tops out around four to six, the same ballpark as colour, and at `--paradigm-dot-size: 7px` shape is indistinguishable noise. Shape needs roughly 12–16px to read. So: pair shape with colour where the mark is large enough and the meaning matters, and when a discipline genuinely exceeds the palette, **stop encoding and use the label**. Running out of colours is a signal that the dimension has too many values to encode at all, not a prompt to find a second encoding.

**Mechanism:** discipline becomes a second token override layer with the doctrine already proven for themes — `[data-discipline="…"]` scoping exactly as `[data-theme="light"]` does, no component knowing a discipline name. Avoid the three-themes × five-disciplines palette explosion by specifying themes as lightness/contrast rules and disciplines as hue families over a shared chroma spec: three theme specs and five hue sets, not fifteen hand-tuned palettes.

---

## 5. Phases

Numbering assumes a `6.x` block; renumber wholesale if the content push claims it.

**6.0 — Data contract and registry.** Accent decoupling; `thinkers:` → `people:`; non-node directory allowlist; `docs/person-schema.md`; 16 stub person entries; `scripts/lint-people.mjs` wired into CI. Nothing renders, no route, no tab change. Brief: `docs/tasks/phase-6.0-people-registry.md`.

**6.1 — Profile pages.** `/people/[slug]`, statically generated, reusing the article shell and prose measure. Stub entries render honestly as stubs, same as concept nodes do. "Concepts they cover" derived by inverting `people:`, with cross-discipline links visually marked — this is where the interdisciplinary point actually lands.

**6.2 — Node → person surfacing.** People chips on the lesson page linking into profiles. `components.md` updated in the same commit. After this the registry is useful even if the index were cancelled.

**6.3 — The index.** `/people`, era-grouped card grid, alphabetical toggle, tradition chips. Mode 4 tab decision made here: promote to a tab if 6.1–6.2 show use, otherwise leave it reachable from lessons, search, and the homepage. **The disabled Mode 4 tab comes down in this phase either way** — the promise it makes no longer matches the plan.

**6.4 — Integration.** Search indexes people with type disambiguation; `docs/writing-a-person.md`; `CONTRIBUTING.md` path; README roadmap and status table updated.

Bio prose is not a phase. It is content work that proceeds at whatever pace contributors set, against a registry that is valid and useful while every entry is still a stub.

---

## 6. Deferred deliberately

- **`influences` as structured data.** It only ever paid for graph edges. Without a canvas it is prose, and structured influence claims carry a contested-claim review burden for no rendering benefit. Profile bodies can say "extended Durkheim's anomie" in a sentence.
- **Works as a third entity.** A work-level graph is the only architecture where "citation network" would be literally true, and it roughly triples authoring cost. V1 keeps a short `works` list on the person.
- **Bibliometrics.** If ever wanted: a committed, dated, sourced snapshot rendered as a distinct labeled channel with its distortions stated. Sourced overlay, never ground truth.
- **Course-encounter ordering.** Interesting, derived from `course.yaml` × `people:`, but it strands everyone the course doesn't reach and breaks at a second manifest. Revisit if the content push closes the coverage gap. Any progress-marking must be derived at read time — never stored — or it reopens the completion invariant.
