import type { Metadata } from "next";
import Shell from "@/components/Shell";
import NetworkCanvas from "@/components/network/NetworkCanvas";
import { buildGraph, type GraphInput } from "@/components/network/graph";
import { getAllNodes, getTree } from "../../../lib/content";
// Shell / badge / chip styles live with the node route (see CourseView).
import "@/app/node/[slug]/node-page.css";
import "@/components/preview/preview-card.css";
import "@/components/network/network-canvas.css";

// Mode 3 — the concept network (Phase 3.5). Built at build time from frontmatter
// that Modes 1 and 2 already read. Two serializable objects cross to the client:
// the cross-link graph (prerequisite + related edges) and the **same hierarchy
// tree Mode 2 uses** (`getTree()`, from the single `parent:` field). The client
// lays the tree out radially and settles the picture on mount. lib/content stays
// server-only.

export const metadata: Metadata = {
  title: "Network — learn-sociology",
  description:
    "How the concepts connect: prerequisites and related links as a navigable graph.",
};

export default async function NetworkPage() {
  const nodes = await getAllNodes();
  const input: GraphInput[] = nodes.map((n) => ({
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    difficulty: n.difficulty,
    status: n.status,
    tags: n.tags,
    prerequisites: n.prerequisites,
    related: n.related,
  }));
  const tree = await getTree();

  return (
    <>
      <Shell active="network" />
      <main className="network-page">
        <NetworkCanvas graph={buildGraph(input)} tree={tree} />
      </main>
    </>
  );
}
