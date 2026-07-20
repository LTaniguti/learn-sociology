"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import PreviewCard from "../preview/PreviewCard";
import { type GraphData } from "./graph";
import {
  MOBILE_NETWORK_GEOMETRY,
  NETWORK_GEOMETRY,
  edgeKey,
  layoutNetwork,
  treePathToRoot,
  trimToPill,
  type LaidCrossEdge,
  type LaidNetworkNode,
  type NetworkTree,
} from "./layout";

// Phase 3.5 — Mode 3's concept network, now a radial tidy tree of the Mode 2
// hierarchy with a quiet cross-link overlay.
//
// Same split as every canvas since 3.2, one layer deeper: layout.ts computes
// coordinates (from the hierarchy tree) and d3-zoom computes the view transform,
// but **neither touches the DOM**. The zoom behaviour writes its transform into
// React state, which renders as a single <g transform>. React owns every pixel,
// so nodes stay real SVG elements with tokens, themes, and focus semantics.
//
// Two edge layers now. The **tree edges** (parent links) are the always-on
// structural skeleton, at full weight. The **cross-links** (prerequisite/related
// edges that are not already parent links) are faint by default and come forward
// only for the selected concept — the web is contextual, not constant. Amber
// discipline holds: selecting a node lights its relationships in normal ink and
// its lineage back to the centre in --color-edge-active; the legend and controls
// stay muted.
//
// Design authority: no hi-fi exists for this mode. The visual language is the
// shipped hierarchy canvas's; everything new is improvised from direction.md and
// recorded in components.md.

const CARD_GAP = 14; // node edge → preview card (px, screen space)
const EDGE_GAP = 5; // pill edge → where an edge stops (canvas units)
const MIN_SCALE = 0.15;
const MAX_SCALE = 2.6;
const ZOOM_STEP = 1.4; // per button press / keypress

// The floor under which the fit view stops being worth showing. This is not a
// label-legibility threshold — at fit, titles are meant to be small and the
// *shape* is the information; you zoom to read. It is the point where the
// pills stop reading as pills at all: below ~0.4 a 150px node is under 60px
// wide, and 53 of them are slivers. `fit` is the initial view everywhere
// above this; below it the view falls back to the hub. See `initialTransform`.
const MIN_FIT_SCALE = 0.4;

type Transform = { k: number; x: number; y: number };

/**
 * Mount gate. The force layout runs **client-side only**, and this component
 * exists to guarantee that.
 *
 * Settling on the server too would be the obvious optimisation, and it is a
 * trap: the settled coordinates would have to match the client's to the last
 * float or React reports a hydration mismatch, and `Math.cos`/`Math.sin` are
 * not required by ECMAScript to be correctly rounded — Node and the browser
 * may legitimately disagree in the last bits, which the phyllotaxis seeding
 * and 300 ticks then amplify. (This was not theoretical: the first cut
 * rendered on both sides and hydration failed on edge coordinates.)
 *
 * So the server ships the chrome — viewport, zoom controls, legend, footnote —
 * and the graph itself appears on mount. At ~30ms it is not a perceptible
 * flash, and the static export stays clean of 53 nodes of coordinates.
 */
export default function NetworkCanvas({
  graph,
  tree,
}: {
  graph: GraphData;
  tree: NetworkTree;
}) {
  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const apply = () => setMobile(query.matches);
    apply();
    // The mount flag IS the mechanism here, not an avoidable cascade: this
    // render is what moves the graph off the server. Same justification as the
    // device-local reads in ThemeControl / Syllabus / NodeRail.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  if (!mounted) {
    return (
      <div className="network-view">
        <div className="network-viewport" aria-busy="true" />
        <NetworkNote />
      </div>
    );
  }
  return <NetworkGraph graph={graph} tree={tree} mobile={mobile} />;
}

function NetworkNote() {
  return (
    <p className="network-note">
      The rings are the <strong>hierarchy</strong> — each concept&rsquo;s{" "}
      <code>parent</code>, the same structure as the Hierarchy view — drawn
      outward by specialization depth. <strong>Prerequisite</strong> and{" "}
      <strong>related</strong> links that aren&rsquo;t already parent links show
      faint, and come forward for a concept when you select it. Shared tags are
      deliberately not drawn.
    </p>
  );
}

