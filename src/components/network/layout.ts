import { hierarchy, tree } from "d3-hierarchy";
import { estimateTextWidth } from "../hierarchy/layout";
import {
  buildAdjacency,
  type GraphData,
  type NetworkEdgeData,
  type NetworkNodeData,
} from "./graph";

// Phase 3.5 — Mode 3 as a **radial tidy tree of the Mode 2 hierarchy**, with
// prerequisite/related edges as a quiet overlay that comes forward on selection.
//
// Same split as every canvas since 3.2: **d3 computes coordinates, it never
// touches the DOM.** React renders the settled result as SVG, so every visual
// value stays a CSS token and all three themes work untouched.
//
// Why this replaces 3.4's force-with-radial-constraint layout:
//
//  - Ring depth is now *declared* specialization — a node's depth in the curated
//    `parent:` chain — instead of a BFS distance derived from its prerequisite/
//    related wiring. There is one source of truth for "how core is this concept",
//    the hierarchy, and Modes 2 and 3 now share it. In 3.4 the two modes could
//    disagree about a node's centrality; they no longer can.
//  - Branching is guaranteed by tidy-tree construction, not coaxed out of tuned
//    forces and a hand-seeded angular spread. Sibling subtrees occupy contiguous
//    angular sectors by construction, so the branch read is structural.
//  - The cross-link web is contextual instead of constant: the hierarchy is the
//    always-on skeleton, and the prerequisite/related edges that are *not* already
//    a parent link render faint, coming up to full weight only for the selected
//    concept. The idle picture is the tree; the relationships are on demand.
//
// Determinism: the tidy tree is deterministic by construction (Reingold–Tilford
// over a fixed, course-ordered child list). There is no randomness anywhere in
// this module — no `Math.random`, no force jiggle — so the same corpus always
// settles into the same picture, run to run, server or client.
//
// `CENTER_SLUG` is retired: the centre is structural now (the hierarchy root),
// not an editorial pin.

/**
 * The hierarchy handed to the layout: exactly the Mode 2 tree (`getTree()` in
 * lib/content — built from the single `parent:` field, children course-ordered).
 * Only the slug structure is needed here; node display data comes from `graph`.
 * Passing the built tree rather than re-deriving one from flat parent pointers is
 * deliberate: Modes 2 and 3 must not build two hierarchies that could drift.
 */
export type NetworkTree = { slug: string; children: NetworkTree[] };

export type NetworkGeometry = {
  nodeHeight: number;
  fontSize: number; // must track --type-node-label-size
  padX: number; // pill edge → label
  padding: number; // canvas padding around the settled extent
  ringSpacing: number; // radius added per hierarchy depth
  sepGapArc: number; // separation: arc (px) wanted between adjacent pills
  closeGap: number; // radians left open so the first/last sector don't touch
};

/**
 * The design constants of this mode, v3 — in the same sense that row pitch and
 * column gap are the hierarchy's. They decide whether the graph reads as a clean
 * branching tree or a tangle, so they are named and recorded here rather than
 * buried in the layout call. (Geometry cannot live in tokens.css — it is JS the
 * layout consumes, not CSS — so it is centralised here and flagged in the report,
 * exactly as the hierarchy canvas does.)
 *
 * Settled against the real corpus: 53 nodes, hierarchy depths 0–3 (root
 * `sociology`; rings of 10 / 30 / 12 nodes). Placement uses d3-hierarchy's
 * radial `tree()` with a **width-aware separation** normalised to fill the
 * circle: adjacent pills are allotted angle in proportion to their own widths
 * (÷ depth, the standard radial move, so a fixed pill width maps to a constant
 * arc as the radius grows with depth). Wide sibling groups borrow angle from
 * sparse sectors, which is what lets the layout close cleanly.
 *
 * - `ringSpacing 600`: `ringRadius(depth) = depth × 600`. The binding ring is
 *   depth 2 (30 nodes, several with very wide titles): the full circle at that
 *   radius must hold ~6900px of pill width, which needs radius ≳ 1100, i.e.
 *   spacing ≳ 550. 600 clears every ring with comfortable breathing room (no
 *   pill pair closer than ~10px horizontally / ~12px vertically — verified pair
 *   by pair across the settled corpus). Tighter spacings leave the wide sibling
 *   groups overlapping; that they *cannot* fit closer is a property of the
 *   content shape (see the report's `parent:` findings), not a tuning miss.
 * - `sepGapArc 44`: the minimum arc a pill wants beyond half of each neighbour's
 *   width. Small enough that the tree still closes at spacing 600, large enough
 *   that abutting pills read as separate.
 * - `closeGap 0.06`: a sliver of angle left open at the 12-o'clock seam so the
 *   first and last top-level sectors don't collide across it.
 *
 * The settled extent is ~3584 × 3416 (radially symmetric by construction — a
 * near square, unlike 3.4's letterbox). See NetworkCanvas for the fit decision
 * this extent drives.
 */
