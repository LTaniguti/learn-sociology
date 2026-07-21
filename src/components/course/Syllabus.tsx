"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LessonCheck from "./LessonCheck";
import ModuleProgress from "./ModuleProgress";
import ProgressCount from "./ProgressCount";
import {
  getSyllabusCollapsed,
  setSyllabusCollapsed,
} from "@/lib/syllabus";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Mount-only read of a device-local preference on a static export; the
    // re-render is intentional (same justification as the 2.6 hash read).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(getSyllabusCollapsed());
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    setSyllabusCollapsed(next);
  };

  return (
    <aside className={collapsed ? "syllabus syllabus-collapsed" : "syllabus"}>
      {/* Desktop-only affordance (mobile already stacks). Collapsed, sequence
          navigation still lives in the Prev/Next cards below the article. */}
      <button
        type="button"
        className="syllabus-toggle"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Show syllabus" : "Hide syllabus"}
      >
        {collapsed ? "⟩" : "⟨"}
      </button>
      <nav className="syllabus-nav" aria-label="Course syllabus">
        {modules.map((mod) => (
          <details
            key={mod.title}
            className="syllabus-module"
            open={mod.lessons.some((l) => l.slug === currentSlug)}
          >
            <summary className="syllabus-module-title">
              <span className="syllabus-module-name">{mod.title}</span>
              <ModuleProgress slugs={mod.lessons.map((l) => l.slug)} />
            </summary>
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
