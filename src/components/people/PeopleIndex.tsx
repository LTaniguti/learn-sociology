"use client";

import { useState } from "react";
import Link from "next/link";
import type { PeopleIndex } from "../../../lib/content";

// The /people index (6.3) — the People mode's front door, and the one client
// component on the route.
//
// WHY A CLIENT COMPONENT AT ALL: the sort toggle re-orders and re-groups the
// cards, which needs the data on the client. But BOTH orderings are precomputed
// server-side (getPeopleIndex in lib/content.ts), so this component NEVER
// SORTS — it selects one of two prepared lists. Ordering rules live in exactly
// one place, and that place is not here. Precedent: HierarchyCanvas receives an
// enriched tree the same way. At 16 entries the prop inlines into the static
// page.
//
// The sort choice is SESSION-ONLY (useState), deliberately not persisted — no
// localStorage key, no URL hash. This departs from the rail and syllabus
// collapse states, which do persist: those are layout preferences a reader sets
// once, whereas this is a view choice, and a returning reader should land on the
// teaching view (era) rather than on whatever they last looked something up in.
// Recorded in docs/design/components.md → "People index (6.3)".
//
// People are NOT completable (docs/person-schema.md): no progress, no visited
// state, no counts of profiles read. This is a reference surface.

type Sort = "era" | "alpha";

export default function PeopleIndex({ index }: { index: PeopleIndex }) {
  const [sort, setSort] = useState<Sort>("era");

  // Era first: chronology teaches while you scroll. A–Z carries no information
  // — it is the only way to find a name you already know, which is the most
  // common lookup a reference layer serves (people-mode-roadmap.md §3).
  const groups =
    sort === "era"
      ? index.byEra
      : [{ band: null, slugs: index.alphabetical }];

  return (
    <>
      <div className="people-head">
        <h1 className="node-title">People</h1>
        <p className="lede">
          The people behind the concepts, grouped by when they were born —
          earlier is not superseded, and classical theory is still in use.
        </p>
      </div>

      {/* The page's ONLY control. No filter rail, no discipline facet, no
          search field: a discipline filter has one value today and a tradition
          filter is empty for half the roster, and the project does not ship
          inert controls (people-mode-roadmap.md §3). The grid is built so
          facets can arrive when they would discriminate. */}
      <div className="people-sort" role="group" aria-label="Sort people">
        <button
          type="button"
          className={
            sort === "era" ? "people-sort-option is-active" : "people-sort-option"
          }
          aria-pressed={sort === "era"}
          onClick={() => setSort("era")}
        >
          By era
        </button>
        <button
          type="button"
          className={
            sort === "alpha"
              ? "people-sort-option is-active"
              : "people-sort-option"
          }
          aria-pressed={sort === "alpha"}
          onClick={() => setSort("alpha")}
        >
          A–Z
        </button>
      </div>

      {groups.map((group) => (
        <section
          key={group.band ?? "all"}
          className="people-band"
          aria-label={group.band ?? "All people, alphabetical"}
        >
          {/* A–Z is one flat grid with no headings — the band labels are a
              claim about chronology, and the alphabet makes no such claim. */}
          {group.band && <h2 className="people-band-heading">{group.band}</h2>}
          <div className="people-grid">
            {group.slugs.map((slug) => {
              const card = index.cards[slug];
              return (
                <Link
                  key={slug}
                  href={`/people/${slug}`}
                  className="person-card"
                >
                  <div className="person-card-head">
                    {/* Diacritics intact: `name` is the canonical display
                        form, and the folded slug never appears on screen. */}
                    <h3 className="person-card-name">{card.name}</h3>
                    {/* Honesty is styled (direction rule 5): every entry is a
                        stub today and the card says so rather than looking
                        finished. `published` is the one status that hides,
                        exactly as on the profile and the node page. */}
                    {card.status !== "published" && (
                      <span className="person-card-status">{card.status}</span>
                    )}
                  </div>
                  {/* `lived` verbatim — free text by design
                      (docs/person-schema.md), so `b. 1959` and `c. 1820–1895`
                      render as written and are never reformatted, even though
                      the band above was derived from this same string. */}
                  <p className="person-card-life">{card.lived}</p>
                  <p className="person-card-summary">{card.summary}</p>
                  {/* Tradition is a CHIP, not a grouping axis: grouping by it
                      turns Mills and Crenshaw into an "other" bucket, whereas a
                      chip can simply be absent (people-mode-roadmap.md §3).
                      Absent when empty — no placeholder, no em dash. The
                      paradigm/ value keeps its accent for free. */}
                  {card.traditions.length > 0 && (
                    <ul className="tag-chips person-card-chips">
                      {card.traditions.map((tradition) => (
                        <li key={tradition} className="tag-chip tag-chip-paradigm">
                          {tradition}
                        </li>
                      ))}
                    </ul>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
