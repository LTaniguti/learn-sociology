import Link from "next/link";
import {
  getConceptsForPerson,
  getPerson,
  type Person,
} from "../../lib/content";
import TextSizeControl from "@/components/TextSizeControl";
import NodeRail from "@/components/NodeRail";
import { paradigmOf } from "@/lib/paradigm";

// The person profile (6.1) — the second content entity's only surface, and a
// sibling to NodeArticle: same article panel, same rail, same prose measure.
// It renders in the /people/[slug] route and nowhere else.
//
// A person is NOT a lesson (docs/person-schema.md → People are not
// completable): no progress key, no rollup, no seal, no LessonCheck anywhere
// below. There is nothing to finish.

// Person copy, deliberately NOT a generalisation of NodeArticle's
// STATUS_BANNERS: the ladder is the same four values, but a stub lesson and a
// stub profile are honest about different things, and one shared map would
// force lesson wording onto a profile. `published` hides the banner — the only
// status that does, exactly as on the node page.
const PERSON_STATUS_BANNERS: Record<Person["status"], string | null> = {
  stub: "This profile is a stub — the entry is valid, but no biography has been written yet.",
  draft: "This profile is a draft — it has not yet passed review.",
  review: "This profile is in review — content may change.",
  published: null,
};

// A node's single `discipline/` tag, bare (`discipline/sociology` →
// `sociology`). The prefix is identical on every row, so the mark carries only
// the part that can differ.
function disciplineOf(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("discipline/"));
  return tag ? tag.slice("discipline/".length) : null;
}

export default async function PersonArticle({ slug }: { slug: string }) {
  const person = await getPerson(slug);
  // Derived, never stored (docs/person-schema.md rule 1): every concept here
  // comes from inverting nodes' `people:` at build time.
  const concepts = await getConceptsForPerson(slug);
  const banner = PERSON_STATUS_BANNERS[person.status];

  // Cross-discipline marking (6.1). The mark is COMPARATIVE: it renders only
  // when the derived concepts span more than one discipline, because a
  // `sociology` label on every row of every profile today would be pure noise.
  //
  // Read from the NODES' tags, never from `person.disciplines` — schema.md is
  // explicit that cross-discipline relationships are derived from data that
  // already exists, and a node's single `discipline/` tag is that data. The
  // person's own list is authored and may legitimately disagree.
  //
  // There is no "primary discipline" for a person (person-schema.md gives an
  // unordered list), so no row is ever marked as "outside their home
  // discipline". Grouping the list under discipline subheadings is deferred
  // until a real second discipline exists to look at.
  const disciplines = new Set(
    concepts.flatMap((c) => c.tags.filter((t) => t.startsWith("discipline/")))
  );
  const marksCrossDiscipline = disciplines.size > 1;
  const traditions = person.traditions ?? [];
  const works = person.works ?? [];

  return (
    <div className="node-layout">
      <main className="node-main">
        <div className="article-toolbar">
          {/* An eyebrow, not a breadcrumb and not a link: /people does not
              exist, and a crumb pointing nowhere is a dead link. 6.3 owns the
              decision to promote this into a real crumb — do not "fix" it
              before there is an index to point at. */}
          <p className="person-eyebrow">People</p>
          <TextSizeControl />
        </div>

        {banner && (
          <p className={`status-banner status-${person.status}`} role="note">
            <strong>status: {person.status}</strong> — {banner}
          </p>
        )}

        <div className="title-block">
          {/* Diacritics intact: `name` is the canonical display form and the
              folded slug never appears on screen. */}
          <h1 className="node-title">{person.name}</h1>
        </div>

        {/* Free text by design, so deliberately not a pill — the badge
            vocabulary belongs to controlled-vocabulary states, and `lived`
            holds `c. 1820–1895` as written. */}
        <p className="person-life">
          {person.lived}
          {person.active && <> · active {person.active}</>}
        </p>

        <p className="lede">{person.summary}</p>

        {/* A stub has no body prose, and emits no empty article element. */}
        {person.html.trim() !== "" && (
          <article
            className="node-body"
            dangerouslySetInnerHTML={{ __html: person.html }}
          />
        )}

        {/* The payoff of the page, and the reason it sits in the main column
            rather than the rail: "one person, many concepts" is the view that
            cannot be assembled anywhere else, and for a stub entry — which is
            every entry today — the rail placement would leave this column
            empty. */}
        <section className="person-concepts-section">
          <h2 className="person-concepts-heading">Concepts they cover</h2>
          {concepts.length > 0 ? (
            <ul className="person-concepts">
              {concepts.map((concept) => {
                const paradigm = paradigmOf(concept.tags);
                const discipline = disciplineOf(concept.tags);
                return (
                  <li
                    key={concept.slug}
                    className={
                      paradigm
                        ? `related-item paradigm-${paradigm}`
                        : "related-item"
                    }
                  >
                    <Link href={`/node/${concept.slug}`}>{concept.title}</Link>
                    {marksCrossDiscipline && discipline && (
                      <span className="person-concept-discipline">
                        {discipline}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="person-concepts-empty">
              No lesson in the corpus names this person yet.
            </p>
          )}
        </section>

        {/* Sources are this entry's attribution surface, which is why the
            schema requires them — so they sit at the page foot with the
            standing licence line, not in the rail. */}
        <footer className="attribution">
          <span className="person-sources-heading">Sources</span>
          <ul className="person-sources">
            {person.sources.map((source) => (
              <li key={source} className="attribution-source">
                {source}
              </li>
            ))}
          </ul>
          Text on this site is licensed under{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
          See{" "}
          <a href="https://github.com/LTaniguti/learn-sociology/blob/main/LICENSE-CONTENT.md">
            LICENSE-CONTENT.md
          </a>
          .
        </footer>
      </main>

      <NodeRail>
        {/* `aliases` is resolution machinery (it is how a node's `people:`
            finds this entry) and is never rendered. */}
        <section className="rail-section rail-tags">
          <h2 className="rail-heading">Disciplines</h2>
          {/* The same chips the node page uses, so a future second discipline
              needs no styling work here. */}
          <ul className="tag-chips">
            {person.disciplines.map((discipline) => (
              <li key={discipline} className="tag-chip">
                {discipline}
              </li>
            ))}
          </ul>
        </section>

        {traditions.length > 0 && (
          <section className="rail-section rail-tags">
            <h2 className="rail-heading">Traditions</h2>
            {/* paradigm/* values keep their accent treatment for free. */}
            <ul className="tag-chips">
              {traditions.map((tradition) => (
                <li key={tradition} className="tag-chip tag-chip-paradigm">
                  {tradition}
                </li>
              ))}
            </ul>
          </section>
        )}

        {works.length > 0 && (
          <section className="rail-section">
            <h2 className="rail-heading">Works</h2>
            <ul className="person-works">
              {works.map((work) => (
                <li key={work}>{work}</li>
              ))}
            </ul>
          </section>
        )}
      </NodeRail>
    </div>
  );
}
