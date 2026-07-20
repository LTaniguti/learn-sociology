// Phase 3.3 — Mode 3's data layer. Pure functions over frontmatter that was
// already being read for Modes 1 and 2: **no pipeline changes, no schema
// changes**. This module runs on the server (the page calls it at build time)
// and its output is a plain serializable object handed to the client canvas.

export type NetworkNodeData = {
  slug: string;
  title: string;
  summary: string;
  difficulty: "intro" | "intermediate" | "advanced";
  status: "stub" | "draft" | "review" | "published";
  tags: string[];
  paradigm: string | null;
  degree: number; // incident edges of either kind — drives the Home key
};

// `prerequisite` is directed, `related` is not. The distinction is real, not
// cosmetic: "A is a prerequisite of B" is an ordering claim about learning,
// while "A relates to B" is symmetric.
export type EdgeKind = "prerequisite" | "related";

export type NetworkEdgeData = {
  source: string; // prerequisite edges: the concept that comes first
  target: string; // prerequisite edges: the concept that requires it
  kind: EdgeKind;
};

export type GraphData = {
  nodes: NetworkNodeData[];
  edges: NetworkEdgeData[];
};

// What the builder needs from a content node. Structurally a subset of
// ConceptNode, declared independently so this module never imports the
// server-only content pipeline.
export type GraphInput = {
  slug: string;
  title: string;
  summary: string;
  difficulty: "intro" | "intermediate" | "advanced";
  status: "stub" | "draft" | "review" | "published";
  tags: string[];
  prerequisites: string[];
  related?: string[];
};

export function paradigmOf(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("paradigm/"));
  return tag ? tag.slice("paradigm/".length) : null;
}

// Undirected pair key, order-independent — used to dedupe `related` (which is
// usually declared on both nodes) and to suppress a `related` edge on a pair
// already joined by a prerequisite.
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Nodes = every concept. Edges = `prerequisites` (directed) and `related`
 * (undirected) from existing frontmatter, and nothing else.
 *
 * Shared-tag edges are a deliberate v1 exclusion: at 53 nodes across 11
 * modules, every node shares `discipline/sociology` and most share a
 * `level/*`, so tag edges would produce a near-complete graph — a hairball
 * that hides the 87 edges that carry actual meaning. Revisitable once the
 * canvas has filtering to switch edge classes on and off.
 */
export function buildGraph(input: GraphInput[]): GraphData {
  const known = new Set(input.map((n) => n.slug));
  const edges: NetworkEdgeData[] = [];
  const claimed = new Set<string>();
  const degree = new Map<string, number>(input.map((n) => [n.slug, 0]));

  const count = (a: string, b: string) => {
    degree.set(a, (degree.get(a) ?? 0) + 1);
    degree.set(b, (degree.get(b) ?? 0) + 1);
  };

  // Prerequisites first, so they win the pair against a `related` duplicate.
  // Direction runs prerequisite → dependent, i.e. the way learning flows.
  for (const node of input) {
    for (const prereq of node.prerequisites) {
      // Unknown slugs and self-references are already impossible — the content
      // lint resolves every prerequisite against the registry and would fail
      // the build first. Skipped rather than thrown so a graph still renders
      // if that guarantee is ever relaxed.
      if (!known.has(prereq) || prereq === node.slug) continue;
      const key = pairKey(prereq, node.slug);
      if (claimed.has(key)) continue;
      claimed.add(key);
      edges.push({ source: prereq, target: node.slug, kind: "prerequisite" });
      count(prereq, node.slug);
    }
  }

  for (const node of input) {
    for (const other of node.related ?? []) {
      if (!known.has(other) || other === node.slug) continue;
      const key = pairKey(node.slug, other);
      // Already joined — either by the reciprocal `related` declaration or by
      // a prerequisite, which is the stronger claim and keeps the pair.
      if (claimed.has(key)) continue;
      claimed.add(key);
      edges.push({ source: node.slug, target: other, kind: "related" });
      count(node.slug, other);
    }
  }

  const nodes: NetworkNodeData[] = input.map((n) => ({
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    difficulty: n.difficulty,
    status: n.status,
    tags: n.tags,
    paradigm: paradigmOf(n.tags),
    degree: degree.get(n.slug) ?? 0,
  }));

  return { nodes, edges };
}

/** slug → neighbours, both edge kinds, direction ignored. */
export function buildAdjacency(graph: GraphData): Map<string, string[]> {
  const adjacency = new Map<string, string[]>(
    graph.nodes.map((n) => [n.slug, [] as string[]])
  );
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }
  return adjacency;
}
