"use client";

import { useEffect, useState } from "react";
import { isComplete, PROGRESS_EVENT } from "@/lib/progress";
import CompletionSeal from "@/components/CompletionSeal";

// The mastery-mode status line (Phase 4.4). Occupies the exact slot the
// MarkCompleteButton holds in manual mode, but it is NOT a control — completion
// for a published choice-quiz lesson is derived from the quiz (SelfCheck writes
// it through lib/progress), so there is nothing here to click. A control that
// can never be clicked is not a control; this is a caption before, the seal +
// label after. It reads completion from the one store like every other consumer
// and updates live on PROGRESS_EVENT, so when the final correct answer flips the
// lesson the line swaps to the seal in the same frame. Renders the not-complete
// caption until mounted so static HTML and hydration agree. The transition
// between states rides --transition-fast (the global reduced-motion rule makes
// it instant when the learner asks for that).
export default function LessonStatus({ slug }: { slug: string }) {
  const [complete, setCompleteState] = useState(false);

  useEffect(() => {
    const update = () => setCompleteState(isComplete(slug));
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, [slug]);

  return (
    <p
      className={
        complete ? "lesson-status lesson-status-complete" : "lesson-status"
      }
      role="status"
    >
      {complete ? (
        <>
          <CompletionSeal className="lesson-status-seal" />
          <span className="lesson-status-label">Lesson complete.</span>
        </>
      ) : (
        <span className="lesson-status-caption">
          Complete the self-check below to finish this lesson.
        </span>
      )}
    </p>
  );
}
