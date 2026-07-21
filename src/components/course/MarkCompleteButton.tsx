"use client";

import { useEffect, useState } from "react";
import { isComplete, setComplete, PROGRESS_EVENT } from "@/lib/progress";
import CompletionSeal from "@/components/CompletionSeal";

// The manual-mode completion control (Phase 4.4). Renders ONLY for lessons with
// no published choice-quiz — the course view branches on that and shows a
// LessonStatus line instead when a lesson is in mastery mode. So by construction
// this button never has a quiz to gate on: the 4.3 lock (props hasPublishedQuiz
// /choiceCount, the isQuizFinished effect, the disabled `locked` state and its
// hint caption) is dead here and was removed. What remains is the plain 4.2
// toggle — the single write path for manual completion, marking and unmarking
// freely. Renders the not-complete state until mounted so static HTML and
// hydration agree.
export default function MarkCompleteButton({ slug }: { slug: string }) {
  const [complete, setCompleteState] = useState(false);

  useEffect(() => {
    const update = () => setCompleteState(isComplete(slug));
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, [slug]);

  return (
    <div className="mark-complete-wrap">
      <button
        type="button"
        className="mark-complete"
        aria-pressed={complete}
        onClick={() => setComplete(slug, !complete)}
      >
        {complete ? (
          <>
            Completed
            <CompletionSeal className="mark-complete-seal" />
          </>
        ) : (
          "Mark complete"
        )}
      </button>
    </div>
  );
}
