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
  QUIZ_EVENT,
} from "@/lib/quiz-progress";
import "./self-check.css";

// Self-check quiz (Phase 4.1), rendered below the lesson body on BOTH hosts of
// NodeArticle — /node/[slug] and the course lesson view — so graph-arrival and
// Mode 1 learners get the same surface. Only `published` quizzes reach here
// (the loader filters drafts out of the payload), so this component never has
// to reason about status.
//
// Open-book by design: this is self-assessment, not certification. No badges,
// no confetti. As of 4.3 (doctrine reversal from 4.1) a published quiz DOES
// gate its lesson's completion in course mode — but only by UNLOCKING the
// MarkCompleteButton once every choice question is correct; this component never
// marks a lesson complete itself. On /node/[slug] there is no such button, so
// the quiz is purely informative there. Answered state persists via
// quiz-progress and rehydrates AFTER mount (the LessonCheck no-mismatch
// pattern): the server HTML and first client render show every question
// unanswered, matching until storage is read.

const PARADIGM_LABEL: Record<string, string> = {
  functionalism: "Functionalism",
  "conflict-theory": "Conflict theory",
  "symbolic-interactionism": "Symbolic interactionism",
};

export default function SelfCheck({ slug, quiz }: { slug: string; quiz: Quiz }) {
  const choiceCount = quiz.questions.filter((q) => q.type === "choice").length;

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

  // The gate (4.3): only published quizzes render this component, so every
  // choice question correct means the lesson can now be marked complete. Plain
  // text acknowledgment — the button enables live; no celebration here.
  const finished = score.correct === total;

  return (
    <p className="self-check-summary" role="status">
      <span className="self-check-score">
        {score.correct} of {total}
      </span>
      {finished ? (
        <span className="self-check-score-note">
          {" "}
          — you can mark this lesson complete
        </span>
      ) : (
        <span className="self-check-score-note"> · self-check · device-local</span>
      )}
    </p>
  );
}
