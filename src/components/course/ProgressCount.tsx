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

  return (
    <p className="progress-count">
      {count} of {slugs.length} lessons
    </p>
  );
}
