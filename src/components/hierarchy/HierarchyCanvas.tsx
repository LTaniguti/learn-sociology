"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  DESKTOP_GEOMETRY,
  MOBILE_GEOMETRY,
  collectBranches,
  findPath,
  layoutTree,
  type HierarchyNode,
  type LaidNode,
} from "./layout";

// Phase 3.2 — Mode 2's node-and-edge canvas (hierarchy-view hi-fi).
// Rendering rationale (decision record): canvas-based graph libraries bypass
// CSS tokens, theming, and focus semantics; SVG-in-DOM keeps all three for
// free. d3-hierarchy computes coordinates in layout.ts and never touches the
// DOM; React renders nodes as positioned <g> groups and edges as <path>
// béziers. Phase 3.3 (network view) reuses this exact split with d3-force.
//
// Collapse state is React state only — session-ephemeral by deliberate
// choice (progress.ts stays the sole localStorage owner); revisitable if
// users ask for persistence.

const CARD_GAP = 14; // node edge → preview card (px, canvas coordinates)

export type { HierarchyNode };

export default function HierarchyCanvas({ root }: { root: HierarchyNode }) {
  const branches = useMemo(() => collectBranches(root, []), [root]);

  // Default view per the hi-fi: root expanded to its modules, deeper
  // levels collapsed.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(branches.filter((slug) => slug !== root.slug))
  );
  // The previewed node: opened by activating a node body (or Enter), the
  // second affordance next to the expand/collapse controls.
  const [selected, setSelected] = useState<string | null>(null);
  // Transient hover preview (desktop); the pinned `selected` wins.
  const [hovered, setHovered] = useState<string | null>(null);
  // Roving tabindex — the single tab stop within the tree.
  const [focused, setFocused] = useState<string>(root.slug);
  const [mobile, setMobile] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const moveFocus = useRef(false);
  const hoverTimer = useRef<number | null>(null);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(
    null
  );

  const geometry = mobile ? MOBILE_GEOMETRY : DESKTOP_GEOMETRY;
  const layout = useMemo(
    () => layoutTree(root, collapsed, geometry),
    [root, collapsed, geometry]
  );
  const nodeBySlug = useMemo(
    () => new Map(layout.nodes.map((n) => [n.data.slug, n])),
    [layout]
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const apply = () => setMobile(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  // Deep link: /hierarchy#slug expands the ancestor path, previews the node,
  // and scrolls it into view. Client-side on mount — static export.
  useEffect(() => {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    if (!slug) return;
    const path = findPath(root, slug);
    if (!path) return; // unknown hashes are ignored silently
    // Mount-only hash read; the extra render is the deep-link mechanism.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed((prev) => {
      const next = new Set(prev);
      path.slice(0, -1).forEach((ancestor) => next.delete(ancestor));
      return next;
    });
    setSelected(slug);
    setFocused(slug);
  }, [root]);

  const previewSlug = selected ?? hovered;
  const previewNode = previewSlug ? nodeBySlug.get(previewSlug) : undefined;

  // Slugs on the root→preview path; their edges render in --color-edge-active.
  const activePath = useMemo(() => {
    if (!previewSlug) return new Set<string>();
    return new Set(findPath(root, previewSlug) ?? []);
  }, [root, previewSlug]);

  // Dismiss on outside click / Esc (node and card clicks stop propagation).
  // Esc also drops the hover preview so the card actually disappears even
  // while the pointer still rests on the node.
  useEffect(() => {
    if (!selected) return;
    const close = () => setSelected(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        setHovered(null);
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  // Anchor the preview card to the previewed node: right of it by default,
  // flipping to the left when the right side would leave the visible
  // viewport, clamped to the canvas extent.
  useLayoutEffect(() => {
    if (!previewNode) {
      // Measure-then-position: the card must render (hidden) before its size
      // is known, so this second pass is inherent to anchoring it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCardPos(null);
      return;
    }
    const viewport = viewportRef.current;
    const card = cardRef.current;
    if (!viewport || !card) return;
    const cardW = card.offsetWidth;
    const cardH = card.offsetHeight;
    // Bounds are the union of the canvas extent and the visible viewport —
    // the card may overhang a narrow canvas as long as it stays on screen.
    const boundRight = Math.max(
      layout.width,
      viewport.scrollLeft + viewport.clientWidth
    );
    const boundBottom = Math.max(
      layout.height,
      viewport.scrollTop + viewport.clientHeight
    );
    let left = previewNode.x + previewNode.width + CARD_GAP;
    if (left + cardW > boundRight) {
      left = previewNode.x - CARD_GAP - cardW;
    }
    // Keep the card inside the *visible* window — a flip near the scrolled-in
    // edge may cover the node (mobile), which beats being off-screen.
    left = Math.max(0, viewport.scrollLeft, Math.min(left, boundRight - cardW));
    const visibleBottom = viewport.scrollTop + viewport.clientHeight;
    let top = Math.min(previewNode.y, visibleBottom - cardH, boundBottom - cardH);
    top = Math.max(0, viewport.scrollTop, top);
    setCardPos({ left, top });
  }, [previewNode, layout]);

  // Scroll the previewed node (deep link, Enter) into view.
  useEffect(() => {
    if (!selected) return;
    nodeRefs.current
      .get(selected)
      ?.scrollIntoView({ block: "center", inline: "nearest" });
  }, [selected]);

  // Keyboard-driven focus lands after render (the target may be newly
  // expanded); mouse clicks never steal focus through this path.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const el = nodeRefs.current.get(focused);
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [focused, layout]);

  const toggleBranch = useCallback((slug: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const setHoveredDebounced = (slug: string | null) => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    if (slug === null) {
      // Grace period so the pointer can cross the gap into the card.
      hoverTimer.current = window.setTimeout(() => setHovered(null), 150);
    } else {
      setHovered(slug);
    }
  };

  // WAI-ARIA treeview keyboard pattern. `layout.nodes` is pre-order, which
  // is exactly the visible-row order ↑/↓ walk.
  const onTreeKeyDown = (e: React.KeyboardEvent) => {
    const order = layout.nodes;
    const index = order.findIndex((n) => n.data.slug === focused);
    if (index === -1) return;
    const current = order[index];
    const go = (target: LaidNode | undefined) => {
      if (!target) return;
      moveFocus.current = true;
      setFocused(target.data.slug);
    };
    switch (e.key) {
      case "ArrowDown":
        go(order[index + 1]);
        break;
      case "ArrowUp":
        go(order[index - 1]);
        break;
      case "ArrowRight":
        if (!current.hasChildren) return;
        if (!current.expanded) toggleBranch(current.data.slug);
        else go(order.find((n) => n.parentSlug === current.data.slug));
        break;
      case "ArrowLeft":
        if (current.expanded) toggleBranch(current.data.slug);
        else if (current.parentSlug) go(nodeBySlug.get(current.parentSlug));
        break;
      case "Home":
        go(order[0]);
        break;
      case "End":
        go(order[order.length - 1]);
        break;
      case "Enter":
        setSelected(selected === focused ? null : focused);
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const renderNode = (node: LaidNode) => {
    const { slug, title, descendantCount, status } = {
      slug: node.data.slug,
      title: node.data.title,
      descendantCount: node.data.descendantCount,
      status: node.data.status,
    };
    const classes = [
      "hcnode",
      node.expanded && "hcnode-expanded",
      status !== "published" && "hcnode-unpublished",
      previewSlug === slug && "hcnode-previewed",
      node.paradigm && `hcnode-paradigm-${node.paradigm}`,
    ]
      .filter(Boolean)
      .join(" ");
    const labelX =
      14 +
      (node.expanded ? 16 : !node.hasChildren && node.paradigm ? 15 : 0); // mirrors layout.ts inner metrics
    const midY = node.height / 2;
    return (
      <g
        key={slug}
        ref={(el) => {
          if (el) nodeRefs.current.set(slug, el);
          else nodeRefs.current.delete(slug);
        }}
        className={classes}
        style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
        role="treeitem"
        tabIndex={focused === slug ? 0 : -1}
        aria-expanded={node.hasChildren ? node.expanded : undefined}
        aria-level={node.level}
        aria-setsize={node.setsize}
        aria-posinset={node.posinset}
        aria-label={
          node.hasChildren && !node.expanded
            ? `${title}, ${descendantCount} concept${
                descendantCount === 1 ? "" : "s"
              } inside`
            : title
        }
        onFocus={() => setFocused(slug)}
        onMouseEnter={() => setHoveredDebounced(slug)}
        onMouseLeave={() => setHoveredDebounced(null)}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(selected === slug ? null : slug);
        }}
      >
        <rect className="hcnode-box" width={node.width} height={node.height} />
        {node.expanded && (
          // Explicit collapse control (the hi-fi's leading "−").
          <g
            className="hcnode-toggle"
            role="none"
            onClick={(e) => {
              e.stopPropagation();
              toggleBranch(slug);
            }}
          >
            <rect
              className="hcnode-hit"
              width={30}
              height={node.height}
            />
            <text className="hcnode-glyph" x={14} y={midY}>
              −
            </text>
          </g>
        )}
        {!node.hasChildren && node.paradigm && (
          <circle className="hcnode-dot" cx={17.5} cy={midY} r={3.5} />
        )}
        <text className="hcnode-label" x={labelX} y={midY}>
          {title}
        </text>
        {node.badgeWidth > 0 && (
          // The "+N" badge doubles as the expand control (per components.md,
          // the node-&-edge canvas shows the badge alone).
          <g
            className="hcnode-badge"
            role="none"
            onClick={(e) => {
              e.stopPropagation();
              toggleBranch(slug);
            }}
          >
            <rect
              className="hcnode-hit"
              x={node.width - node.badgeWidth - 22}
              width={node.badgeWidth + 22}
              height={node.height}
            />
            <rect
              className="hcnode-badge-box"
              x={node.width - 14 - node.badgeWidth}
              y={midY - 9}
              width={node.badgeWidth}
              height={18}
            />
            <text
              className="hcnode-badge-count"
              x={node.width - 14 - node.badgeWidth / 2}
              y={midY}
            >
              +{descendantCount}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="hierarchy-view">
      <div className="hierarchy-controls">
        <button type="button" onClick={() => setCollapsed(new Set())}>
          Expand all
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(new Set(branches))}
        >
          Collapse all
        </button>
      </div>
      <div className="hierarchy-viewport" ref={viewportRef}>
        <div
          className="hierarchy-canvas"
          style={{ width: layout.width, height: layout.height }}
        >
          <svg
            className="hierarchy-svg"
            width={layout.width}
            height={layout.height}
            role="tree"
            aria-label="Concept hierarchy"
            onKeyDown={onTreeKeyDown}
          >
            <g aria-hidden="true">
              {layout.edges.map((edge) => (
                <path
                  key={edge.childSlug}
                  className={
                    activePath.has(edge.childSlug)
                      ? "hedge hedge-active"
                      : "hedge"
                  }
                  d={edge.path}
                />
              ))}
            </g>
            {layout.nodes.map(renderNode)}
          </svg>
          {previewNode && (
            <div
              ref={cardRef}
              className="hcard"
              role="group"
              aria-label={`About ${previewNode.data.title}`}
              style={
                cardPos
                  ? { left: cardPos.left, top: cardPos.top }
                  : { left: 0, top: 0, visibility: "hidden" }
              }
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => setHoveredDebounced(previewNode.data.slug)}
              onMouseLeave={() => setHoveredDebounced(null)}
            >
              <div className="hcard-head">
                <span className="hcard-title">{previewNode.data.title}</span>
                <span
                  className={`difficulty-badge difficulty-${previewNode.data.difficulty}`}
                >
                  {previewNode.data.difficulty}
                </span>
              </div>
              <p className="hcard-summary">{previewNode.data.summary}</p>
              {previewNode.data.status !== "published" && (
                <p className="hcard-status">
                  status: {previewNode.data.status}
                </p>
              )}
              {previewNode.data.tags.length > 0 && (
                <ul className="tag-chips">
                  {previewNode.data.tags.map((tag) => (
                    <li
                      key={tag}
                      className={
                        tag.startsWith("paradigm/")
                          ? "tag-chip tag-chip-paradigm"
                          : "tag-chip"
                      }
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                className="hcard-lesson"
                href={`/node/${previewNode.data.slug}`}
              >
                Open lesson
              </Link>
            </div>
          )}
        </div>
      </div>
      <p className="hierarchy-note">
        Edges come from the single <strong>parent</strong> field — one parent
        per node, a true tree. Prerequisite / related links are deliberately
        not drawn.
      </p>
    </div>
  );
}
