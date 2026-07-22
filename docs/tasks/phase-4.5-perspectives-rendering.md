# Task Brief — Phase 4.5: Structured Perspectives Rendering + Roadmap Entries

**Destination:** `docs/tasks/phase-4.5-perspectives-rendering.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** the README's near-term item — *"Structured 'Perspectives' rendering — paradigm columns driven by content-pipeline hooks."* The `## Perspectives` section currently renders as undifferentiated prose inside the one body blob; this phase gives it a structured, paradigm-accented presentation, driven entirely by a build-time pipeline transform. **Multi-perspective by design finally gets a face.** Also in scope: two owner-directed README roadmap additions (Item 4).

**Ground truth (verified — do not rediscover):**
- The paradigm trio (`--paradigm-functionalism/conflict/interactionism`) **and** the card surfaces (`--paradigm-func/conflict/inter-surface`) exist in **all three themes** — tokens.css, theme-light, theme-midnight. **Zero token work; zero theme-file work.** Tripwire on both.
- The body renders via `remark → html` in `lib/content.ts` (repo root `lib/`, not `src/lib`) into `node.html`, injected once in `NodeArticle.tsx` (~line 169).
- Two authoring shapes are legitimate and both must parse: the schema's **`###` subsection** pattern (concept nodes: three readings), and the **bold-led bullet** pattern with an intro paragraph, per `content/labeling-theory.md` (theory nodes: how other paradigms respond). `docs/schema.md` §Body structure names both.

**Hard requirement — graceful degradation:** the content push is about to turn 50 stubs into human-written lessons. The renderer must never be the reason a content PR fails or a lesson looks broken: any Perspectives content the parser can't structure renders **as plain prose exactly as today**, and any item it can't attribute renders as a **neutral card** — never dropped, never guessed. Content files: **untouched** in this phase.

