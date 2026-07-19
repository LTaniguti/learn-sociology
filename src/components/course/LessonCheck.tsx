"use client";

import { useEffect, useState } from "react";
import { isComplete, PROGRESS_EVENT } from "@/lib/progress";

// Completion checkmark for a lesson (syllabus rows, prerequisite items).
// localStorage is read only after mount, so static HTML and the first client
// render agree (no checkmark) and hydration never mismatches.
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
    <span className="lesson-check" aria-label="completed">
      ✓
    </span>
  );
}
