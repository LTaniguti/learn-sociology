"use client";

import { useEffect, useState } from "react";
import { isComplete, setComplete, PROGRESS_EVENT } from "@/lib/progress";

// The single write path for lesson completion. Renders the not-complete state
// until mounted so static HTML and hydration agree.
export default function MarkCompleteButton({ slug }: { slug: string }) {
  const [complete, setCompleteState] = useState(false);

  useEffect(() => {
    const update = () => setCompleteState(isComplete(slug));
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, [slug]);

  return (
    <button
      type="button"
      className="mark-complete"
      aria-pressed={complete}
      onClick={() => setComplete(slug, !complete)}
    >
      {complete ? "Completed ✓" : "Mark complete"}
    </button>
  );
}
