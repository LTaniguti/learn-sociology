"use client";

import { useEffect, useRef } from "react";
import { getTheme, THEME_EVENT, type Theme } from "@/lib/theme";

// Giscus lesson forum (Phase 2, Step 2.7). One discussion per lesson, keyed by
// slug via mapping=specific — both /node/[slug] and /course/[slug] share it.
// The script is injected client-side on mount, so exported HTML stays clean.

// Theme mapping (3.4, completing 3.3's start). All three themes now use
// token-matched custom stylesheets instead of any giscus built-in. The two
// dark themes derive from `noborder_dark`; the light theme (3.4) derives from
// the built-in `light`, re-skinning its GitHub-green/blue accents with the
// palette's derived deep amber — the green clashed with the warm paper.
// A URL is a valid `theme` value, so this needs no mechanism beyond the
// existing origin-pinned setConfig postMessage below.
//
// The URLs are absolute and point at the deployed site because giscus loads
// them into a cross-origin iframe: a relative path would resolve against
// giscus.app. Consequence — local dev pulls the *deployed* CSS, so edits to
// public/giscus/*.css are only visible after they ship. All three files carry
// a token → hex sync map in their header.
const GISCUS_CSS_BASE = "https://ltaniguti.github.io/learn-sociology/giscus";

const GISCUS_THEME: Record<Theme, string> = {
  default: `${GISCUS_CSS_BASE}/default.css`,
  midnight: `${GISCUS_CSS_BASE}/midnight.css`,
  light: `${GISCUS_CSS_BASE}/light.css`,
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
