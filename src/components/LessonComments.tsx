"use client";

import { useEffect, useRef } from "react";
import { getTheme, THEME_EVENT, type Theme } from "@/lib/theme";

// Giscus lesson forum (Phase 2, Step 2.7). One discussion per lesson, keyed by
// slug via mapping=specific — both /node/[slug] and /course/[slug] share it.
// The script is injected client-side on mount, so exported HTML stays clean.

// Borderless dark blends best into the surrounding warm-dark panel
// (dark_dimmed's blue-gray frame clashes with the Open Commons palette), and
// midnight is dark enough to share it. Light gets the built-in light theme.
// TODO(post-2.9): ship a token-matched custom Giscus theme via CSS URL,
// covering all three site themes rather than approximating them with two
// built-ins.
const GISCUS_THEME: Record<Theme, string> = {
  default: "noborder_dark",
  midnight: "noborder_dark",
  light: "light",
};

const GISCUS_ORIGIN = "https://giscus.app";

export default function LessonComments({ slug }: { slug: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.hasChildNodes()) return;

    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
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
    script.setAttribute("data-theme", GISCUS_THEME[getTheme()]);
    script.setAttribute("data-lang", "en");
    container.appendChild(script);
  }, [slug]);

  // Theme changes are pushed to the existing embed via postMessage rather than
  // re-rendering with a new `theme` prop: re-mounting the script tears down and
  // refetches the thread, which loses scroll position and any half-typed
  // comment. The iframe appears asynchronously, so it is looked up at event
  // time rather than captured on mount.
  useEffect(() => {
    const onThemeChange = () => {
      const frame = containerRef.current?.querySelector<HTMLIFrameElement>(
        "iframe.giscus-frame"
      );
      frame?.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: GISCUS_THEME[getTheme()] } } },
        GISCUS_ORIGIN
      );
    };
    window.addEventListener(THEME_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_EVENT, onThemeChange);
  }, []);

  return (
    <section className="lesson-comments">
      <h2>Discussion</h2>
      <div ref={containerRef} />
    </section>
  );
}
