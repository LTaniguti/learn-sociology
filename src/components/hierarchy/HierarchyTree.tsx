"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// Frame 2 — the collapsible tree itself. Pure nested HTML driven by React
// state; no graph library (wireframe open question 1, resolved). Expansion
// state is ephemeral by design — progress.ts stays the only localStorage
// owner, and nothing here persists.

export type HierarchyNode = {
  slug: string;
  title: string;
  summary: string;
  difficulty: "intro" | "intermediate" | "advanced";
  tags: string[];
  descendantCount: number;
  children: HierarchyNode[];
};

const ZOOM_STEPS = [
  { label: "A−", name: "Smaller text", scale: 0.85 },
  { label: "A", name: "Default text", scale: 1 },
  { label: "A+", name: "Larger text", scale: 1.2 },
];

// Paradigm colour classes derive from the paradigm/* tag (direction.md rule
// 4: the trio is semantic, never decorative). Pure styling hook — no new data.
function paradigmOf(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("paradigm/"));
  return tag ? tag.slice("paradigm/".length) : null;
}

// Slugs from root to `target` inclusive, or null if the slug isn't in the tree.
function findPath(node: HierarchyNode, target: string): string[] | null {
  if (node.slug === target) return [node.slug];
  for (const child of node.children) {
    const path = findPath(child, target);
    if (path) return [node.slug, ...path];
  }
  return null;
}

function collectExpandable(node: HierarchyNode, into: string[]): string[] {
  if (node.children.length > 0) {
    into.push(node.slug);
    node.children.forEach((child) => collectExpandable(child, into));
  }
  return into;
}

export default function HierarchyTree({ root }: { root: HierarchyNode }) {
  // Initial view per the frame: root expanded to its first-level children,
  // everything deeper collapsed.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([root.slug])
  );
  // The one click-pinned preview card (tap-to-preview on touch, wireframe
  // open question 2, resolved). Hover/focus cards are pure CSS.
  const [pinned, setPinned] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const expandable = useMemo(() => collectExpandable(root, []), [root]);

  // Deep link: /hierarchy#slug expands the ancestor path, scrolls, highlights.
  // Client-side on mount — the static export has no server routing.
  useEffect(() => {
    const slug = decodeURIComponent(window.location.hash.slice(1));
    if (!slug) return;
    const path = findPath(root, slug);
    if (!path) return; // unknown hashes are ignored silently
    // location.hash is only readable client-side; this mount-only read is the
    // deep-link mechanism on a static export, and the re-render is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded((prev) => new Set([...prev, ...path.slice(0, -1)]));
    setHighlighted(slug);
  }, [root]);

  // Runs after the expansion above has committed, so the target exists.
  useEffect(() => {
    if (!highlighted) return;
    document
      .getElementById(`hnode-${highlighted}`)
      ?.scrollIntoView({ block: "center" });
  }, [highlighted]);

  // Clicking anywhere outside a node row closes the pinned card; clicks on
  // titles/cards stop propagation so this only sees "elsewhere" clicks.
  useEffect(() => {
    if (!pinned) return;
    const close = () => setPinned(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pinned]);

  const toggleExpand = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const closeCard = () => {
    setPinned(null);
    // Hover/focus cards are shown via :focus-within; Escape must also drop
    // focus for the card to actually disappear for keyboard users.
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const renderNode = (node: HierarchyNode) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.slug);
    const paradigm = paradigmOf(node.tags);
    const classes = [
      "hnode",
      highlighted === node.slug && "hnode-highlighted",
      paradigm && `hnode-paradigm-${paradigm}`,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <li key={node.slug} id={`hnode-${node.slug}`} className={classes}>
        <div className="hnode-row">
          {hasChildren ? (
            <button
              type="button"
              className="hnode-toggle"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.title}`}
              onClick={() => toggleExpand(node.slug)}
            >
              {isExpanded ? "−" : "+"}
            </button>
          ) : (
            <span className="hnode-toggle hnode-leaf" aria-hidden="true">
              ·
            </span>
          )}
          <span
            className="hnode-self"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeCard();
            }}
          >
            <button
              type="button"
              className="hnode-title"
              onClick={(e) => {
                e.stopPropagation();
                setPinned(pinned === node.slug ? null : node.slug);
              }}
              onMouseEnter={() => {
                if (pinned && pinned !== node.slug) setPinned(null);
              }}
            >
              {node.title}
            </button>
            {hasChildren && !isExpanded && (
              <span
                className="hnode-count"
                aria-label={`${node.descendantCount} concepts inside`}
              >
                +{node.descendantCount}
              </span>
            )}
            <div
              className={
                pinned === node.slug
                  ? "hnode-card hnode-card-pinned"
                  : "hnode-card"
              }
              role="group"
              aria-label={`About ${node.title}`}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="hnode-card-summary">{node.summary}</p>
              <span
                className={`difficulty-badge difficulty-${node.difficulty}`}
              >
                {node.difficulty}
              </span>
              {node.tags.length > 0 && (
                <ul className="tag-chips">
                  {node.tags.map((tag) => (
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
                className="hnode-card-lesson"
                href={`/node/${node.slug}`}
              >
                Open lesson
              </Link>
            </div>
          </span>
        </div>
        {hasChildren && isExpanded && (
          <ul className="hnode-children">
            {node.children.map((child) => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="hierarchy-view">
      <div className="hierarchy-controls">
        <button
          type="button"
          onClick={() => setExpanded(new Set(expandable))}
        >
          Expand all
        </button>
        <button type="button" onClick={() => setExpanded(new Set())}>
          Collapse all
        </button>
        <span
          className="hierarchy-zoom"
          role="group"
          aria-label="Text size"
        >
          {ZOOM_STEPS.map((step, i) => (
            <button
              key={step.label}
              type="button"
              aria-label={step.name}
              aria-pressed={zoom === i}
              onClick={() => setZoom(i)}
            >
              {step.label}
            </button>
          ))}
        </span>
      </div>
      <div
        className="hierarchy-canvas"
        style={
          { "--hierarchy-scale": ZOOM_STEPS[zoom].scale } as React.CSSProperties
        }
      >
        <ul className="hierarchy-tree">{renderNode(root)}</ul>
      </div>
    </div>
  );
}
