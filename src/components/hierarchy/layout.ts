import { hierarchy, tree } from "d3-hierarchy";

// Phase 3.2 — pure layout math for the hierarchy canvas. d3-hierarchy computes
// coordinates here; it never touches the DOM. React renders the result as SVG,
// so every visual value stays a CSS token and all three themes work untouched.
// (Canvas-based graph libraries would bypass tokens, theming, and focus
// semantics; this math/render split is reused by Mode 3 with d3-force.)

export type HierarchyNode = {
  slug: string;
  title: string;
  summary: string;
  difficulty: "intro" | "intermediate" | "advanced";
  status: "stub" | "draft" | "review" | "published";
  tags: string[];
  descendantCount: number;
  children: HierarchyNode[];
};

// Canvas geometry (px). These are layout inputs consumed by JS, not CSS —
// they cannot live in tokens.css, so they are centralized here and flagged
// in the phase report. Node *styling* (fills, strokes, radii, type) stays
// entirely in hierarchy-canvas.css via tokens.
export type CanvasGeometry = {
  rowPitch: number; // vertical distance between sibling row centers
  nodeHeight: number;
  colGap: number; // horizontal gap between a column's widest node and the next
  padding: number; // canvas padding around the tree extent
  fontSize: number; // node label size — must track --type-node-label-size
  badgeFontSize: number; // count badge — must track --type-caption-size
};

export const DESKTOP_GEOMETRY: CanvasGeometry = {
  rowPitch: 56,
  nodeHeight: 40,
  colGap: 88,
  padding: 40,
  fontSize: 13.5,
  badgeFontSize: 10,
};

// 390px pass: tighter pitch, same 40px+ tap height kept by nodeHeight.
export const MOBILE_GEOMETRY: CanvasGeometry = {
  rowPitch: 52,
  nodeHeight: 40,
  colGap: 44,
  padding: 20,
  fontSize: 13.5,
  badgeFontSize: 10,
};

// Inner metrics of a node pill, in px at the geometry font size.
const PAD_X = 14; // rect edge → content
const GLYPH_SPACE = 16; // leading −/+ toggle glyph column (branches)
const DOT_SPACE = 15; // paradigm dot + gap (leaves that carry paradigm/*)
const BADGE_GAP = 8; // label → count badge
const BADGE_PAD_X = 8;

export type LaidNode = {
  data: HierarchyNode;
  x: number; // left edge
  y: number; // top edge
  width: number;
  height: number;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  paradigm: string | null;
  badgeWidth: number; // 0 when no badge (expanded or leaf)
  // WAI-ARIA treeview attributes
  level: number;
  setsize: number;
  posinset: number;
  parentSlug: string | null;
};

export type LaidEdge = {
  childSlug: string;
  parentSlug: string;
  path: string; // SVG bézier path data
};

export type CanvasLayout = {
  nodes: LaidNode[]; // pre-order — this is the treeview's visible-row order
  edges: LaidEdge[];
  width: number;
  height: number;
};

export function paradigmOf(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("paradigm/"));
  return tag ? tag.slice("paradigm/".length) : null;
}

