import Link from "next/link";
import SearchBox, { type SearchEntry } from "./SearchBox";
import ThemeControl from "./ThemeControl";
import { getAllNodes } from "../../lib/content";

// Shared top bar for all frames (docs/wireframes.md, "Shared shell").
// Course went live with Step 2.5; Hierarchy with 2.6/3.2; Network with 3.3;
// People with 6.3.
//
// All four tabs are live, and the shell no longer has an honest-disabled tab.
// That pattern — a mode advertised as a muted, non-interactive span, on the
// principle that the roadmap is part of the project's identity — held from 3.3
// to 6.2 and RETIRED in 6.3, because every mode the interface advertises now
// exists. The last one it applied to promised "Sociologists", a
// citation-weighted network that docs/people-mode-roadmap.md §1 cancelled; the
// tab is People, and it points at a page. A future planned mode may reinstate
// the pattern (--tab-disabled-text is still in the token set for that), but
// nothing uses it today. See docs/design/components.md → Mode tabs.
export default async function Shell({
  active,
}: {
  active?: "course" | "hierarchy" | "network" | "people";
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
  const networkActive = active === "network";
  const peopleActive = active === "people";
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
        <Link
          href="/network"
          className={networkActive ? "shell-tab shell-tab-active" : "shell-tab"}
          aria-current={networkActive ? "page" : undefined}
        >
          Network
        </Link>
        <Link
          href="/people"
          className={peopleActive ? "shell-tab shell-tab-active" : "shell-tab"}
          aria-current={peopleActive ? "page" : undefined}
        >
          People
        </Link>
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
