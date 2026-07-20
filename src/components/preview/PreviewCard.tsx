import Link from "next/link";
import type { Ref } from "react";

// The concept preview card, shared by the hierarchy canvas (3.2) and the
// network canvas (3.3). Extracted from HierarchyCanvas in 3.3 — both modes
// raise the same card with the same contents, and the brief for Mode 3 calls
// for the same component rather than a lookalike.
//
// Positioning is deliberately NOT this component's concern: the two canvases
// anchor it in different coordinate spaces (the hierarchy scrolls, so it works
// in canvas coordinates; the network zooms, so it works in screen
// coordinates). The caller passes `style` and a ref for measurement.

export type PreviewData = {
  slug: string;
  title: string;
  summary: string;
  difficulty: "intro" | "intermediate" | "advanced";
  status: "stub" | "draft" | "review" | "published";
  tags: string[];
};

export default function PreviewCard({
  data,
  cardRef,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  data: PreviewData;
  cardRef?: Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <div
      ref={cardRef}
      className="hcard"
      role="group"
      aria-label={`About ${data.title}`}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="hcard-head">
        <span className="hcard-title">{data.title}</span>
        <span className={`difficulty-badge difficulty-${data.difficulty}`}>
          {data.difficulty}
        </span>
      </div>
      <p className="hcard-summary">{data.summary}</p>
      {data.status !== "published" && (
        <p className="hcard-status">status: {data.status}</p>
      )}
      {data.tags.length > 0 && (
        <ul className="tag-chips">
          {data.tags.map((tag) => (
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
      <Link className="hcard-lesson" href={`/node/${data.slug}`}>
        Open lesson
      </Link>
    </div>
  );
}