export const NETWORK_GEOMETRY: NetworkGeometry = {
  nodeHeight: 40, // the tap target, desktop and mobile — as since 3.2
  fontSize: 13.5,
  padX: 14,
  padding: 80,
  ringSpacing: 600,
  sepGapArc: 44,
  closeGap: 0.06,
};

// 390px differs only in canvas padding. The graph's *shape* is deliberately
// identical across breakpoints: a deep link, a screenshot, or a remembered
// position has to mean the same thing on both, so the mobile adaptation lives in
// the initial view and the zoom, never in the layout.
export const MOBILE_NETWORK_GEOMETRY: NetworkGeometry = {
  ...NETWORK_GEOMETRY,
  padding: 40,
};

export type LaidNetworkNode = NetworkNodeData & {
  x: number; // centre (canvas coords)
  y: number; // centre
  width: number;
  height: number;
  depth: number; // hierarchy depth — the node's ring index
  angle: number; // radial angle (radians), for tree-edge paths
  radius: number; // distance from centre, = depth × ringSpacing
  parentSlug: string | null; // tree parent — for the path-to-centre highlight
};

// A tree (parent) edge: the structural skeleton, drawn as a radial bézier.
export type LaidTreeEdge = {
  childSlug: string;
  parentSlug: string;
  path: string; // SVG path data (radial cubic bézier)
};

