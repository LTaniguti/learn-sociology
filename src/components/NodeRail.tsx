"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getRailCollapsed, setRailCollapsed } from "@/lib/rail";

// Node-page right rail (Step 3.1), mirroring the 2.10 course-sidebar toggle.
// A client shell around server-rendered children: the rail's contents stay in
// NodeArticle (a server component) and only the collapse state lives here.
export default function NodeRail({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Mount-only read of a device-local preference on a static export; the
    // re-render is intentional (same justification as the 2.6 hash read).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(getRailCollapsed());
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    setRailCollapsed(next);
  };

  return (
    <aside className={collapsed ? "node-rail node-rail-collapsed" : "node-rail"}>
      {/* Desktop-only affordance — below 900px the rail already stacks under
          the article, where hiding it would only cost the reader content. */}
      <button
        type="button"
        className="node-rail-toggle"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Show details" : "Hide details"}
      >
        {collapsed ? "⟨" : "⟩"}
      </button>
      <div className="node-rail-content">{children}</div>
    </aside>
  );
}
