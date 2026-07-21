// The completion seal (Phase 4.3) — the single drawn mark for "done", shared by
// all four surfaces: hierarchy pills, network pills, syllabus rows, and the
// MarkCompleteButton completed state. It replaces the 4.2 text `✓` glyph, which
// read cheap and rendered inconsistently across font stacks.
//
// One geometry, one source of truth: a disc filled --state-complete-mark
// carrying a stroked check with rounded caps/joins. The check's colour is the
// surface's own background — each consumer sets --seal-ink (paper on the
// syllabus, canvas fill on the pills) so the check reads as cut out of the disc.
//
// Rendered as an <svg viewBox>, so it drops into HTML flow (sized by CSS) or
// nests inside a canvas <svg> (positioned by the x/y/size props, in user units).
// aria-hidden throughout: completion is spoken by the surrounding markup (the
// syllabus row's label, the button's text), never re-announced per mark.

export default function CompletionSeal({
  x,
  y,
  size,
  className,
}: {
  // Canvas placement inside an existing <svg>: top-left corner + edge, in user
  // units. Omit all three for HTML flow, where CSS sizes the mark.
  x?: number;
  y?: number;
  size?: number;
  className?: string;
}) {
  const placement =
    x !== undefined ? { x, y, width: size, height: size } : {};

  return (
    <svg
      className={className ? `completion-seal ${className}` : "completion-seal"}
      viewBox="0 0 20 20"
      aria-hidden="true"
      {...placement}
    >
      <circle className="completion-seal-disc" cx="10" cy="10" r="9" />
      <path
        className="completion-seal-check"
        d="M5.5 10.25 L8.75 13.5 L14.5 6.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