// A cross-link (prerequisite or related) that is NOT already a parent edge —
// the contextual overlay. Endpoints are pill centres; the canvas trims them to
// the pill boundary at render time (as in 3.3).
export type LaidCrossEdge = NetworkEdgeData & {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type NetworkLayout = {
  nodes: LaidNetworkNode[];
  treeEdges: LaidTreeEdge[];
  crossEdges: LaidCrossEdge[];
  bySlug: Map<string, LaidNetworkNode>;
  // slug → tree-adjacent ∪ cross-adjacent neighbours (the keyboard grammar and
  // neighbour highlight both traverse this union; the tree alone would strand
  // keyboard users off the skeleton's cross-connections).
  adjacency: Map<string, string[]>;
  width: number;
  height: number;
  rootSlug: string; // the hierarchy root — the structural centre
  center: { x: number; y: number }; // its canvas position — the rings' origin
  ringRadii: number[]; // radius of each occupied ring, for the guide circles
};

function pillWidth(title: string, geom: NetworkGeometry): number {
  return geom.padX * 2 + estimateTextWidth(title, geom.fontSize);
}

/** Ring radius by hierarchy depth. The root sits at 0; every deeper ring is one
 *  `ringSpacing` further out. Depth is *declared* specialization now — the
 *  curated `parent:` chain — so a node's ring is a function of the hierarchy,
 *  the same source Mode 2 draws. */
function ringRadius(depth: number, geom: NetworkGeometry): number {
  return depth * geom.ringSpacing;
}

/** Undirected pair key, order-independent (mirrors graph.ts's private one). */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Point on the circle of the given radius at the given angle, offset to the
 *  canvas-space centre. Angle 0 is +x; the whole wheel is rotated by the layout
 *  so it reads the same every run (deterministic). */
function polar(
  cx: number,
  cy: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

/**
 * Radial cubic bézier from parent (inner) to child (outer), the d3 `linkRadial`
 * shape: hold the parent's angle out to the mid-radius, then sweep to the
 * child's angle. This is what gives the skeleton its branching curve rather than
 * a spider's straight spoke. Center-to-center — the pills paint over the ends,
 * exactly as the hierarchy's connectors tuck under their nodes.
 */
function radialLinkPath(
  cx: number,
  cy: number,
  parent: LaidNetworkNode,
  child: LaidNetworkNode
): string {
  const mid = (parent.radius + child.radius) / 2;
  const p0 = polar(cx, cy, parent.radius, parent.angle);
  const c1 = polar(cx, cy, mid, parent.angle);
  const c2 = polar(cx, cy, mid, child.angle);
  const p1 = polar(cx, cy, child.radius, child.angle);
  return `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p1.x} ${p1.y}`;
}

export function layoutNetwork(
  graph: GraphData,
  treeData: NetworkTree,
  geom: NetworkGeometry
): NetworkLayout {
  const dataBySlug = new Map(graph.nodes.map((n) => [n.slug, n]));
  const widthBySlug = new Map(
    graph.nodes.map((n) => [n.slug, pillWidth(n.title, geom)])
  );

  // Radial tidy layout. `size([2π − closeGap, 1])` normalises the angular extent
  // to (almost) a full turn regardless of the separation weights, so the circle
  // is filled cleanly with no wrap. The separation is width-aware: adjacent
  // pills are allotted angle in proportion to half of each pill's width plus a
  // gap, ÷ depth so the same width maps to a constant arc as the radius grows.
  // This is the rectangle-aware spacing that keeps wide pills at inner rings from
  // colliding; sparse sectors donate their slack to crowded ones.
  const h = hierarchy(treeData, (n) => n.children);
  // tree() mutates h in place and returns it typed as a positioned node (x/y
  // now set); capture that type so `n.x` is a number, not number | undefined.
  const laid = tree<NetworkTree>()
    .size([2 * Math.PI - geom.closeGap, 1])
    .separation((a, b) => {
      const wa = widthBySlug.get(a.data.slug) ?? 0;
      const wb = widthBySlug.get(b.data.slug) ?? 0;
      return ((wa + wb) / 2 + geom.sepGapArc) / a.depth;
    })(h);

  // Polar → cartesian around the origin. node.x is the angle; radius is derived
  // from hierarchy depth, not from d3's normalised y.
  type Placed = { slug: string; angle: number; radius: number; depth: number };
  const placed: Placed[] = [];
  const parentSlugBy = new Map<string, string | null>();
  laid.each((n) => {
    parentSlugBy.set(n.data.slug, n.parent ? n.parent.data.slug : null);
    placed.push({
      slug: n.data.slug,
      angle: n.x,
      radius: ringRadius(n.depth, geom),
      depth: n.depth,
    });
  });

  // Translate the wheel so its bounding box starts at `padding`. Everything
  // downstream — fit, deep links, keyboard panning — works in these canvas
  // coordinates, which are therefore always positive.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of placed) {
    const c = polar(0, 0, p.radius, p.angle);
    const w = widthBySlug.get(p.slug) ?? 0;
    minX = Math.min(minX, c.x - w / 2);
    maxX = Math.max(maxX, c.x + w / 2);
    minY = Math.min(minY, c.y - geom.nodeHeight / 2);
    maxY = Math.max(maxY, c.y + geom.nodeHeight / 2);
  }
  const dx = geom.padding - minX;
  const dy = geom.padding - minY;
  const cx = dx; // the origin (root) in canvas coords — the rings' centre
  const cy = dy;

  const nodes: LaidNetworkNode[] = placed.map((p) => {
    const c = polar(cx, cy, p.radius, p.angle);
    return {
      ...dataBySlug.get(p.slug)!,
      x: c.x,
      y: c.y,
      width: widthBySlug.get(p.slug) ?? 0,
      height: geom.nodeHeight,
      depth: p.depth,
      angle: p.angle,
      radius: p.radius,
      parentSlug: parentSlugBy.get(p.slug) ?? null,
    };
  });
  const bySlug = new Map(nodes.map((n) => [n.slug, n]));

  // Tree edges: one radial bézier per parent link — the always-on skeleton.
  const treePairs = new Set<string>();
  const treeEdges: LaidTreeEdge[] = [];
  for (const node of nodes) {
    if (!node.parentSlug) continue;
    const parent = bySlug.get(node.parentSlug);
    if (!parent) continue;
    treePairs.add(pairKey(node.slug, node.parentSlug));
    treeEdges.push({
      childSlug: node.slug,
      parentSlug: node.parentSlug,
      path: radialLinkPath(cx, cy, parent, node),
    });
  }

  // Cross-links: prerequisite/related edges that are NOT already a parent link.
  // The 40-odd prerequisites that coincide with a parent edge (the parent is
  // usually also a prerequisite) are already carried by the skeleton, so drawing
  // them again would only muddy it; the overlay is the genuinely non-hierarchical
  // web (currently 45 of 85 edges: 37 prerequisite, 8 related).
  const crossEdges: LaidCrossEdge[] = [];
  for (const e of graph.edges) {
    if (treePairs.has(pairKey(e.source, e.target))) continue;
    const a = bySlug.get(e.source);
    const b = bySlug.get(e.target);
    if (!a || !b) continue;
    crossEdges.push({ ...e, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }

  // Keyboard / highlight adjacency = tree parent-child ∪ every cross-link pair
  // (both kinds, direction ignored). Built from the cross-link adjacency plus the
  // tree links so arrow traversal can reach a node whose only connection is a
  // cross-link *or* whose only connection is the hierarchy.
  const adjacency = buildAdjacency(graph);
  const addAdj = (a: string, b: string) => {
    const la = adjacency.get(a);
    if (la && !la.includes(b)) la.push(b);
  };
  for (const node of nodes) {
    if (!node.parentSlug) continue;
    addAdj(node.slug, node.parentSlug);
    addAdj(node.parentSlug, node.slug);
  }

  // Occupied ring radii (depth ≥ 1), for the guide circles.
  const occupied = new Set<number>();
  for (const n of nodes) if (n.depth >= 1) occupied.add(n.radius);
  const ringRadii = [...occupied].sort((a, b) => a - b);

  return {
    nodes,
    treeEdges,
    crossEdges,
    bySlug,
    adjacency,
    width: maxX - minX + geom.padding * 2,
    height: maxY - minY + geom.padding * 2,
    rootSlug: treeData.slug,
    center: { x: cx, y: cy },
    ringRadii,
  };
}

/**
 * The chain of tree edges from a node up to the root, as undirected pair keys —
 * so the canvas can light the selected concept's path back to the centre in
 * `--color-edge-active`. Walks `parentSlug`; stops at the root (or a broken
 * chain, defensively).
 */
export function treePathToRoot(
  slug: string,
  bySlug: Map<string, LaidNetworkNode>
): Set<string> {
  const path = new Set<string>();
  let current: string | null = slug;
  const seen = new Set<string>();
  while (current) {
    if (seen.has(current)) break;
    seen.add(current);
    const node = bySlug.get(current);
    if (!node || !node.parentSlug) break;
    path.add(current < node.parentSlug ? `${current}|${node.parentSlug}` : `${node.parentSlug}|${current}`);
    current = node.parentSlug;
  }
  return path;
}

/** Undirected pair key for a tree edge, matching `treePathToRoot`'s. */
export function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Where an edge should stop so its arrowhead sits clear of the target pill
 * instead of under it: the point where the segment from (fromX, fromY) to the
 * node's centre crosses the node's box, pushed out by `gap`. (Unchanged from
 * 3.3 — used to trim the cross-link overlay.)
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
  const scale = Math.min(
    dx === 0 ? Infinity : halfW / Math.abs(dx),
    dy === 0 ? Infinity : halfH / Math.abs(dy)
  );
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}
