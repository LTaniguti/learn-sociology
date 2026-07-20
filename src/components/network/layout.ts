import {
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { estimateTextWidth } from "../hierarchy/layout";
import {
  buildAdjacency,
  type GraphData,
  type NetworkEdgeData,
  type NetworkNodeData,
} from "./graph";

// Phase 3.4 — radial, degrees-of-separation layout for the network canvas.
// Same split as 3.2/3.3: **d3 computes coordinates, it never touches the
// DOM.** React renders the settled result as SVG, so every visual value stays
// a CSS token and all three themes work untouched.
//
// v1 (3.3) settled a free force cloud — clusters, but no reading of centrality.
// v2 pins the discipline's root at the middle and places every other node on a
// concentric ring by its distance from that root, so the picture *is* the
// original Mode 3 vision: central ideas at the centre, peripheral at the edge.
// A node's own frontmatter (its prerequisite/related links) determines its
// ring, which is what lets future content — including eventual interdisciplinary
// gateway nodes at the periphery — self-locate without a layout change.
//
// The simulation is run to settlement synchronously and then discarded —
// `.stop()` before its internal timer ever fires, then the whole tick budget
// spent in one pass. No animated settling, no per-tick React render. At 53
// nodes that is ~30ms; more importantly it is the structure that keeps a
// future 500-node graph off the render loop entirely.

/**
 * The centre is **pinned, not computed**. Society is the highest-degree node at
 * time of writing and the discipline's natural root, so it is named here as an
 * editorial choice. Deriving the centre from degree instead would let future
 * content silently move the middle of the map out from under a returning
 * learner's spatial memory; pinning makes recentring a deliberate one-line edit.
 */
export const CENTER_SLUG = "society";

// Seed spread (radians) applied to a node's angle around its BFS parent's
// angle. Not a force — it only shapes the *initial* placement so subtrees fall
// into angular sectors (branches) rather than a dartboard; the radial and
// collide forces take over from there. Narrowed by depth (÷ depth-1) so deep
// twigs stay tight under their branch. Deterministic (hash of slug, below).
const SEED_ANGULAR_SPREAD = 0.5;

export type NetworkGeometry = {
  nodeHeight: number;
  fontSize: number; // must track --type-node-label-size
  padX: number; // pill edge → label
  padding: number; // canvas padding around the settled extent
  linkDistance: number; // resting length of an edge
  linkStrength: number;
  chargeStrength: number; // node repulsion (negative)
  chargeDistanceMax: number; // beyond this, repulsion is not computed
  collideGapX: number; // minimum clear space between pills, horizontally
  collideGapY: number; // …and vertically
  collideIterations: number;
  ringSpacing: number; // radius added per degree of separation from the core
  radialStrength: number; // pull toward the node's ring — the dominant force
  ticks: number;
};

/**
 * Force parameters — the design values of this mode, v2, in the same sense that
 * row pitch and column gap are the hierarchy's. They decide whether the graph
 * reads as concentric structure or as a hairball, so they are named and
 * recorded here rather than buried in the simulation call.
 *
 * Tuned against the real corpus: 53 nodes, 85 edges, one connected component,
 * seven rings (depths 0–6 from `society`). Settled extent ~1848x1177 with zero
 * pill overlaps and rings that stay visually distinct (each ring's radial band
 * clears the next by ~20px+ at settle).
 *
 * - `ringSpacing 200` with `radialStrength 0.8`: `ringRadius(depth) =
 *   depth * 200`. The radial force is now the dominant positional force — it,
 *   not gravity, is what shapes the map. 200px is the tightest spacing at which
 *   the heavily-loaded ring 2 (27 nodes) settles into a band that still clears
 *   rings 1 and 3; closer merged the bands, wider only inflated the extent and
 *   pushed fit-zoom below the legibility floor.
 * - `linkDistance 70` / `linkStrength 0.2`: weaker and shorter than 3.3's
 *   95/0.35, because links no longer set position (the radial force does).
 *   Their job now is tangential: pulling connected siblings together *within*
 *   a ring so branches read as branches. Stronger links fought the radial pull
 *   and warped the rings.
 * - `chargeStrength -260` / `chargeDistanceMax 420`: softer than 3.3's
 *   -340/500. With the radial force containing nodes to rings and rectangle
 *   collision resolving overlaps, charge only needs to spread nodes tangentially
 *   inside a ring; more just bowed the rings outward.
 *
 * Removed in v2: the asymmetric `gravityX 0.18` / `gravityY 0.04` pull. Its job
 * was to fight the letterbox aspect ratio of the free cloud — squaring the
 * extent up so labels stayed legible at fit-zoom. Concentric geometry is
 * radially symmetric by construction, so there is no letterbox to fight and the
 * gravity would only distort the rings into ellipses. (Recorded, not deleted,
 * so the reasoning history survives: gravity solved 3.3's problem; 3.4 no longer
 * has that problem.)
 */
export const NETWORK_FORCES: NetworkGeometry = {
  nodeHeight: 40, // 3.2's node height, desktop and mobile — the tap target
  fontSize: 13.5,
  padX: 14,
  padding: 80,
  linkDistance: 70,
  linkStrength: 0.2,
  chargeStrength: -260,
  chargeDistanceMax: 420,
  collideGapX: 22,
  collideGapY: 24,
  collideIterations: 4,
  ringSpacing: 200,
  radialStrength: 0.8,
  ticks: 300,
};

// 390px differs only in canvas padding. The graph's *shape* is deliberately
// identical across breakpoints: a deep link, a screenshot, or a remembered
// position has to mean the same thing on both, so the mobile adaptation is in
// the initial view and the zoom, never in the layout.
export const MOBILE_NETWORK_FORCES: NetworkGeometry = {
  ...NETWORK_FORCES,
  padding: 40,
};

export type LaidNetworkNode = NetworkNodeData & {
  x: number; // centre
  y: number; // centre
  width: number;
  height: number;
};

export type LaidNetworkEdge = NetworkEdgeData & {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type NetworkLayout = {
  nodes: LaidNetworkNode[];
  edges: LaidNetworkEdge[];
  bySlug: Map<string, LaidNetworkNode>;
  width: number;
  height: number;
  centerSlug: string; // the pinned core (CENTER_SLUG when present)
  center: { x: number; y: number }; // its canvas position — the rings' origin
  ringRadii: number[]; // radius of each occupied ring, for the guide circles
};

type SimNode = SimulationNodeDatum & {
  slug: string;
  width: number;
  height: number;
  depth: number; // BFS distance from the centre — the node's ring index
};

/**
 * Rectangle separation, replacing `forceCollide`.
 *
 * `forceCollide` is circular, and these pills are ~4:1. A circle enclosing a
 * 150x40 pill reserves 85px of vertical clearance for 40px of node, which
 * inflated the settled extent to ~2100x1800 and pushed fit-zoom labels down
 * to 5px — illegible. Shrinking the radius to fit the height instead let
 * pills overlap horizontally (50+ collisions). Neither is a tuning problem;
 * a circle cannot describe this box.
 *
 * This force resolves axis-aligned box overlaps directly, separating along
 * the axis of *proportionally* least penetration so wide pills part sideways
 * and stacked ones part vertically. O(n²) per iteration, which at 53 nodes is
 * ~1,400 pair tests — cheaper than building a quadtree. Revisit above a few
 * hundred nodes.
 */
function rectCollide(geom: NetworkGeometry) {
  let nodes: SimNode[] = [];
  const force = () => {
    for (let k = 0; k < geom.collideIterations; k++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (b.x ?? 0) - (a.x ?? 0);
          const dy = (b.y ?? 0) - (a.y ?? 0);
          const minX = (a.width + b.width) / 2 + geom.collideGapX;
          const minY = (a.height + b.height) / 2 + geom.collideGapY;
          const overlapX = minX - Math.abs(dx);
          const overlapY = minY - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) continue; // disjoint on an axis
          if (overlapX / minX < overlapY / minY) {
            const push = (dx < 0 ? -overlapX : overlapX) / 2;
            a.x = (a.x ?? 0) - push;
            b.x = (b.x ?? 0) + push;
          } else {
            const push = (dy < 0 ? -overlapY : overlapY) / 2;
            a.y = (a.y ?? 0) - push;
            b.y = (b.y ?? 0) + push;
          }
        }
      }
    }
  };
  force.initialize = (n: SimNode[]) => {
    nodes = n;
  };
  return force;
}