**Sanctioned scope:** `lib/content.ts` (extraction), a new `Perspectives` component + CSS, `NodeArticle.tsx` (render the split), `README.md` (Item 4's roadmap edits), docs sync. Everything else — content, linter, quiz system, canvases, tokens, themes: tripwire.

## Standing rules (inherited, one addition)

Tokens + hex grep; improvisations reported; determinism (extraction is a pure function of the file — same input, same output, build-time only); post-mount localStorage patterns untouched (this phase is server-rendered); `prefers-reduced-motion` (nothing here should move anyway); queued-runner patience.

**New standing quirk (promoted after recurring in the 4.1 and 4.4 runs):** the browser pane's screenshot capture can desync from scroll position for below-fold content. When it does, visual proof via **computed styles + DOM text + accessibility geometry** is acceptable evidence in lieu of a pixel screenshot — note in the report when this substitution was used. Do not attempt to "fix" the page for a capture artifact.

**Observation to log, not act on:** `masteryMode` is now derived in two matched places (`SelfCheck`'s `choiceCount <= 0` early-return; `CourseView`'s `quiz !== null && choiceCount > 0`). This phase touches neither file. The note exists so the next phase that *does* touch them keeps the two matched or centralizes.

---

## Item 1 — Pipeline extraction (`lib/content.ts`)

At build time, split the body at the `## Perspectives` heading and structure its contents:

1. Operate on the **AST** (remark is already in the pipeline — add a small transform, not string surgery on HTML). Output shape per node, additive to the existing `ConceptNode`:
   - `htmlBefore` / `htmlAfter` (body around the section; if no Perspectives heading exists, the current single `html` path is preserved untouched — 50 stubs must build byte-identically, verify on a sample),
   - `perspectives: { intro: string | null; items: { paradigm: "functionalism" | "conflict" | "interactionism" | null; label: string; html: string }[] } | null`.
2. **Both shapes parse:** a `###` subsection becomes an item (heading text = label, subsection content = html); a top-level bold-led bullet (`- **Functionalist response.** …`) becomes an item (bold lead = label, remainder = html). Paragraphs between the `## Perspectives` heading and the first item are the `intro` (labeling-theory has one).
3. **Attribution via a small alias table**, matched against the item label, case-insensitive: `functionalis…` → functionalism; `conflict` → conflict; `interaction…` / `symbolic` → interactionism. No match → `paradigm: null` (neutral). The table is tiny and explicit — a future paradigm (a feminist reading, say) arrives as a neutral card with zero code change, and gets its own accent only when the taxonomy formally grows.
4. **Fallbacks, in order:** section absent → `perspectives: null`, nothing changes. Section present but zero items parse → `perspectives: null` **and the section stays in the body prose** (today's rendering, exactly). Items parse but some content precedes/follows oddly → structure what parses, keep the rest in `intro`/prose — never discard author text. State which fallback each real node hit in the report.

Commit: `Feature: content pipeline extracts structured Perspectives (4.5)`

## Item 2 — The `Perspectives` component

- `NodeArticle` renders `htmlBefore` → `<Perspectives>` (when non-null) → `htmlAfter`, in the body's existing position — the section must not migrate elsewhere on the page.
- Presentation: a section header in the article's heading vocabulary (the reader should not perceive a different "widget", but a designed passage of the same article), the `intro` as plain prose, then **cards**:
  - Card surface `--paradigm-*-surface`, a left accent border in the paradigm colour, and the paradigm **name label** in the established chip vocabulary — reuse/extend the 4.1 paradigm-attribution chip treatment so the quiz and the article speak one language. **The label carries the meaning; the hue accompanies it** (house CVD rule).
  - Neutral items: `--color-surface-sunken` (or nearest existing sunken token), no accent border, label rendered as authored.
  - Layout: cards as **columns on wide viewports** (2–3 across via grid, per the README's own phrasing), **stacked at article width and below on mobile**. No horizontal overflow at 390px.
- Links, bold, and inline code inside card html render with the article's prose styles (the card is a container, not a new typography scope).
- No interactivity in v1 — no collapse, no tabs, no per-paradigm filtering. Static, printable, honest.

Commit: `Feature: Perspectives cards — paradigm-accented columns in the article (4.5)`

## Item 3 — Docs sync

- `components.md`: new Perspectives entry — extraction shapes, alias table, fallback ladder, card anatomy, the neutral-card rule and its future-paradigm rationale, column/stack breakpoints.
- `docs/schema.md` §Body structure: one sentence noting the section now renders structurally, both authoring shapes are recognized, and unrecognized content degrades to prose (authors need not fear the renderer).
- `CONTRIBUTING.md`: one line — lead each Perspectives subsection/bullet with the paradigm's name to get its accent; anything else still renders, unaccented.

Commit: `Docs: Perspectives rendering — shapes, aliases, fallbacks (4.5)`

## Item 4 — README roadmap edits (owner-directed)

1. **Near term:** remove the *"Structured 'Perspectives' rendering…"* line — it ships in this phase.
2. **Further out**, add two entries (tune wording to the list's voice, keep the substance):
   - *Sound & motion pass — subtle animation and optional sound design to make completing lessons more satisfying and the interface more dynamic.*
   - *Settings panel — motion and sound preferences (layered over OS-level reduced-motion, never replacing it), and clearing device-local data: course progress, quiz attempts, and saved preferences.*
3. Touch nothing else in the README — recent owner edits (`Update README.md` ×2) are current and must not be reflowed.

Commit: `Docs: roadmap — Perspectives shipped; sound & motion pass and settings panel added (4.5)`

---

## Explicitly deferred

Per-paradigm filtering/tabs/collapse in the Perspectives section; a lint rule validating paradigm leads (revisit when the content push makes the convention high-traffic); new paradigm accents beyond the trio; everything on the existing deferred list (sound & motion and the settings panel now live on the README as future phases — this brief adds no code toward either).

## Verification (the whole gate, in order)

1. `npm run lint:content` green (content untouched — zero diff under `content/`); `npm run lint` clean; `npm run build` all pages.
2. **Degradation proof:** a sample stub's rendered page byte-identical pre/post (no Perspectives section → untouched path); a scratch fixture with an unparseable Perspectives section renders it as plain prose (fixture removed after, tree clean).
3. Real nodes: `labeling-theory` (intro + two attributed bullet items — functionalist response teal-accented, conflict extension rose-accented) and whichever other real lesson carries the section — correct attribution, intro preserved, nothing discarded.
4. Manual, desktop + 390px, all three themes: columns on wide, stacked on mobile, no overflow; card surfaces/accents follow theme; labels legible; a scratch neutral-item fixture shows the unaccented card (removed after).
5. Below-fold checks may use the promoted quirk's evidence substitution — note where used.
6. README diff is exactly Item 4's three edits.
7. Push, deploy green, live spot-check `labeling-theory`'s Perspectives at phone width. *(Note: labeling-theory is `status: draft` — it renders with the draft banner, which is fine for a spot-check; if the deployed route 404s for drafts, spot-check via the other real lesson and say so.)*

## Report back

The extraction's placement and output shape as implemented; which authoring shape and fallback each real node hit; the alias table verbatim; card anatomy with screenshots (or the quirk substitution, noted); confirmation of zero diffs under `content/`, tokens, and themes; the README lines as merged; improvisations.
