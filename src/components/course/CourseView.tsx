import Link from "next/link";
import Shell from "@/components/Shell";
import NodeArticle from "@/components/NodeArticle";
import Syllabus, { type SyllabusModule } from "./Syllabus";
import MarkCompleteButton from "./MarkCompleteButton";
import { getAllNodes, getCourse, getQuiz } from "../../../lib/content";
// The article styles live with the /node route; Mode 1 renders the same
// article and reuses them (the import is deduplicated by the bundler).
import "@/app/node/[slug]/node-page.css";
import "./course.css";

// Frame 1 — Mode 1 course view: a navigation shell around NodeArticle, never
// a second content renderer. Everything positional (sidebar order, position
// line, Prev/Next) is server-computed from course.yaml, the single source of
// course order; only progress UI is client-side.

export default async function CourseView({ slug }: { slug: string }) {
  const course = getCourse();
  const titles = new Map(
    (await getAllNodes()).map((n) => [n.slug, n.title])
  );

  const titleOf = (s: string): string => {
    const title = titles.get(s);
    if (!title) {
      throw new Error(`course.yaml lists '${s}' but no content file exists`);
    }
    return title;
  };

  const modules: SyllabusModule[] = course.modules.map((m) => ({
    title: m.title,
    lessons: m.nodes.map((s) => ({ slug: s, title: titleOf(s) })),
  }));

  // Prev/Next order is the manifest flattened across module boundaries.
  const flat = course.modules.flatMap((m) => m.nodes);
  const flatIndex = flat.indexOf(slug);
  if (flatIndex === -1) {
    throw new Error(`Lesson not in course.yaml: ${slug}`);
  }
  const moduleIndex = course.modules.findIndex((m) => m.nodes.includes(slug));
  const currentModule = course.modules[moduleIndex];
  const lessonIndex = currentModule.nodes.indexOf(slug);

  const prevSlug = flatIndex > 0 ? flat[flatIndex - 1] : null;
  const nextSlug = flatIndex < flat.length - 1 ? flat[flatIndex + 1] : null;

  // The completion gate (4.3): getQuiz already returns null for missing/draft
  // quizzes (the published filter lives there), so its truthiness IS
  // hasPublishedQuiz — no separate content.ts helper needed. The choice-only
  // count is what the gate must reach.
  const quiz = getQuiz(slug);
  const choiceCount = quiz
    ? quiz.questions.filter((q) => q.type === "choice").length
    : 0;

  return (
    <>
      <Shell active="course" />
      <div className="course-layout">
        <Syllabus modules={modules} currentSlug={slug} allSlugs={flat} />
        <div className="course-main">
          <NodeArticle
            slug={slug}
            showPrereqCompletion
            beforeTitle={
              <p className="position-line">
                Module {moduleIndex + 1} · Lesson {lessonIndex + 1} of{" "}
                {currentModule.nodes.length}
              </p>
            }
            afterArticle={
              <div className="course-controls">
                <MarkCompleteButton
                  slug={slug}
                  hasPublishedQuiz={quiz !== null}
                  choiceCount={choiceCount}
                />
                <nav className="prev-next" aria-label="Previous and next lessons">
                  {prevSlug ? (
                    <Link
                      className="prev-next-card prev-link"
                      href={`/course/${prevSlug}`}
                    >
                      <span className="prev-next-label">← Previous</span>
                      <span className="prev-next-title">
                        {titleOf(prevSlug)}
                      </span>
                    </Link>
                  ) : (
                    <span
                      className="prev-next-card prev-link prev-next-disabled"
                      aria-disabled="true"
                    >
                      <span className="prev-next-label">← Previous</span>
                      <span className="prev-next-title">Start of course</span>
                    </span>
                  )}
                  {nextSlug ? (
                    <Link
                      className="prev-next-card next-link"
                      href={`/course/${nextSlug}`}
                    >
                      <span className="prev-next-label">Next →</span>
                      <span className="prev-next-title">
                        {titleOf(nextSlug)}
                      </span>
                    </Link>
                  ) : (
                    <span
                      className="prev-next-card next-link prev-next-disabled"
                      aria-disabled="true"
                    >
                      <span className="prev-next-label">Next →</span>
                      <span className="prev-next-title">End of course</span>
                    </span>
                  )}
                </nav>
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}
