import Link from "next/link";
import SearchBox, { type SearchEntry } from "./SearchBox";
import { getAllNodes } from "../../lib/content";

// Shared top bar for all frames (docs/wireframes.md, "Shared shell").
// Network and Sociologists are rendered disabled, not hidden: the four-mode
// roadmap is part of the project's identity and the UI advertises it honestly.
// Course went live with Step 2.5; Hierarchy with Step 2.6.
export default async function Shell({
  active,
}: {
  active?: "course" | "hierarchy";
}) {
  // Search index: every node, any status. Built here rather than plumbed
  // through each page — Shell is a server component with pipeline access, and
  // at 53 nodes the array inlines into the static export.
  const index: SearchEntry[] = (await getAllNodes()).map((n) => ({
    title: n.title,
    slug: n.slug,
  }));
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
      {/* Search shipped in Step 2.10. Scope narrowed from the wireframe's
          `title` + `summary` to **title only**: summary matches surface rows
          whose visible label doesn't contain the query, which reads as noise
          at this corpus size. Revisit if the corpus grows. */}
      <SearchBox index={index} />
    </header>
  );
}
