"use client";

import { useEffect, useState } from "react";
import type {
  Quiz,
  QuizChoiceQuestion,
  QuizReflectQuestion,
} from "../../lib/content";
import {
  getAnswer,
  setAnswer,
  clearAnswer,
  scoreFor,
  isQuizFinished,
  QUIZ_EVENT,
} from "@/lib/quiz-progress";
import { isComplete, setComplete } from "@/lib/progress";
import "./self-check.css";

// Self-check quiz (Phase 4.1), rendered below the lesson body on BOTH hosts of
// NodeArticle — /node/[slug] and the course lesson view — so graph-arrival and
// Mode 1 learners get the same surface. Only `published` quizzes reach here
// (the loader filters drafts out of the payload), so this component never has
// to reason about status.
//
// Open-book by design: this is self-assessment, not certification. No badges,
// no confetti. Doctrine has moved three times: 4.1 said a quiz never gates; 4.3
// made it gate but kept completion a deliberate click (it UNLOCKED the button);
// 4.4 makes a published choice-quiz THE completion mechanism — the moment every
// choice question is stored correct, this component marks the lesson complete
// itself, through the lib/progress setter (no new storage, no "finished" flag).
// The invariant "isQuizFinished ⇒ complete" is enforced at two points below (see
// the mastery effect): the flip on the final correct answer, and a mount
// reconciliation that heals any historical hole (a 4.3-era learner who finished
// but never clicked, or finished-then-unmarked). Because SelfCheck renders on
// BOTH hosts, mastery completion now works from /node/[slug] too — a graph-
// arrival learner can complete a lesson without ever opening the course view.
//
// Reflect-only published quizzes (choiceCount === 0) are the exception: finished
// would be vacuously true, so auto-completing on mount would be wrong. Such a
// lesson stays in MANUAL mode (the effect no-ops, the course view keeps the
// button). Grandfathering is one-directional: this effect only ever WRITES
// completion, never removes it — a lesson marked complete before its quiz was
// published stays complete; the quiz just shows its own answered state.
//
// Answered state persists via quiz-progress and rehydrates AFTER mount (the
// LessonCheck no-mismatch pattern): the server HTML and first client render show
// every question unanswered, matching until storage is read. The mastery effect
// is likewise a post-mount localStorage read, so it raises no hydration mismatch.

const PARADIGM_LABEL: Record<string, string> = {
  functionalism: "Functionalism",
  "conflict-theory": "Conflict theory",
  "symbolic-interactionism": "Symbolic interactionism",
};

export default function SelfCheck({ slug, quiz }: { slug: string; quiz: Quiz }) {
  const choiceCount = quiz.questions.filter((q) => q.type === "choice").length;

  // The mastery invariant (4.4): for a published choice-quiz lesson,
  // isQuizFinished ⇒ marked complete. Enforced here, on both hosts.
  //   • The flip — QUIZ_EVENT fires on every quiz write, so the final correct
  //     answer transitions finished false→true and marks in the same frame;
  //     PROGRESS_EVENT then propagates to the syllabus, module fill, and both
  //     canvases with no reload.
  //   • Mount reconciliation — the same check runs once on mount, healing any
  //     lesson that was finished but left unmarked (4.3-era, or finished-then-
  //     unmarked), so the invariant holds unconditionally, not just for post-
  //     deploy interactions.
  // Idempotent by the isComplete guard (marking an already-complete slug is a
  // no-op). Writes ONLY complete, never removes — grandfathering stays one-way.
  // Reflect-only quizzes are excluded: choiceCount === 0 keeps the lesson manual.
  useEffect(() => {
    if (choiceCount <= 0) return; // reflect-only: manual mode, never auto-complete
    const reconcile = () => {
      if (isQuizFinished(slug, choiceCount) && !isComplete(slug)) {
        setComplete(slug, true);
      }
    };
    reconcile();
    window.addEventListener(QUIZ_EVENT, reconcile);
    return () => window.removeEventListener(QUIZ_EVENT, reconcile);
  }, [slug, choiceCount]);

  return (
    <section className="self-check" aria-labelledby="self-check-heading">
      <h2 id="self-check-heading" className="self-check-heading">
        Self-check
      </h2>
      <p className="self-check-intro">
        A few questions to test yourself. Open-book and device-local — nothing is
        graded elsewhere or sent off your device.
      </p>

      <ol className="self-check-list">
        {quiz.questions.map((q, i) => (
          <li key={i} className="self-check-question">
            {q.type === "choice" ? (
              <ChoiceQuestion slug={slug} index={i} question={q} />
            ) : (
              <ReflectQuestion question={q} />
            )}
          </li>
        ))}
      </ol>

      {choiceCount > 0 && <SummaryLine slug={slug} total={choiceCount} />}
    </section>
  );
}

