import Link from "next/link";
import LessonCheck from "./LessonCheck";
import ProgressCount from "./ProgressCount";

// Frame 1 left sidebar: the syllabus, rendered by walking course.yaml top to
// bottom (titles resolved server-side — this component receives plain data and
// never touches the filesystem). Collapse is native <details>, no JS.

export type SyllabusModule = {
  title: string;
  lessons: { slug: string; title: string }[];
};

export default function Syllabus({
  modules,
  currentSlug,
  allSlugs,
}: {
  modules: SyllabusModule[];
  currentSlug: string;
  allSlugs: string[];
}) {
  return (
    <aside className="syllabus">
      <nav className="syllabus-nav" aria-label="Course syllabus">
        {modules.map((mod) => (
          <details
            key={mod.title}
            className="syllabus-module"
            open={mod.lessons.some((l) => l.slug === currentSlug)}
          >
            <summary className="syllabus-module-title">{mod.title}</summary>
            <ol className="syllabus-lessons">
              {mod.lessons.map((lesson) => (
                <li key={lesson.slug} className="syllabus-lesson">
                  <Link
                    href={`/course/${lesson.slug}`}
                    aria-current={
                      lesson.slug === currentSlug ? "page" : undefined
                    }
                  >
                    {lesson.title}
                  </Link>
                  <LessonCheck slug={lesson.slug} />
                </li>
              ))}
            </ol>
          </details>
        ))}
      </nav>
      <footer className="syllabus-footer">
        <ProgressCount slugs={allSlugs} />
      </footer>
    </aside>
  );
}
