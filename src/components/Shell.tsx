import Link from "next/link";

// Shared top bar for all frames (docs/wireframes.md, "Shared shell").
// Network and Sociologists are rendered disabled, not hidden: the four-mode
// roadmap is part of the project's identity and the UI advertises it honestly.
// Course went live with Step 2.5; Hierarchy with Step 2.6.
export default function Shell({
  active,
}: {
  active?: "course" | "hierarchy";
}) {
  const courseActive = active === "course";
  const hierarchyActive = active === "hierarchy";
  return (
    <header className="shell">
      <Link href="/" className="shell-home">
        learn-sociology
      </Link>
      <nav className="shell-tabs" aria-label="Mode switcher">
        <Link
          href="/course"
          className={courseActive ? "shell-tab shell-tab-active" : "shell-tab"}
          aria-current={courseActive ? "page" : undefined}
        >
          Course
        </Link>
        <Link
          href="/hierarchy"
          className={
            hierarchyActive ? "shell-tab shell-tab-active" : "shell-tab"
          }
          aria-current={hierarchyActive ? "page" : undefined}
        >
          Hierarchy
        </Link>
        <span
          className="shell-tab shell-tab-disabled"
          aria-disabled="true"
          title="Coming soon"
        >
          Network
        </span>
        <span
          className="shell-tab shell-tab-disabled"
          aria-disabled="true"
          title="Coming soon"
        >
          Sociologists
        </span>
      </nav>
      {/* TODO: search is not part of Step 2.4. When implemented it operates
          over `title` + `summary` only (docs/wireframes.md, shared shell).
          Styled per spec while disabled — it advertises the roadmap honestly
          (direction.md rule 5). */}
      <span className="shell-search">
        <span className="shell-search-glyph" aria-hidden="true">
          ⌕
        </span>
        <input
          className="shell-search-input"
          type="search"
          placeholder="search title / summary…"
          aria-label="Search lessons"
          disabled
        />
      </span>
    </header>
  );
}
