import Link from "next/link";
import { buildGraph, type GraphInput } from "@/components/network/graph";
import {
  layoutNetwork,
  NETWORK_GEOMETRY,
  type NetworkTree,
} from "@/components/network/layout";

// Homepage hero snapshot (Phase 5.0) — the real concept network at build time.
//
// Reuses `layoutNetwork()` with the same inputs the /network page assembles
// (import only — no modification to layout.ts or either shipped canvas), and
// renders the settled geometry as a static inline SVG: edges as hairline
// strokes, nodes as small dots, no labels, the full graph extent fit into the
// frame. The "very zoomed-out" view.
//
// Determinism: `layoutNetwork` is deterministic by construction (Reingold–
// Tilford over a course-ordered child list, no randomness anywhere), so the
// emitted markup is identical across builds and reloads. Nothing random is
// introduced on top — the mockup's seeded jitter is exactly what was not
// ported.
//
// This is a server component: the layout runs once at build time and ships as
// markup. No d3 on the client, no zoom behaviour, no client JS.

// Dot radius in canvas user units. The settled extent (~3153 × 2903) scales
// into a ~500px frame at ~0.16, so 20 user units renders as a ~3px dot — the
// zoomed-out register where the shape reads and the labels don't exist.
const DOT_RADIUS = 20;

export default function NetworkSnapshot({
  input,
  tree,
}: {
  input: GraphInput[];
  tree: NetworkTree;
}) {
  const layout = layoutNetwork(buildGraph(input), tree, NETWORK_GEOMETRY);
  return (
    // The entire framed panel is one link into the network view; the SVG
    // internals are presentation only (aria-hidden), so the link reads as a
    // single "Explore the concept network" affordance.
    <Link
      href="/network"
      className="home-snapshot"
      aria-label="Explore the concept network"
    >
      <svg
        className="home-snapshot-svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        aria-hidden="true"
        focusable="false"
      >
        {/* Edges first, dots painted over them. Hairlines stay 1px on screen
            regardless of the viewBox scale via non-scaling stroke. */}
        <g className="home-snapshot-edges">
          {layout.treeEdges.map((e) => (
            <path
              key={`${e.parentSlug}|${e.childSlug}`}
              className="home-snapshot-tree-edge"
              d={e.path}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {layout.crossEdges.map((e) => (
            <line
              key={`${e.source}|${e.target}`}
              className="home-snapshot-cross-edge"
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <g>
          {/* Dot colour = the hierarchy tree's paradigm→dot mapping: tagged
              nodes take their --paradigm-* token, everything else the same
              neutral the tree's untagged leaves use (see home.css). */}
          {layout.nodes.map((n) => (
            <circle
              key={n.slug}
              className={
                n.paradigm
                  ? `home-snapshot-dot home-snapshot-dot-${n.paradigm}`
                  : "home-snapshot-dot"
              }
              cx={n.x}
              cy={n.y}
              r={DOT_RADIUS}
            />
          ))}
        </g>
      </svg>
    </Link>
  );
}
