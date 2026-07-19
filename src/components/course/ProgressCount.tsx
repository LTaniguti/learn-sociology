"use client";

import { useEffect, useState } from "react";
import { countComplete, PROGRESS_EVENT } from "@/lib/progress";

// Sidebar footer progress line ("N of 53 lessons"). Renders the zero-progress
// state until mounted so static HTML and hydration agree.
export default function ProgressCount({ slugs }: { slugs: string[] }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(countComplete(slugs));
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, [slugs]);

  const pct = slugs.length > 0 ? (count / slugs.length) * 100 : 0;

  return (
    <div className="progress">
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-count">
        {count} of {slugs.length} lessons complete ·{" "}
        <span className="progress-local">device-local</span>
      </p>
    </div>
  );
}
