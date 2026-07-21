"use client";

import { useEffect, useState } from "react";
import { isComplete, setComplete, PROGRESS_EVENT } from "@/lib/progress";
import { isQuizFinished, QUIZ_EVENT } from "@/lib/quiz-progress";
import CompletionSeal from "@/components/CompletionSeal";

// The single write path for lesson completion. Renders the not-complete state
// until mounted so static HTML and hydration agree.
//
// The quiz gate (4.3, reversing 4.1's "quiz never gates"): a lesson WITH a
// published quiz keeps this button locked until the self-check is finished
// (every choice question stored correct). The gate UNLOCKS the button — it
// never auto-marks; the learner still clicks. Lessons without a published quiz
// (hasPublishedQuiz false) mark exactly as before. Grandfathering: an already
// complete lesson keeps a usable button (for unmarking) regardless of quiz
// state — the gate governs the act of marking, not stored history.
export default function MarkCompleteButton({
  slug,
  hasPublishedQuiz = false,
  choiceCount = 0,
}: {
  slug: string;
  // Server-known at build (the loader filters drafts, so this keys off the same
  // published filter, never off file existence). choiceCount is the gradable
  // total the gate must reach.
  hasPublishedQuiz?: boolean;
  choiceCount?: number;
}) {
  const [complete, setCompleteState] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const update = () => setCompleteState(isComplete(slug));
    update();
    window.addEventListener(PROGRESS_EVENT, update);
    return () => window.removeEventListener(PROGRESS_EVENT, update);
  }, [slug]);

  useEffect(() => {
    if (!hasPublishedQuiz) return;
    // QUIZ_EVENT fires on every quiz write, so the final correct answer enables
    // the button in the same interaction frame — no reload.
    const update = () => setFinished(isQuizFinished(slug, choiceCount));
    update();
    window.addEventListener(QUIZ_EVENT, update);
    return () => window.removeEventListener(QUIZ_EVENT, update);
  }, [slug, hasPublishedQuiz, choiceCount]);

  // Locked only when a published quiz is unfinished AND the lesson is not
  // already complete (grandfathering keeps the unmark path open).
  const locked = hasPublishedQuiz && !complete && !finished;

  return (
    <div className="mark-complete-wrap">
      <button
        type="button"
        className="mark-complete"
        aria-pressed={complete}
        disabled={locked}
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
      {locked && (
        <p className="mark-complete-hint">
          Finish the self-check below to mark this lesson complete.
        </p>
      )}
    </div>
  );
}
