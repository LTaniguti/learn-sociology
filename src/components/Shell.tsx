import Link from "next/link";
import SearchBox, { type SearchEntry } from "./SearchBox";
import ThemeControl from "./ThemeControl";
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
      <Link href="/" className="shell-home" aria-label="learn-sociology">
        {/* Inlined rather than <img src="logo-lockup.svg"> (Step 3.1): the
            file bakes in the dark palette, so on the light theme the mark and
            wordmark vanished into the paper. Inline, the ink inherits
            currentColor from .shell-home and the node dot reads --color-accent,
            so the lockup themes with everything else. Matches the light
            acceptance render, which draws the wordmark in
            var(--color-text-heading). docs/design/logo/ keeps the standalone
            files for external use. */}
        <svg
          className="shell-logo"
          viewBox="0 0 232 32"
          role="img"
          aria-hidden="true"
          focusable="false"
        >
          <g stroke="currentColor" strokeWidth="1.6">
            <line x1="8" y1="22" x2="16" y2="9" />
            <line x1="16" y1="9" x2="24" y2="22" />
            <line x1="8" y1="22" x2="24" y2="22" />
          </g>
          <circle
            cx="8"
            cy="22"
            r="3.4"
            fill="var(--color-surface-raised)"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle
            cx="24"
            cy="22"
            r="3.4"
            fill="var(--color-surface-raised)"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle cx="16" cy="9" r="4.2" fill="var(--color-accent)" />
          <text
            x="38"
            y="22"
            fontFamily="var(--type-wordmark-family)"
            fontWeight="var(--type-wordmark-weight)"
            fontSize="18"
            fill="currentColor"
          >
            learn-sociology
          </text>
        </svg>
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
      {/* Theme switcher (Step 3.1). Since 3.3 it opens the right-hand chrome
          cluster and carries the `margin-left: auto` that pushes the pair
          clear of the tab group. */}
      <ThemeControl />
      {/* Search shipped in Step 2.10. Scope narrowed from the wireframe's
          `title` + `summary` to **title only**: summary matches surface rows
          whose visible label doesn't contain the query, which reads as noise
          at this corpus size. Revisit if the corpus grows.
          Rightmost as of 3.3 — it is the widest control and the one that grows
          to a full row when the bar wraps, so it ends the line. */}
      <SearchBox index={index} />
    </header>
  );
}
