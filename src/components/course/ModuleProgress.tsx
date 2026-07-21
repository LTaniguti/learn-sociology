"use client";

import { useEffect, useState } from "react";
import { completionFor, PROGRESS_EVENT } from "@/lib/progress";

// Per-module rollup in the syllabus header: a quiet "n of m" count and a thin
// fill bar — the ProgressCount track/fill pattern (course footer) scaled down
// and reused, not a new element. Counts run through the single completionFor
// rollup (Phase 4.2 invariant). Renders the zero-progress state until mounted
// so static HTML and hydration agree (the LessonCheck pattern). Lives inside
// the <summary> so the count stays visible when the module is collapsed.
export default function ModuleProgress({ slugs }: { slugs: string[] }) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    const update = () => setDone(completionFor(slugs).done);
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, [slugs]);

  const total = slugs.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <span className="module-progress">
      <span className="module-progress-count">
        {done} of {total}
      </span>
      <span className="module-progress-track" aria-hidden="true">
        <span
          className="module-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