function pillWidth(title: string, geom: NetworkGeometry): number {
  return geom.padX * 2 + estimateTextWidth(title, geom.fontSize);
}

/** Ring radius by degree of separation. The core sits at 0; every ring out is
 *  one `ringSpacing` further. This is the placement rule content self-locates
 *  into: a node's ring is a function of its own frontmatter, nothing more. */
function ringRadius(depth: number, geom: NetworkGeometry): number {
  return depth * geom.ringSpacing;
}

/** Deterministic hash of a slug → [0, 1). FNV-1a; the same slug always yields
 *  the same value, so the angular seed carries no `Math.random` and the layout
 *  is reproducible run to run (the phyllotaxis-seed principle from 3.3). */
function hashUnit(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * BFS from the centre over the **undirected union of prerequisite + related
 * edges**, recording each node's ring (depth) and the parent it was reached
 * through (used to seed angular sectors). Unreachable nodes — currently zero,
 * and that must stay checkable — land on the outermost ring and carry no
 * parent, so a future orphan surfaces as a node marooned on the rim rather than
 * silently dropped.
 */
function bfsRings(
  graph: GraphData,
  centerSlug: string
): { depth: Map<string, number>; parent: Map<string, string | null> } {
  const adjacency = buildAdjacency(graph);
  const depth = new Map<string, number>();
  const parent = new Map<string, string | null>();
  depth.set(centerSlug, 0);
  parent.set(centerSlug, null);
  const queue = [centerSlug];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    const d = depth.get(current)!;
    for (const next of adjacency.get(current) ?? []) {
      if (depth.has(next)) continue;
      depth.set(next, d + 1);
      parent.set(next, current);
      queue.push(next);
    }
  }
  let maxDepth = 0;
  for (const d of depth.values()) maxDepth = Math.max(maxDepth, d);
  for (const n of graph.nodes) {
    if (!depth.has(n.slug)) {
      depth.set(n.slug, maxDepth); // marooned → outermost ring
      parent.set(n.slug, null);
    }
  }
  return { depth, parent };
}