// Serif label width estimate. SVG text can't be measured server-side and the
// design wants content-sized pills (per the hi-fi), so widths come from a
// per-character-class estimate with a small safety margin. A slightly generous
// pill is invisible; a clipped label would not be.
// Exported since 3.3: the network canvas sizes the same serif pills at the same
// token size, so it must estimate identically — two copies would drift.
export function estimateTextWidth(text: string, fontSize: number): number {
  let units = 0;
  for (const ch of text) {
    if (/[iljft.,;:'’()| !\-]/.test(ch) || ch === " ") units += 0.34;
    else if (/[mwMW]/.test(ch)) units += 0.95;
    else if (/[A-Z0-9]/.test(ch)) units += 0.74;
    else units += 0.54;
  }
  return units * fontSize * 1.06;
}

function nodeWidth(
  node: HierarchyNode,
  expanded: boolean,
  geom: CanvasGeometry
): { width: number; badgeWidth: number } {
  const hasChildren = node.children.length > 0;
  let width = PAD_X * 2 + estimateTextWidth(node.title, geom.fontSize);
  // Leading affordances (per the hi-fi): expanded branches carry the "−"
  // glyph; collapsed branches show only the trailing badge; paradigm leaves
  // carry the dot.
  if (hasChildren && expanded) width += GLYPH_SPACE;
  else if (!hasChildren && paradigmOf(node.tags)) width += DOT_SPACE;
  let badgeWidth = 0;
  if (hasChildren && !expanded) {
    badgeWidth =
      BADGE_PAD_X * 2 +
      estimateTextWidth(`+${node.descendantCount}`, geom.badgeFontSize);
    width += BADGE_GAP + badgeWidth;
  }
  return { width, badgeWidth };
}

// Content tree + collapsed ids → positioned nodes and edge paths.
// Orientation matches the hi-fi: root at the left, depth growing rightward,
// siblings stacked vertically by the tidy layout.
export function layoutTree(
  root: HierarchyNode,
  collapsed: Set<string>,
  geom: CanvasGeometry
): CanvasLayout {
  // Collapsed branches contribute no children — d3 only ever sees the
  // visible tree, so hidden subtrees cost nothing at layout time.
  const h = hierarchy(root, (n) =>
    collapsed.has(n.slug) ? undefined : n.children
  );
  // nodeSize: [vertical pitch, depth placeholder] — horizontal position is
  // recomputed below from per-depth column widths (pills are content-sized,
  // so fixed depth spacing would either waste space or overlap).
  tree<HierarchyNode>().nodeSize([geom.rowPitch, 1])(h);

  const ordered: import("d3-hierarchy").HierarchyPointNode<HierarchyNode>[] =
    [];
  h.eachBefore((n) => ordered.push(n as (typeof ordered)[number]));

  // Per-depth column width = widest pill at that depth.
  const colWidth: number[] = [];
  const sized = new Map<string, { width: number; badgeWidth: number }>();
  for (const n of ordered) {
    const expanded = n.data.children.length > 0 && !collapsed.has(n.data.slug);
    const s = nodeWidth(n.data, expanded, geom);
    sized.set(n.data.slug, s);
    colWidth[n.depth] = Math.max(colWidth[n.depth] ?? 0, s.width);
  }
  const colX: number[] = [];
  for (let d = 0; d < colWidth.length; d++) {
    colX[d] = d === 0 ? geom.padding : colX[d - 1] + colWidth[d - 1] + geom.colGap;
  }

  const minRow = Math.min(...ordered.map((n) => n.x));

  const nodes: LaidNode[] = ordered.map((n) => {
    const { width, badgeWidth } = sized.get(n.data.slug)!;
    const siblings = n.parent ? n.parent.children! : [n];
    return {
      data: n.data,
      x: colX[n.depth],
      y: n.x - minRow + geom.padding,
      width,
      height: geom.nodeHeight,
      depth: n.depth,
      hasChildren: n.data.children.length > 0,
      expanded: n.data.children.length > 0 && !collapsed.has(n.data.slug),
      paradigm: paradigmOf(n.data.tags),
      badgeWidth,
      level: n.depth + 1,
      setsize: siblings.length,
      posinset: siblings.indexOf(n) + 1,
      parentSlug: n.parent ? n.parent.data.slug : null,
    };
  });

  const bySlug = new Map(nodes.map((n) => [n.data.slug, n]));
  const edges: LaidEdge[] = [];
  for (const node of nodes) {
    if (!node.parentSlug) continue;
    const parent = bySlug.get(node.parentSlug)!;
    const x0 = parent.x + parent.width;
    const y0 = parent.y + parent.height / 2;
    const x1 = node.x;
    const y1 = node.y + node.height / 2;
    const mid = (x1 - x0) / 2;
    edges.push({
      childSlug: node.data.slug,
      parentSlug: node.parentSlug,
      path: `M ${x0} ${y0} C ${x0 + mid} ${y0}, ${x1 - mid} ${y1}, ${x1} ${y1}`,
    });
  }

  const width =
    Math.max(...nodes.map((n) => n.x + n.width)) + geom.padding;
  const height =
    Math.max(...nodes.map((n) => n.y + n.height)) + geom.padding;

  return { nodes, edges, width, height };
}

// Slugs from root to `target` inclusive, or null if absent (deep links).
export function findPath(
  node: HierarchyNode,
  target: string
): string[] | null {
  if (node.slug === target) return [node.slug];
  for (const child of node.children) {
    const path = findPath(child, target);
    if (path) return [node.slug, ...path];
  }
  return null;
}

// Every slug with children — the collapse-state universe.
export function collectBranches(node: HierarchyNode, into: string[]): string[] {
  if (node.children.length > 0) {
    into.push(node.slug);
    node.children.forEach((child) => collectBranches(child, into));
  }
  return into;
}
