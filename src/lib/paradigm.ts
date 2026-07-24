// Paradigm colour classes derive from the `paradigm/*` tag (direction.md rule
// 4: the trio is semantic, never decorative). Pure styling hook — no I/O, no
// new data, just the tag-prefix rule.
//
// Lifted out of NodeArticle.tsx in 6.1, when the person profile's concept rows
// needed the identical rule. Two copies of a tag-prefix rule is how the
// masteryMode hazard started; one function, two callers, no drift.
export function paradigmOf(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("paradigm/"));
  return tag ? tag.slice("paradigm/".length) : null;
}
