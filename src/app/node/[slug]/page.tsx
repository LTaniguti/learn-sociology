import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import {
  getAllNodes,
  getAllSlugs,
  getNode,
  type ConceptNode,
} from "../../../../lib/content";
import "./node-page.css";

// Static export has no server: every slug must be known at build time, and an
// unknown slug must fail the build rather than fall through to a runtime 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const node = await getNode((await params).slug);
  return { title: `${node.title} — learn-sociology`, description: node.summary };
}

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

export default async function NodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nodeMap = new Map((await getAllNodes()).map((n) => [n.slug, n]));
  const node = nodeMap.get(slug);
  if (!node) {
    throw new Error(`Node not found: ${slug}`);
  }

  const ancestors = getAncestors(node, nodeMap);
  const prerequisites = resolve(node.prerequisites, nodeMap, "prerequisites", slug);
  const related = resolve(node.related ?? [], nodeMap, "related", slug);
  const banner = STATUS_BANNERS[node.status];

  return (
    <>
      <Shell />
      <div className="node-layout">
        <main className="node-main">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            {ancestors.map((ancestor) => (
              <span key={ancestor.slug}>
                <Link href={`/node/${ancestor.slug}`}>{ancestor.slug}</Link>
                <span className="breadcrumb-separator"> / </span>
              </span>
            ))}
            <span aria-current="page">{node.slug}</span>
          </nav>

          {banner && (
            <p className={`status-banner status-${node.status}`} role="note">
              ⚠ status: {node.status} — {banner}
            </p>
          )}

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
              <ul className="prereq-list">
                {prerequisites.map((prereq) => (
                  <li
                    key={prereq.slug}
                    className="prereq-item"
                    data-slug={prereq.slug}
                  >
                    <Link href={`/node/${prereq.slug}`}>{prereq.title}</Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <article
            className="node-body"
            dangerouslySetInnerHTML={{ __html: node.html }}
          />

          {/* Giscus lesson forum — Step 2.7. Region reserved only; no script yet. */}
          <section className="giscus-placeholder" aria-hidden="true" />

          {node.adapted_from && (
            <footer className="attribution">
              Adapted from {node.adapted_from}, licensed under{" "}
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
        </main>

        <aside className="node-rail">
          {related.length > 0 && (
            <section className="rail-section rail-related">
              <h2 className="rail-heading">Related concepts</h2>
              <ul>
                {related.map((rel) => (
                  <li key={rel.slug}>
                    <Link href={`/node/${rel.slug}`}>{rel.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(node.thinkers?.length ?? 0) > 0 && (
            <section className="rail-section rail-thinkers">
              <h2 className="rail-heading">Thinkers</h2>
              {/* Mode 4 seed data — deliberately inert plain text, not links. */}
              <p>{node.thinkers!.join(", ")}</p>
            </section>
          )}

          {node.tags.length > 0 && (
            <section className="rail-section rail-tags">
              <h2 className="rail-heading">Tags</h2>
              {/* Inert chips — tag filtering is deferred. */}
              <ul className="tag-chips">
                {node.tags.map((tag) => (
                  <li key={tag} className="tag-chip">
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
