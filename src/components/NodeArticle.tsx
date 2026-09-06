import type { ReactNode } from "react";
import Link from "next/link";
import {
  getAllNodes,
  getAllPeople,
  getQuiz,
  resolvePeople,
  type ConceptNode,
  type Person,
} from "../../lib/content";
import LessonCheck from "@/components/course/LessonCheck";
import SelfCheck from "@/components/SelfCheck";
import Perspectives, { perspectiveLabel } from "@/components/Perspectives";
import LessonComments from "@/components/LessonComments";
import TextSizeControl from "@/components/TextSizeControl";
import NodeRail from "@/components/NodeRail";
import { paradigmOf } from "@/lib/paradigm";

// The Frame 3 article (docs/wireframes.md): breadcrumb → title block → lede →
// prerequisites → body → right rail → Giscus placeholder → attribution.
// Modes 1 and 2 are navigation shells around this component — it is the only
// place lesson content is rendered.

const STATUS_BANNERS: Record<ConceptNode["status"], string | null> = {
  stub: "This lesson is a stub — content is incomplete.",
  draft: "This lesson is a draft — it has not yet passed review.",
  review: "This lesson is in review — content may change.",
  published: null,
};

// Walk the `parent` chain to the root. Failing to reach it (missing parent or
// cycle) is a tree-data bug and must break the build.
function getAncestors(
  node: ConceptNode,
  nodeMap: Map<string, ConceptNode>
): ConceptNode[] {
  const chain: ConceptNode[] = [];
  let current = node;
  while (current.parent !== null) {
    const parent = nodeMap.get(current.parent);
    if (!parent) {
      throw new Error(
        `Breadcrumb: '${current.slug}' has parent '${current.parent}', which does not exist`
      );
    }
    if (parent.slug === node.slug || chain.some((a) => a.slug === parent.slug)) {
      throw new Error(`Breadcrumb: cycle in parent chain at '${parent.slug}'`);
    }
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

function resolve(
  slugs: string[],
  nodeMap: Map<string, ConceptNode>,
  field: string,
  owner: string
): ConceptNode[] {
  return slugs.map((slug) => {
    const node = nodeMap.get(slug);
    if (!node) {
      throw new Error(`'${owner}' lists unknown slug '${slug}' in ${field}`);
    }
    return node;
  });
}

// A node's `people:` names → their registry entries, in the node's AUTHORED
// order. That order is the author's one editorial signal about relative weight
// for this lesson (labeling-theory lists Becker before Lemert deliberately), so
// it is never sorted. Deliberately unlike the profile page's concept list,
// which IS sorted (course order) because a person has no authored order to
// preserve — the asymmetry is correct.
//
// Both loaders are cached, so this is a map build per node, not I/O.
async function resolveNodePeople(node: ConceptNode): Promise<Person[]> {
  const names = node.people ?? [];
  if (names.length === 0) {
    return [];
  }

  const nameToSlug = await resolvePeople();
  const bySlug = new Map((await getAllPeople()).map((p) => [p.slug, p]));

  return names.map((name) => {
    const personSlug = nameToSlug.get(name);
    const person = personSlug ? bySlug.get(personSlug) : undefined;
    if (!person) {
      // lint:people passes today, so reaching this means the loader and the
      // linter disagree — a real defect, not a lenient-fallback case. Same
      // posture getConceptsForPerson takes in the other direction.
      throw new Error(
        `${node.slug}: people: '${name}' matches no person in content/people/`
      );
    }
    return person;
  });
}

export default async function NodeArticle({
  slug,
  beforeTitle,
  afterArticle,
  showPrereqCompletion = false,
}: {
  slug: string;
  // Mode-1-only slots (Frame 1): the position line above the title and the
  // Prev/Next + mark-complete controls below the article. Absent on /node.
  beforeTitle?: ReactNode;
  afterArticle?: ReactNode;
  // Mode 1 decorates prerequisite items with completion checkmarks; /node
  // keeps the plain 2.4 markup.
  showPrereqCompletion?: boolean;
}) {
  const nodeMap = new Map((await getAllNodes()).map((n) => [n.slug, n]));
  const node = nodeMap.get(slug);
  if (!node) {
    throw new Error(`Node not found: ${slug}`);
  }

  const ancestors = getAncestors(node, nodeMap);
  const prerequisites = resolve(node.prerequisites, nodeMap, "prerequisites", slug);
  const related = resolve(node.related ?? [], nodeMap, "related", slug);
  const people = await resolveNodePeople(node);
  const banner = STATUS_BANNERS[node.status];
  // Only published quizzes come back; draft/missing quizzes return null and no
  // section renders (the filter lives in the loader, so draft content never
  // ships in the payload). Rendered here — inside the single content renderer —
  // so both /node/[slug] and the course lesson view get the same surface.
  const quiz = getQuiz(slug);

  return (
    <div className="node-layout">
      <main className="node-main">
        <div className="article-toolbar">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {ancestors.map((ancestor) => (
            <span key={ancestor.slug}>
              <Link href={`/node/${ancestor.slug}`}>{ancestor.slug}</Link>
              <span className="breadcrumb-separator"> / </span>
            </span>
          ))}
          <span aria-current="page">{node.slug}</span>
          {/* The breadcrumb doubles as the you-are-here link into Mode 2
              (docs/wireframes.md, Frame 3) — mode-neutral, so both routes
              render it. */}
          <span className="breadcrumb-separator"> · </span>
          <Link href={`/hierarchy#${node.slug}`}>View in hierarchy</Link>
        </nav>
          <TextSizeControl />
        </div>

        {banner && (
          <p className={`status-banner status-${node.status}`} role="note">
            <strong>status: {node.status}</strong> — {banner}
          </p>
        )}

        {beforeTitle}

        <div className="title-block">
          <h1 className="node-title">{node.title}</h1>
          <span className={`difficulty-badge difficulty-${node.difficulty}`}>
            {node.difficulty}
          </span>
        </div>

        <p className="lede">{node.summary}</p>

        {prerequisites.length > 0 && (
          <aside className="prereq-callout">
            <h2 className="prereq-heading">Before this lesson</h2>
            {/* Completion state is a Step 2.5 / localStorage concern; it will
                decorate these items without changing the markup. */}
            <ul
              className={
                showPrereqCompletion
                  ? "prereq-list prereq-list-tracked"
                  : "prereq-list"
              }
            >
              {prerequisites.map((prereq) => (
                <li
                  key={prereq.slug}
                  className="prereq-item"
                  data-slug={prereq.slug}
                >
                  <Link href={`/node/${prereq.slug}`}>{prereq.title}</Link>
                  {showPrereqCompletion && <LessonCheck slug={prereq.slug} />}
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* When the pipeline extracted a structured Perspectives section, render
            the body around it: htmlBefore → <Perspectives> → htmlAfter, in the
            body's own position so the section does not migrate on the page.
            Everything stays inside `.node-body`, so the split fragments and the
            card prose inherit the article typography. When perspectives is null
            (no section, or a section the parser could not structure), the single
            `node.html` path renders exactly as pre-4.5. */}
        {node.perspectives ? (
          <article className="node-body">
            <div dangerouslySetInnerHTML={{ __html: node.htmlBefore }} />
            <Perspectives data={node.perspectives} />
            <div dangerouslySetInnerHTML={{ __html: node.htmlAfter }} />
          </article>
        ) : (
          <article
            className="node-body"
            dangerouslySetInnerHTML={{ __html: node.html }}
          />
        )}

        {quiz && <SelfCheck slug={node.slug} quiz={quiz} />}

        <LessonComments slug={node.slug} />

        {node.adapted_from && (
          <footer className="attribution">
            Adapted from{" "}
            <span className="attribution-source">{node.adapted_from}</span>,
            licensed under{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/">
              CC BY 4.0
            </a>
            . Changes were made to the original. See{" "}
            <a href="https://github.com/LTaniguti/learn-sociology/blob/main/LICENSE-CONTENT.md">
              LICENSE-CONTENT.md
            </a>
            .
          </footer>
        )}

        {afterArticle}
      </main>

      <NodeRail>
        {related.length > 0 && (
          <section className="rail-section rail-related">
            <h2 className="rail-heading">Related concepts</h2>
            <ul>
              {related.map((rel) => {
                const paradigm = paradigmOf(rel.tags);
                return (
                  <li
                    key={rel.slug}
                    className={
                      paradigm ? `related-item paradigm-${paradigm}` : "related-item"
                    }
                  >
                    <Link href={`/node/${rel.slug}`}>{rel.title}</Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Perspectives chips (4.8): orientation, not content — this concept
            is read n ways; jump to the section (the anchor is the section
            heading's stable id). Placed after related concepts: both are
            concept navigation, ahead of the people/tags metadata. Rendered
            only when the structured section exists — prose-fallback nodes
            show nothing here, consistent with the section itself. */}
        {node.perspectives && (
          <section className="rail-section rail-perspectives">
            <h2 className="rail-heading">Perspectives</h2>
            <ul className="rail-persp-chips">
              {node.perspectives.items.map((item, i) => (
                <li key={i}>
                  <a
                    className={
                      item.paradigm !== null
                        ? `rail-persp-chip paradigm-${item.paradigm}`
                        : "rail-persp-chip"
                    }
                    href="#perspectives"
                  >
                    {perspectiveLabel(item)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* People (6.2): the third host of the related-links row vocabulary,
            after Related concepts above and the profile's Concepts they cover.
            The label is the registry `name`, never the string the node
            authored — the registry is the one place a display form is decided,
            and a node's `people:` value is a resolution key that may
            legitimately be an alias. Every profile is a stub today and every
            row still links: a link to honest content is not a dead link, the
            same contract stub nodes have had since 2.4. */}
        {people.length > 0 && (
          <section className="rail-section rail-people">
            <h2 className="rail-heading">People</h2>
            <ul>
              {people.map((person) => {
                // The swatch denotes school of thought — the one meaning colour
                // carries — so it renders only when the person's tradition is
                // unambiguous. Zero or two-plus traditions take no class and
                // the neutral bar, exactly as a concept row without a
                // `paradigm/` tag does. The exactly-one guard lives here
                // because paradigmOf returns the FIRST match of many.
                const traditions = person.traditions ?? [];
                const paradigm =
                  traditions.length === 1 ? paradigmOf(traditions) : null;
                return (
                  <li
                    key={person.slug}
                    className={
                      paradigm
                        ? `related-item paradigm-${paradigm}`
                        : "related-item"
                    }
                  >
                    <Link href={`/people/${person.slug}`}>{person.name}</Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {node.tags.length > 0 && (
          <section className="rail-section rail-tags">
            <h2 className="rail-heading">Tags</h2>
            {/* Inert chips — tag filtering is deferred. */}
            <ul className="tag-chips">
              {node.tags.map((tag) => (
                <li
                  key={tag}
                  className={
                    tag.startsWith("paradigm/")
                      ? "tag-chip tag-chip-paradigm"
                      : "tag-chip"
                  }
                >
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        )}
      </NodeRail>
    </div>
  );
}
