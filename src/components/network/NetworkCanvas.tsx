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
import { buildAdjacency, type GraphData } from "./graph";
import {
  MOBILE_NETWORK_FORCES,
  NETWORK_FORCES,
  layoutNetwork,
  trimToPill,
  type LaidNetworkNode,
} from "./layout";

// Phase 3.3 — Mode 3's concept network.
//
// Same split as 3.2, one layer deeper: d3-force computes coordinates
// (layout.ts) and d3-zoom computes the view transform, but **neither touches
// the DOM**. The zoom behaviour writes its transform into React state, which
// renders as a single <g transform>. React owns every pixel, so nodes stay
// real SVG elements with tokens, themes, and focus semantics intact.
//
// Design authority: no hi-fi exists for this mode. The visual language is the
// shipped hierarchy canvas's (node pills, edge tokens, dotted grid, preview
// card, dashed non-published treatment); everything genuinely new — the
// legend, the zoom controls, the edge-direction treatment, the keyboard
// grammar — is improvised from direction.md's rules of thumb and listed in the
// phase report for components.md back-fill. Amber discipline holds: the
// selected node and its incident edges are the only wayfinding moment; the
// legend and controls stay muted.

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
export default function NetworkCanvas({ graph }: { graph: GraphData }) {
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
  return <NetworkGraph graph={graph} mobile={mobile} />;
}

function NetworkNote() {
  return (
    <p className="network-note">
      Edges are <strong>prerequisites</strong> (directed) and{" "}
      <strong>related</strong> links (undirected), taken from each
      concept&rsquo;s own frontmatter. Shared tags are deliberately not drawn —
      at this size they would connect nearly everything to everything.
    </p>
  );
}

function NetworkGraph({
  graph,
  mobile,
}: {
  graph: GraphData;
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

  const geometry = mobile ? MOBILE_NETWORK_FORCES : NETWORK_FORCES;
  const layout = useMemo(
    () => layoutNetwork(graph, geometry),
    [graph, geometry]
  );
  const adjacency = useMemo(() => buildAdjacency(graph), [graph]);

  // Highest-degree node — the graph's centre of gravity in the content sense.
  // Home targets it, and it is the fallback initial view. Ties break on slug
  // so the choice is stable across builds.
  const hubSlug = useMemo(() => {
    return [...graph.nodes]
      .sort((a, b) => b.degree - a.degree || a.slug.localeCompare(b.slug))[0]
      .slug;
  }, [graph]);

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

  /**
   * Initial view. `fit` is the intent — seeing the whole territory is the
   * point of this mode, and small labels at the overview are a feature, not a
   * defect: you read the shape, then zoom for the names.
   *
   * The exception is 390px, where the graph fits at ~0.22 and the pills
   * collapse into 35px slivers — that is a picture of a network, not a view
   * of one. There the initial view centres the highest-degree node at 1:1,
   * which puts the learner somewhere real and leaves `fit` one button away.
   * Desktop fits at ~0.58 on a laptop viewport and clears the floor easily.
   */
  const initialTransform = useCallback((): Transform => {
    const fit = fitTransform();
    if (fit.k >= MIN_FIT_SCALE) return fit;
    const hub = layout.bySlug.get(hubSlug);
    return hub ? centerOn(hub, 1) : fit;
  }, [fitTransform, centerOn, layout, hubSlug]);

  // Push a transform through the zoom behaviour rather than to state directly,
  // so d3's internal transform never drifts from what is rendered — otherwise
  // the next wheel gesture would jump back to d3's stale value.
  const applyTransform = useCallback((next: Transform) => {
    const svg = svgRef.current;
    const behaviour = zoomRef.current;
    if (!svg || !behaviour) {
      setTransform(next);
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
  useEffect(() => {
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
    const current = focused ?? hubSlug;
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
        // No End: a graph has no last node, and inventing one (lowest degree?
        // alphabetically last?) would be a key that means nothing. Home is
        // meaningful because the highest-degree node genuinely is the hub.
        moveFocus(hubSlug);
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

  const renderEdge = (
    edge: (typeof layout.edges)[number],
    index: number
  ) => {
    const source = layout.bySlug.get(edge.source)!;
    const target = layout.bySlug.get(edge.target)!;
    // Trim both ends to the pill boundary: the tail so the line does not
    // emerge from under a label, the head so the arrow marker is visible.
    const a = trimToPill(target.x, target.y, source, EDGE_GAP);
    const b = trimToPill(source.x, source.y, target, EDGE_GAP);
    const active =
      selected !== null && (edge.source === selected || edge.target === selected);
    const classes = [
      "nwedge",
      `nwedge-${edge.kind}`,
      active && "nwedge-active",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <line
        key={`${edge.source}-${edge.target}-${index}`}
        className={classes}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        markerEnd={
          edge.kind === "prerequisite"
            ? active
              ? "url(#nw-arrow-active)"
              : "url(#nw-arrow)"
            : undefined
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
        <text
          className="nwnode-label"
          x={node.paradigm ? 27 : 14}
          y={node.height / 2}
        >
          {node.title}
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
            "Concept network. Arrow keys move between connected concepts, " +
            "Home jumps to the most connected concept, Enter opens a preview, " +
            "Escape closes it. Plus and minus zoom, 0 fits the whole graph."
          }
          aria-activedescendant={focused ? `nwnode-${focused}` : undefined}
          onKeyDown={onKeyDown}
        >
          <defs>
            {/* userSpaceOnUse: the default (strokeWidth) would scale the
                arrowhead to a 1px stroke and render it invisible. */}
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
            <marker
              id="nw-arrow-active"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="8"
              markerHeight="8"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path className="nwarrow nwarrow-active" d="M0,0 L8,4 L0,8 Z" />
            </marker>
          </defs>
          {/* The single transformed group — this is where d3-zoom's output
              lands, and the only thing that moves. */}
          <g
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}
          >
            <g aria-hidden="true">{layout.edges.map(renderEdge)}</g>
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
                <line className="nwedge nwedge-prerequisite" x1="0" y1="4" x2="26" y2="4" />
                <path className="nwarrow" d="M26,0 L34,4 L26,8 Z" />
              </svg>
            </dt>
            <dd>prerequisite</dd>
          </div>
          <div>
            <dt>
              <svg viewBox="0 0 34 8" aria-hidden="true">
                <line className="nwedge nwedge-related" x1="0" y1="4" x2="34" y2="4" />
              </svg>
            </dt>
            <dd>related</dd>
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
