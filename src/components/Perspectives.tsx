import type { Perspectives as PerspectivesData } from "../../lib/content";
import "./perspectives.css";

// Structured Perspectives (Phase 4.5). The `## Perspectives` section, split out
// of the body at build time (lib/content.ts), rendered as paradigm-accented
// cards. Server-rendered and static — no interactivity, no per-paradigm
// filtering, printable and honest.
//
// This block renders INSIDE the `.node-body` article, between htmlBefore and
// htmlAfter (NodeArticle), so its heading, intro prose, and card bodies inherit
// the article's typography for free — the reader perceives a designed passage of
// the same lesson, not a separate widget. Only the card chrome (surface, accent,
// grid, chip) carries its own classes; see docs/design/components.md.

// Canonical paradigm names, matched to the 4.1 self-check attribution chip so
// the quiz and the article speak one language. Attributed cards show this name;
// neutral cards show the authored label verbatim.
const PARADIGM_NAME: Record<string, string> = {
  functionalism: "Functionalism",
  conflict: "Conflict theory",
  interactionism: "Interactionism",
};

export default function Perspectives({ data }: { data: PerspectivesData }) {
  return (
    <section className="perspectives" aria-labelledby="perspectives-heading">
      <h2 id="perspectives-heading">Perspectives</h2>

      {data.intro && (
        <div
          className="perspectives-intro"
          dangerouslySetInnerHTML={{ __html: data.intro }}
        />
      )}

      <div className="perspectives-grid">
        {data.items.map((item, i) => {
          const attributed = item.paradigm !== null;
          // Attributed: the canonical paradigm name (chip vocabulary shared with
          // the quiz). Neutral: the authored label, its trailing period trimmed.
          const label = attributed
            ? PARADIGM_NAME[item.paradigm as string] ?? item.label
            : item.label.replace(/\s*\.\s*$/, "");
          return (
            <article
              key={i}
              className={
                attributed
                  ? `perspective-card paradigm-${item.paradigm}`
                  : "perspective-card perspective-card-neutral"
              }
            >
              {/* The label carries the meaning; the hue only accompanies it
                  (house CVD rule) — every card names its stance in text. */}
              <span className="perspective-label">{label}</span>
              <div
                className="perspective-body"
                dangerouslySetInnerHTML={{ __html: item.html }}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