function ChoiceQuestion({
  slug,
  index,
  question,
}: {
  slug: string;
  index: number;
  question: QuizChoiceQuestion;
}) {
  // null until answered; the option index once graded. Read after mount only.
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setChosen(getAnswer(slug, index)?.answered ?? null);
    update();
    window.addEventListener(QUIZ_EVENT, update);
    return () => window.removeEventListener(QUIZ_EVENT, update);
  }, [slug, index]);

  const graded = chosen !== null;
  // Sticky-correct (4.3): a correct answer is terminal for the stored attempt —
  // no "try again", options disabled, the `why` set stays readable. Retry
  // renders only on a miss. Re-take/reset belongs to the deferred
  // spaced-repetition work and is deliberately not offered here.
  const answeredCorrectly =
    graded && question.options[chosen].correct === true;
  const paradigm = question.paradigm
    ? PARADIGM_LABEL[question.paradigm] ?? question.paradigm
    : null;

  const grade = (optionIndex: number) => {
    if (graded) return; // ignore further clicks until "try again"
    setAnswer(slug, index, {
      answered: optionIndex,
      correct: question.options[optionIndex].correct === true,
    });
  };

  return (
    <div className={graded ? "self-check-choice self-check-graded" : "self-check-choice"}>
      {paradigm && (
        <span className="self-check-paradigm">According to {paradigm}</span>
      )}
      <p className="self-check-prompt">{question.prompt}</p>

      <ul className="self-check-options" role="list">
        {question.options.map((opt, optIndex) => {
          const isChosen = chosen === optIndex;
          const revealCorrect = graded && opt.correct;
          const wrongChosen = isChosen && !opt.correct;

          const classes = ["self-check-option"];
          if (revealCorrect) classes.push("self-check-option-correct");
          if (wrongChosen) classes.push("self-check-option-wrong");
          if (isChosen) classes.push("self-check-option-chosen");

          return (
            <li key={optIndex}>
              <button
                type="button"
                className={classes.join(" ")}
                aria-pressed={isChosen}
                disabled={answeredCorrectly}
                onClick={() => grade(optIndex)}
              >
                <span className="self-check-mark" aria-hidden="true">
                  {revealCorrect ? "✓" : wrongChosen ? "✗" : ""}
                </span>
                <span className="self-check-option-text">{opt.text}</span>
              </button>
              {graded && (
                <p className="self-check-why">
                  <span className="visually-hidden">
                    {opt.correct ? "Correct. " : "Incorrect. "}
                  </span>
                  {opt.why}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {graded && !answeredCorrectly && (
        <button
          type="button"
          className="self-check-retry"
          onClick={() => clearAnswer(slug, index)}
        >
          Try again
        </button>
      )}
    </div>
  );
}

function ReflectQuestion({ question }: { question: QuizReflectQuestion }) {
  return (
    <div className="self-check-reflect">
      <span className="self-check-reflect-label">Reflect</span>
      <p className="self-check-prompt">{question.prompt}</p>
      <textarea
        className="self-check-textarea"
        rows={4}
        placeholder="Think it through here…"
        aria-label="Reflection (not saved)"
      />
      <p className="self-check-notice">
        Nothing you type here is saved or sent — it is a thinking space, not a
        submission.
      </p>
    </div>
  );
}

function SummaryLine({ slug, total }: { slug: string; total: number }) {
  const [score, setScore] = useState({ answered: 0, correct: 0 });

  useEffect(() => {
    const update = () => setScore(scoreFor(slug));
    update();
    window.addEventListener(QUIZ_EVENT, update);
    return () => window.removeEventListener(QUIZ_EVENT, update);
  }, [slug]);

  // Quiet, and only once every choice question has been answered.
  if (score.answered < total) return null;

  // Mastery (4.4): only published quizzes render this component, and this line
  // shows only once every choice question is answered. All correct IS the
  // completion moment now — the mastery effect above marks the lesson in the
  // same frame — so the copy reads as done, not as an invitation to click. Plain
  // text; the celebration is the row tint + module fill (the 4.2 animation
  // budget still stands), not anything here.
  const finished = score.correct === total;

  return (
    <p className="self-check-summary" role="status">
      <span className="self-check-score">
        {score.correct} of {total}
      </span>
      {finished ? (
        <span className="self-check-score-note">
          {" "}
          — lesson complete
        </span>
      ) : (
        <span className="self-check-score-note"> · self-check · device-local</span>
      )}
    </p>
  );
}