function NetworkGraph({
  graph,
  tree,
  mobile,
}: {
  graph: GraphData;
  tree: NetworkTree;
  mobile: boolean;
}) {
  const [transform, setTransform] = useState<Transform>({ k: 1, x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(
    null
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const didInitialView = useRef(false);

  const geometry = mobile ? MOBILE_NETWORK_GEOMETRY : NETWORK_GEOMETRY;
  const layout = useMemo(
    () => layoutNetwork(graph, tree, geometry),
    [graph, tree, geometry]
  );
  // Keyboard traversal and neighbour highlight both walk the union of tree edges
  // and cross-links (computed in the layout) — the tree alone would strand
  // keyboard users off the skeleton's cross-connections.
  const adjacency = layout.adjacency;

  // The hierarchy root is the structural centre of the map. Home targets it, it
  // is the fallback initial view, and it is where keyboard focus starts.
  const centerSlug = layout.rootSlug;

  const clampScale = (k: number) =>
    Math.max(MIN_SCALE, Math.min(MAX_SCALE, k));

  // The transform that fits the whole graph in the viewport.
  const fitTransform = useCallback((): Transform => {
    const viewport = viewportRef.current;
    if (!viewport) return { k: 1, x: 0, y: 0 };
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const k = clampScale(Math.min(vw / layout.width, vh / layout.height));
    return {
      k,
      x: (vw - layout.width * k) / 2,
      y: (vh - layout.height * k) / 2,
    };
  }, [layout]);

  // Centre one node at a given scale.
  const centerOn = useCallback(
    (node: LaidNetworkNode, k: number): Transform => {
      const viewport = viewportRef.current;
      if (!viewport) return { k, x: 0, y: 0 };
      return {
        k,
        x: viewport.clientWidth / 2 - node.x * k,
        y: viewport.clientHeight / 2 - node.y * k,
      };
    },
    []
  );

  // Fallback initial view: frame the **core neighbourhood** — the root plus all
  // depth-1 concepts — filling the short viewport dimension. Used when the
  // whole-graph fit falls below MIN_FIT_SCALE (the 390px case, and small desktop
  // viewports). The learner starts on the centre and its ten specializations,
  // legible, rather than one pill in emptiness; full `fit` is one button away.
  // Deterministic — same subset, same box, every run.
  const fitToCoreTransform = useCallback((): Transform => {
    const viewport = viewportRef.current;
    if (!viewport) return { k: 1, x: 0, y: 0 };
    const core = layout.nodes.filter((n) => n.depth <= 1);
    if (core.length === 0) return fitTransform();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of core) {
      minX = Math.min(minX, n.x - n.width / 2);
      maxX = Math.max(maxX, n.x + n.width / 2);
      minY = Math.min(minY, n.y - n.height / 2);
      maxY = Math.max(maxY, n.y + n.height / 2);
    }
    const pad = geometry.padding;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const k = clampScale(Math.min(vw / w, vh / h));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { k, x: vw / 2 - cx * k, y: vh / 2 - cy * k };
  }, [layout, fitTransform, geometry]);

  /**
   * Initial view. `fit` is the intent — seeing the whole territory is the
   * point of this mode, and small labels at the overview are a feature, not a
   * defect: you read the shape, then zoom for the names.
   *
   * The exception is where the whole graph fits below the floor and the pills
   * collapse into slivers — that is a picture of a network, not a view of one.
   * There the initial view falls back to `fitToCoreTransform`: the root plus its
   * ten depth-1 specializations, framed to fill the viewport, so 390px opens on
   * the core neighbourhood rather than one pill in a void. `fit` is one button
   * away. (Which case applies at each breakpoint is recorded in components.md.)
   */
  const initialTransform = useCallback((): Transform => {
    const fit = fitTransform();
    if (fit.k >= MIN_FIT_SCALE) return fit;
    return fitToCoreTransform();
  }, [fitTransform, fitToCoreTransform]);

  // Push a transform through the zoom behaviour rather than to state directly,
  // so d3's internal transform never drifts from what is rendered — otherwise
  // the next wheel gesture would jump back to d3's stale value.
  const applyTransform = useCallback((next: Transform) => {
    const svg = svgRef.current;
    const behaviour = zoomRef.current;
    if (!svg || !behaviour) {
      // The zoom behaviour is registered in a layout effect that runs *before*
      // the initial-view layout effect (see below), so it is present by the
      // time any transform is applied. Writing to React state here instead —
      // the old silent fallback — would leave d3's internal __zoom at identity
      // while the render moved, and the first gesture would snap the view back:
      // the 3.5 first-scroll teleport. Fail loudly rather than desync quietly.
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "NetworkCanvas: applyTransform called before the d3-zoom behaviour " +
            "was registered — the internal transform would desync. This is a bug."
        );
      }
      return;
    }
    select(svg).call(
      behaviour.transform,
      zoomIdentity.translate(next.x, next.y).scale(next.k)
    );
  }, []);

  // d3-zoom as the gesture math only: wheel, pinch, and drag land here and are
  // written into React state. No d3 transitions anywhere — every zoom change
  // is instantaneous, which is also why prefers-reduced-motion has nothing to
  // suppress on this canvas.
  //
  // This MUST be a layout effect declared **before** the initial-view layout
  // effect: layout effects run in declaration order, and on mount the initial
  // view calls `applyTransform`, which needs `zoomRef.current` already set so it
  // can seed d3's internal __zoom to match. As a plain passive effect (the 3.5
  // shape) it ran *after* the layout effects, so the initial view hit the silent
  // fallback and d3 stayed at identity — the teleport. DOM-ref work only, no
  // paint dependency, so a layout effect is safe here.
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behaviour = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .on("zoom", (event) => {
        const t = event.transform;
        setTransform({ k: t.k, x: t.x, y: t.y });
      });
    const selection = select(svg);
    selection.call(behaviour);
    // Double-click zoom fights node activation — a double-click on a node
    // would preview it and then zoom the canvas out from under the card.
    selection.on("dblclick.zoom", null);
    zoomRef.current = behaviour;
    return () => {
      selection.on(".zoom", null);
      zoomRef.current = null;
    };
  }, []);

  // Initial view, once the viewport has been measured. Re-run when the
  // breakpoint flips, since the layout padding and the fit both change.
  useLayoutEffect(() => {
    didInitialView.current = false;
  }, [mobile]);

  useLayoutEffect(() => {
    if (didInitialView.current) return;
    if (!viewportRef.current?.clientWidth) return;
    didInitialView.current = true;
    applyTransform(initialTransform());
  }, [initialTransform, applyTransform, layout]);

  const zoomBy = useCallback(
    (factor: number) => {
      const svg = svgRef.current;
      const behaviour = zoomRef.current;
      if (!svg || !behaviour) return;
      select(svg).call(behaviour.scaleBy, factor);
    },
    []
  );

  const fit = useCallback(
    () => applyTransform(fitTransform()),
    [applyTransform, fitTransform]
  );

  // Deep link: /network#slug centres and previews the node — parity with the
  // hierarchy's hash behaviour. Mount-only; unknown hashes are ignored.
  useEffect(() => {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    if (!slug) return;
    const node = layout.bySlug.get(slug);
    if (!node) return;
    didInitialView.current = true; // the hash owns the initial view
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(slug);
    setFocused(slug);
    applyTransform(centerOn(node, 1));
    // Mount-only by design: a later hash change is a navigation, not a state
    // update this canvas should chase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const selectedNode = selected ? layout.bySlug.get(selected) : undefined;

  // Neighbours of the selection: their pills take the hover surface, and their
  // shared edges go active. This is the graph's answer to the hierarchy's
  // ancestor path — the local neighbourhood is what "where am I" means here.
  const neighbours = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(adjacency.get(selected) ?? []);
  }, [selected, adjacency]);

  // The selected concept's lineage: the tree edges from it back to the centre,
  // as undirected pair keys. These light in --color-edge-active — the one amber
  // wayfinding moment, the radial equivalent of the hierarchy's ancestor path.
  const selectedPath = useMemo(
    () => (selected ? treePathToRoot(selected, layout.bySlug) : new Set<string>()),
    [selected, layout]
  );

  // Dismiss on Esc / outside click.
  //
  // The outside test is made on the event target, NOT by having the node's own
  // handler call stopPropagation. Under the App Router React's root container
  // is `document` itself, so React's delegated listener and this one sit on
  // the same node: `stopPropagation` does not stop a same-target listener
  // (only `stopImmediatePropagation` would), and this handler ran anyway. The
  // symptom was that clicking a second node closed the card instead of moving
  // the selection to it — every node-to-node hop cost two clicks.
  useEffect(() => {
    if (!selected) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest(".nwnode, .hcard")) {
        return; // a node or the card itself — not an outside click
      }
      setSelected(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  // Anchor the card beside the selected node in *screen* space. Unlike the
  // hierarchy (which scrolls, so canvas coordinates are enough), this canvas
  // zooms, so the node's on-screen box has to be derived from the transform.
  useLayoutEffect(() => {
    if (!selectedNode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCardPos(null);
      return;
    }
    const viewport = viewportRef.current;
    const card = cardRef.current;
    if (!viewport || !card) return;
    const cardW = card.offsetWidth;
    const cardH = card.offsetHeight;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const cx = selectedNode.x * transform.k + transform.x;
    const cy = selectedNode.y * transform.k + transform.y;
    const halfW = (selectedNode.width / 2) * transform.k;
    const halfH = (selectedNode.height / 2) * transform.k;

    // Right of the node by default, flipping left when it would overflow.
    let left = cx + halfW + CARD_GAP;
    if (left + cardW > vw) left = cx - halfW - CARD_GAP - cardW;
    left = Math.max(0, Math.min(left, vw - cardW));
    let top = cy - halfH;
    top = Math.max(0, Math.min(top, vh - cardH));
    setCardPos({ left, top });
  }, [selectedNode, transform]);

  /**
   * Arrow-key movement: **adjacency first, geometry only to disambiguate.**
   *
   * No WAI-ARIA pattern fits a graph — a grid walk would step onto nodes that
   * are near but unrelated, which is exactly the claim the graph exists to
   * deny. So arrows only ever traverse real edges. Among a node's neighbours,
   * the one nearest the pressed direction wins: candidates inside a 90° cone
   * around that axis, nearest first; if the cone is empty, any neighbour on
   * the correct side of the axis, best-aligned first. A node with no
   * neighbour in that direction simply does not move.
   */
  const step = useCallback(
    (from: string, dx: number, dy: number): string | null => {
      const origin = layout.bySlug.get(from);
      if (!origin) return null;
      const candidates = (adjacency.get(from) ?? [])
        .map((slug) => layout.bySlug.get(slug))
        .filter((n): n is LaidNetworkNode => Boolean(n))
        .map((n) => {
          const vx = n.x - origin.x;
          const vy = n.y - origin.y;
          const along = vx * dx + vy * dy; // projection onto the direction
          const across = Math.abs(vx * dy - vy * dx); // perpendicular distance
          return { slug: n.slug, along, across, dist: Math.hypot(vx, vy) };
        })
        .filter((c) => c.along > 0);
      if (candidates.length === 0) return null;
      const inCone = candidates.filter((c) => c.across <= c.along);
      const pool = inCone.length > 0 ? inCone : candidates;
      pool.sort((a, b) =>
        inCone.length > 0
          ? a.dist - b.dist
          : b.along / b.dist - a.along / a.dist
      );
      return pool[0].slug;
    },
    [layout, adjacency]
  );

  // Keep the focused node on screen after a keyboard move: pan only, never
  // zoom, and only when it has actually left the viewport.
  const panIntoView = useCallback(
    (slug: string) => {
      const node = layout.bySlug.get(slug);
      const viewport = viewportRef.current;
      if (!node || !viewport) return;
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const cx = node.x * transform.k + transform.x;
      const cy = node.y * transform.k + transform.y;
      const margin = 80;
      let { x, y } = transform;
      if (cx < margin) x += margin - cx;
      else if (cx > vw - margin) x -= cx - (vw - margin);
      if (cy < margin) y += margin - cy;
      else if (cy > vh - margin) y -= cy - (vh - margin);
      if (x !== transform.x || y !== transform.y) {
        applyTransform({ k: transform.k, x, y });
      }
    },
    [layout, transform, applyTransform]
  );

  const moveFocus = useCallback(
    (slug: string | null) => {
      if (!slug) return;
      setFocused(slug);
      panIntoView(slug);
    },
    [panIntoView]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const current = focused ?? centerSlug;
    switch (e.key) {
      case "ArrowRight":
        moveFocus(step(current, 1, 0));
        break;
      case "ArrowLeft":
        moveFocus(step(current, -1, 0));
        break;
      case "ArrowDown":
        moveFocus(step(current, 0, 1));
        break;
      case "ArrowUp":
        moveFocus(step(current, 0, -1));
        break;
      case "Home":
        // No End: a graph has no last node, and inventing one (outermost ring?
        // alphabetically last?) would be a key that means nothing. Home is
        // meaningful because the radial tree gives it a literal target — the
        // hierarchy root at the centre of the map. (The root is focusable
        // content, so Home lands on it directly; no hub special-case is needed.)
        moveFocus(centerSlug);
        break;
      case "Enter":
      case " ":
        setSelected(selected === current ? null : current);
        setFocused(current);
        break;
      case "+":
      case "=":
        zoomBy(ZOOM_STEP);
        break;
      case "-":
        zoomBy(1 / ZOOM_STEP);
        break;
      case "0":
        fit();
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  // A cross-link is active when it is incident to the selected concept.
  const crossActive = (edge: LaidCrossEdge) =>
    selected !== null && (edge.source === selected || edge.target === selected);

  // Tree edge — the structural skeleton, a radial bézier. Full --color-edge
  // weight; the selected concept's path back to the centre goes amber.
  const renderTreeEdge = (edge: (typeof layout.treeEdges)[number]) => {
    const onPath = selectedPath.has(edgeKey(edge.parentSlug, edge.childSlug));
    return (
      <path
        key={`${edge.parentSlug}-${edge.childSlug}`}
        className={onPath ? "nwtree-edge nwtree-edge-active" : "nwtree-edge"}
        d={edge.path}
      />
    );
  };

  // Cross-link — a prerequisite/related edge that is not already a parent link.
  // Faint by default (no arrowhead at whisper weight — markers read as dirt);
  // full 3.3 treatment when incident to the selection (arrowhead on
  // prerequisites, the lighter related weight).
  const renderCrossEdge = (edge: LaidCrossEdge, index: number) => {
    const source = layout.bySlug.get(edge.source)!;
    const target = layout.bySlug.get(edge.target)!;
    // Trim both ends to the pill boundary: the tail so the line does not emerge
    // from under a label, the head so the arrow marker is visible.
    const a = trimToPill(target.x, target.y, source, EDGE_GAP);
    const b = trimToPill(source.x, source.y, target, EDGE_GAP);
    const active = crossActive(edge);
    const classes = active
      ? `nwcross nwcross-${edge.kind}`
      : "nwcross nwcross-faint";
    return (
      <line
        key={`${edge.source}-${edge.target}-${index}`}
        className={classes}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        markerEnd={
          active && edge.kind === "prerequisite" ? "url(#nw-arrow)" : undefined
        }
      />
    );
  };

  const renderNode = (node: LaidNetworkNode) => {
    const isSelected = selected === node.slug;
    const classes = [
      "nwnode",
      node.status !== "published" && "nwnode-unpublished",
      isSelected && "nwnode-selected",
      focused === node.slug && "nwnode-focused",
      neighbours.has(node.slug) && "nwnode-neighbour",
      node.paradigm && `nwnode-paradigm-${node.paradigm}`,
    ]
      .filter(Boolean)
      .join(" ");
    const degreeLabel =
      node.degree === 1 ? "1 connection" : `${node.degree} connections`;
    return (
      <g
        key={node.slug}
        id={`nwnode-${node.slug}`}
        className={classes}
        role="img"
        aria-label={`${node.title}, ${node.status}, ${degreeLabel}`}
        transform={`translate(${node.x - node.width / 2}, ${
          node.y - node.height / 2
        })`}
        onClick={(e) => {
          e.stopPropagation();
          setFocused(node.slug);
          setSelected(isSelected ? null : node.slug);
        }}
      >
        <rect className="nwnode-box" width={node.width} height={node.height} />
        {node.paradigm && (
          <circle className="nwnode-dot" cx={15} cy={node.height / 2} r={3.5} />
        )}
        {/* One or two lines (v4). A wrapped title is two <tspan>s centred on the
            pill's midline, each carrying the same x so the second line does not
            inherit the first's advance. Single-line pills render exactly as
            before. */}
        <text
          className="nwnode-label"
          x={node.paradigm ? 27 : 14}
          y={node.height / 2}
        >
          {node.lines.length === 1
            ? node.lines[0]
            : node.lines.map((line, i) => (
                <tspan
                  key={i}
                  x={node.paradigm ? 27 : 14}
                  dy={i === 0 ? -geometry.lineAdvance / 2 : geometry.lineAdvance}
                >
                  {line}
                </tspan>
              ))}
        </text>
      </g>
    );
  };

  return (
    <div className="network-view">
      <div className="network-viewport" ref={viewportRef}>
        <svg
          ref={svgRef}
          className="network-svg"
          // No ARIA graph role exists, and treeitem semantics would lie about
          // the structure. `application` tells assistive tech to pass keys
          // through to the grammar described in the label; aria-activedescendant
          // reports which node the arrows are currently on.
          role="application"
          tabIndex={0}
          aria-label={
            "Concept network, arranged as a radial tree in rings by " +
            "specialization depth from the central concept. Arrow keys move " +
            "between connected concepts, Home jumps to the central concept, " +
            "Enter opens a preview, Escape closes it. Plus and minus zoom, 0 " +
            "fits the whole graph."
          }
          aria-activedescendant={focused ? `nwnode-${focused}` : undefined}
          onKeyDown={onKeyDown}
        >
          <defs>
            {/* userSpaceOnUse: the default (strokeWidth) would scale the
                arrowhead to a 1px stroke and render it invisible. Only one
                marker now — arrowheads appear solely on an *active* (selected)
                prerequisite cross-link, so it uses the normal edge ink. */}
            <marker
              id="nw-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="8"
              markerHeight="8"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path className="nwarrow" d="M0,0 L8,4 L0,8 Z" />
            </marker>
          </defs>
          {/* The single transformed group — this is where d3-zoom's output
              lands, and the only thing that moves. `has-selection` lets the CSS
              dim the idle skeleton under a selection so the lit edges pop. */}
          <g
            className={
              selected ? "network-canvas-group has-selection" : "network-canvas-group"
            }
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
          >
            {/* Ring guides: muted dashed circles at each occupied ring radius,
                now at hierarchy depths. Wayfinding furniture that sits far
                behind the graph. Distinct from the non-published dash — see
                .nwring-guide. */}
            <g className="nwring-guides" aria-hidden="true">
              {layout.ringRadii.map((r) => (
                <circle
                  key={r}
                  className="nwring-guide"
                  cx={layout.center.x}
                  cy={layout.center.y}
                  r={r}
                />
              ))}
            </g>
            {/* Paint order carries the emphasis: faint idle relationships sit
                behind the skeleton; the tree skeleton (incl. the amber path to
                the centre) draws over them; the selected concept's own
                relationships come up on top. Nodes paint last, over every edge
                end. */}
            <g aria-hidden="true">
              {layout.crossEdges
                .filter((e) => !crossActive(e))
                .map(renderCrossEdge)}
            </g>
            <g aria-hidden="true">{layout.treeEdges.map(renderTreeEdge)}</g>
            <g aria-hidden="true">
              {layout.crossEdges
                .filter((e) => crossActive(e))
                .map(renderCrossEdge)}
            </g>
            {layout.nodes.map(renderNode)}
          </g>
        </svg>

        {/* Zoom controls — the accessibility floor. Zoom must never require a
            wheel or a trackpad, on desktop or touch. */}
        <div className="network-zoom">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomBy(ZOOM_STEP)}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomBy(1 / ZOOM_STEP)}
          >
            −
          </button>
          <button type="button" aria-label="Fit whole graph" onClick={fit}>
            fit
          </button>
        </div>

        {/* Legend. Muted mono in the corner: it explains the picture, it is
            not part of it, so it takes no amber. */}
        <dl className="network-legend">
          <div>
            <dt>
              <svg viewBox="0 0 34 8" aria-hidden="true">
                <path className="nwring-guide" d="M0,4 h34" fill="none" />
              </svg>
            </dt>
            <dd>rings = specialization depth</dd>
          </div>
          <div>
            <dt>
              <svg viewBox="0 0 34 8" aria-hidden="true">
                <path className="nwtree-edge" d="M0,7 C 12,7 22,1 34,1" />
              </svg>
            </dt>
            <dd>hierarchy</dd>
          </div>
          <div>
            <dt>
              <svg viewBox="0 0 34 8" aria-hidden="true">
                <line className="nwcross nwcross-faint" x1="0" y1="4" x2="34" y2="4" />
              </svg>
            </dt>
            <dd>relationship (shown on select)</dd>
          </div>
          <div>
            <dt>
              <svg viewBox="0 0 34 14" aria-hidden="true">
                <rect
                  className="nwnode-box nwnode-legend-dashed"
                  x="1"
                  y="1"
                  width="32"
                  height="12"
                />
              </svg>
            </dt>
            <dd>not yet published</dd>
          </div>
        </dl>

        {selectedNode && (
          <PreviewCard
            data={selectedNode}
            cardRef={cardRef}
            style={
              cardPos
                ? { left: cardPos.left, top: cardPos.top }
                : { left: 0, top: 0, visibility: "hidden" }
            }
          />
        )}
      </div>
      <NetworkNote />
    </div>
  );
}
