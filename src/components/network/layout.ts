import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { estimateTextWidth } from "../hierarchy/layout";
import type { GraphData, NetworkEdgeData, NetworkNodeData } from "./graph";

// Phase 3.3 — pure layout math for the network canvas, reusing 3.2's split:
// **d3 computes coordinates, it never touches the DOM.** React renders the
// settled result as SVG, so every visual value stays a CSS token and all three
// themes work untouched.
//
// The simulation is run to settlement synchronously and then discarded —
// `.stop()` before its internal timer ever fires, then the whole tick budget
// spent in one pass. No animated settling, no per-tick React render. At 53
// nodes that is ~30ms; more importantly it is the structure that keeps a
// future 500-node graph off the render loop entirely.

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
  gravityX: number; // pull toward the centre line — shapes the aspect ratio
  gravityY: number;
  ticks: number;
};

/**
 * Force parameters — the design values of this mode, in the same sense that
 * row pitch and column gap are the hierarchy's. They decide whether the graph
 * reads as structure or as a hairball, so they are named and recorded here
 * rather than buried in the simulation call.
 *
 * Tuned against the real corpus: 53 nodes, 85 edges, one connected component.
 * The settled extent is ~1693x967 with zero pill overlaps.
 *
 * - `chargeStrength -340` / `chargeDistanceMax 500`: enough separation to
 *   read the eleven module clusters; weaker collapsed them into blobs, and
 *   removing the distance cap let far-apart clusters shove each other apart
 *   for no visual gain.
 * - `gravityX 0.18` against `gravityY 0.04`: deliberately asymmetric. Left
 *   equal, the graph settled ~1900x800 — a letterbox that wasted vertical
 *   space and forced a smaller fit-zoom. Pulling harder on X squares it up
 *   to roughly the viewport's aspect, which is what buys legible labels at
 *   the fit view.
 * - `linkDistance 95`: past ~130 the extent outgrew the viewport at fit-zoom
 *   and labels fell below legibility; below ~70 clusters fused.
 */
export const NETWORK_FORCES: NetworkGeometry = {
  nodeHeight: 40, // 3.2's node height, desktop and mobile — the tap target
  fontSize: 13.5,
  padX: 14,
  padding: 80,
  linkDistance: 95,
  linkStrength: 0.35,
  chargeStrength: -340,
  chargeDistanceMax: 500,
  collideGapX: 22,
  collideGapY: 24,
  collideIterations: 4,
  gravityX: 0.18,
  gravityY: 0.04,
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
};

type SimNode = SimulationNodeDatum & {
  slug: string;
  width: number;
  height: number;
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

export function layoutNetwork(
  graph: GraphData,
  geom: NetworkGeometry
): NetworkLayout {
  // Explicit phyllotaxis seeding. d3 would apply the same spiral itself, but
  // only to nodes whose x/y are unset, and its `jiggle` helper reaches for
  // Math.random() whenever two bodies land exactly on top of each other.
  // Placing every node at a distinct point up front means that branch is
  // never taken, so the layout is reproducible: the same corpus always
  // settles into the same picture, and spatial memory of the graph is worth
  // something to a returning learner. (Verified identical across runs.)
  const simNodes: SimNode[] = graph.nodes.map((n, i) => {
    const radius = 12 * Math.sqrt(0.5 + i);
    const angle = i * Math.PI * (3 - Math.sqrt(5)); // golden angle
    return {
      slug: n.slug,
      width: pillWidth(n.title, geom),
      height: geom.nodeHeight,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  });

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
    .force("center", forceCenter(0, 0))
    .force("gravity-x", forceX(0).strength(geom.gravityX))
    .force("gravity-y", forceY(0).strength(geom.gravityY))
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

  return {
    nodes,
    edges,
    bySlug,
    width: maxX - minX + geom.padding * 2,
    height: maxY - minY + geom.padding * 2,
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
