"use client";

import { useEffect, useRef } from "react";

// Giscus lesson forum (Phase 2, Step 2.7). One discussion per lesson, keyed by
// slug via mapping=specific — both /node/[slug] and /course/[slug] share it.
// The script is injected client-side on mount, so exported HTML stays clean.
export default function LessonComments({ slug }: { slug: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.hasChildNodes()) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", "LTaniguti/learn-sociology");
    script.setAttribute("data-repo-id", "R_kgDOTU5rmQ");
    script.setAttribute("data-category", "Lessons");
    script.setAttribute("data-category-id", "DIC_kwDOTU5rmc4DBgJA");
    script.setAttribute("data-mapping", "specific");
    script.setAttribute("data-term", slug);
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-loading", "lazy");
    // Theme follows the OS for now; revisit alongside site theming in 2.9.
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "en");
    container.appendChild(script);
  }, [slug]);

  return (
    <section className="lesson-comments">
      <h2>Discussion</h2>
      <div ref={containerRef} />
    </section>
  );
}