export function layoutNetwork(
  graph: GraphData,
  geom: NetworkGeometry
): NetworkLayout {
  // Centre is pinned editorially (CENTER_SLUG); if the corpus somehow lacks it,
  // fall back to the first node so the graph still renders rather than throwing.
  const centerSlug = graph.nodes.some((n) => n.slug === CENTER_SLUG)
    ? CENTER_SLUG
    : graph.nodes[0]?.slug;
  const { depth, parent } = bfsRings(graph, centerSlug);

  // Angular seeding. Every node starts at its ring radius, at an angle chosen
  // so that subtrees settle into sectors — the difference between "branches
  // radiating from a core" and "a dartboard". Ring-1 nodes spread evenly around
  // the centre; each deeper node starts near its BFS parent's angle, nudged by
  // a deterministic per-slug offset (no randomness). A parentless node — an
  // orphan on the rim, currently none — falls back to the phyllotaxis spiral
  // seed from 3.3. Because every node lands at a distinct point, d3's `jiggle`
  // (which reaches for Math.random on coincident bodies) is never triggered and
  // the layout is reproducible run to run. (Verified identical across runs.)
  const angleOf = new Map<string, number>();
  const ring1 = graph.nodes
    .filter((n) => depth.get(n.slug) === 1)
    .map((n) => n.slug)
    .sort();
  ring1.forEach((slug, i) => {
    angleOf.set(slug, (2 * Math.PI * i) / ring1.length);
  });
  let maxDepth = 0;
  for (const d of depth.values()) maxDepth = Math.max(maxDepth, d);
  for (let d = 2; d <= maxDepth; d++) {
    for (const n of graph.nodes) {
      if (depth.get(n.slug) !== d) continue;
      const parentAngle = angleOf.get(parent.get(n.slug) ?? "");
      if (parentAngle === undefined) continue; // parentless → phyllotaxis below
      const offset = (hashUnit(n.slug) * 2 - 1) * (SEED_ANGULAR_SPREAD / (d - 1));
      angleOf.set(n.slug, parentAngle + offset);
    }
  }

  const simNodes: SimNode[] = graph.nodes.map((n, i) => {
    const d = depth.get(n.slug)!;
    const radius = ringRadius(d, geom);
    const angle = angleOf.get(n.slug);
    const seed =
      angle === undefined
        ? // Phyllotaxis fallback (parentless / orphan): a distinct spiral point.
          (() => {
            const r = 12 * Math.sqrt(0.5 + i);
            const a = i * Math.PI * (3 - Math.sqrt(5)); // golden angle
            return { x: r * Math.cos(a), y: r * Math.sin(a) };
          })()
        : { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
    return {
      slug: n.slug,
      width: pillWidth(n.title, geom),
      height: geom.nodeHeight,
      depth: d,
      x: seed.x,
      y: seed.y,
    };
  });

  // Pin the centre at the origin. forceRadial pulls it to radius 0 too, but a
  // hard pin makes the map's middle a fixed point of reference rather than
  // something the simulation can nudge.
  const centerNode = simNodes.find((n) => n.slug === centerSlug);
  if (centerNode) {
    centerNode.fx = 0;
    centerNode.fy = 0;
  }

  // d3-force mutates what it is given; `simNodes` are throwaway copies so the
  // server-built GraphData shared across renders stays pristine.
  const simLinks: SimulationLinkDatum<SimNode>[] = graph.edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  forceSimulation(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
        .id((d) => d.slug)
        .distance(geom.linkDistance)
        .strength(geom.linkStrength)
    )
    .force(
      "charge",
      forceManyBody<SimNode>()
        .strength(geom.chargeStrength)
        .distanceMax(geom.chargeDistanceMax)
    )
    .force("collide", rectCollide(geom))
    // The dominant positional force: each node toward its ring radius, centred
    // on the pinned origin. This is what makes distance-from-core legible.
    .force(
      "radial",
      forceRadial<SimNode>((d) => ringRadius(d.depth, geom), 0, 0).strength(
        geom.radialStrength
      )
    )
    .stop()
    // d3's default alphaDecay is calibrated for exactly 300 ticks, so the
    // simulation is cold by the time this returns.
    .tick(geom.ticks);

  // Translate the settled cloud so its bounding box starts at `padding`.
  // Everything downstream — fit, deep links, keyboard panning — works in these
  // canvas coordinates, which are therefore always positive.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of simNodes) {
    minX = Math.min(minX, (n.x ?? 0) - n.width / 2);
    maxX = Math.max(maxX, (n.x ?? 0) + n.width / 2);
    minY = Math.min(minY, (n.y ?? 0) - n.height / 2);
    maxY = Math.max(maxY, (n.y ?? 0) + n.height / 2);
  }
  const dx = geom.padding - minX;
  const dy = geom.padding - minY;

  const dataBySlug = new Map(graph.nodes.map((n) => [n.slug, n]));
  const nodes: LaidNetworkNode[] = simNodes.map((n) => ({
    ...dataBySlug.get(n.slug)!,
    x: (n.x ?? 0) + dx,
    y: (n.y ?? 0) + dy,
    width: n.width,
    height: n.height,
  }));

  const bySlug = new Map(nodes.map((n) => [n.slug, n]));

  const edges: LaidNetworkEdge[] = graph.edges.map((e) => {
    const a = bySlug.get(e.source)!;
    const b = bySlug.get(e.target)!;
    return { ...e, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  });

  // Occupied ring radii (depth ≥ 1), for the guide circles. Concentric around
  // the pinned centre, whose canvas position is the rings' origin.
  const occupied = new Set<number>();
  for (const d of depth.values()) if (d >= 1) occupied.add(d);
  const ringRadii = [...occupied]
    .sort((a, b) => a - b)
    .map((d) => ringRadius(d, geom));
  const centerLaid = bySlug.get(centerSlug);
  const center = centerLaid
    ? { x: centerLaid.x, y: centerLaid.y }
    : { x: dx, y: dy };

  return {
    nodes,
    edges,
    bySlug,
    width: maxX - minX + geom.padding * 2,
    height: maxY - minY + geom.padding * 2,
    centerSlug,
    center,
    ringRadii,
  };
}

/**
 * Where an edge should stop so its arrowhead sits clear of the target pill
 * instead of under it: the point where the segment from (fromX, fromY) to the
 * node's centre crosses the node's box, pushed out by `gap`.
 */
export function trimToPill(
  fromX: number,
  fromY: number,
  node: LaidNetworkNode,
  gap: number
): { x: number; y: number } {
  const dx = fromX - node.x;
  const dy = fromY - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };
  const halfW = node.width / 2 + gap;
  const halfH = node.height / 2 + gap;
  // Scale the direction vector until it first exits the padded rectangle.
  const scale = Math.min(
    dx === 0 ? Infinity : halfW / Math.abs(dx),
    dy === 0 ? Infinity : halfH / Math.abs(dy)
  );
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}
