import type { Metadata } from "next";
import Shell from "@/components/Shell";
import HierarchyTree, {
  type HierarchyNode,
} from "@/components/hierarchy/HierarchyTree";
import {
  getAllNodes,
  getTree,
  type ConceptNode,
  type TreeNode,
} from "../../../lib/content";
// Shell / badge / chip styles live with the node route (see CourseView).
import "@/app/node/[slug]/node-page.css";
import "@/components/hierarchy/hierarchy.css";

// Frame 2 — Mode 2 hierarchy view. The tree's structure comes from exactly
// one source, the `parent` field (via getTree); this page only enriches each
// node with the fields the frame renders and hands a serializable tree to the
// client component. lib/content stays server-only.

export const metadata: Metadata = {
  title: "Hierarchy — learn-sociology",
  description:
    "The whole territory at a glance: every concept in its place in the tree.",
};

function enrich(tree: TreeNode, nodeMap: Map<string, ConceptNode>): HierarchyNode {
  const node = nodeMap.get(tree.slug);
  if (!node) {
    // getTree() builds from the same node set, so this is unreachable unless
    // the two sources drift — fail the build loudly if they ever do.
    throw new Error(`Hierarchy: no content node for tree slug '${tree.slug}'`);
  }
  const children = tree.children.map((child) => enrich(child, nodeMap));
  const descendantCount = children.reduce(
    (sum, child) => sum + 1 + child.descendantCount,
    0
  );
  return {
    slug: node.slug,
    title: node.title,
    summary: node.summary,
    difficulty: node.difficulty,
    tags: node.tags,
    descendantCount,
    children,
  };
}

export default async function HierarchyPage() {
  const nodeMap = new Map((await getAllNodes()).map((n) => [n.slug, n]));
  const root = enrich(await getTree(), nodeMap);

  return (
    <>
      <Shell active="hierarchy" />
      <main className="hierarchy-page">
        <HierarchyTree root={root} />
      </main>
    </>
  );
}
