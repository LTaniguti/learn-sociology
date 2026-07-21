"use client";

import { useEffect, useState } from "react";
import { isComplete, PROGRESS_EVENT } from "@/lib/progress";
import CompletionSeal from "@/components/CompletionSeal";

// Completion mark for a lesson (syllabus rows, prerequisite items).
// localStorage is read only after mount, so static HTML and the first client
// render agree (no mark) and hydration never mismatches.
//
// As of 4.3 this renders the drawn completion seal (CompletionSeal) rather than
// a text `✓`. On the syllabus the seal is the visible leading mark; in the
// prerequisite list the span stays visually hidden (node-page.css) and the
// list's own `::before` continues to draw the mark, so that surface is
// unchanged. The span keeps its accessible "completed" label either way.
export default function LessonCheck({ slug }: { slug: string }) {
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const update = () => setComplete(isComplete(slug));
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, [slug]);

  if (!complete) return null;
  return (
    <span className="lesson-check" role="img" aria-label="completed">
      <CompletionSeal />
    </span>
  );
}
