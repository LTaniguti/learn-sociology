"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Shell search (Step 2.10). Scope decision: title only — see the note in
// Shell.tsx. The index is a prop, built server-side from the content pipeline,
// so there is no fetch and nothing to keep in sync at runtime.

export type SearchEntry = { title: string; slug: string };

// Row cap is visual, not a filter: all matches render and the popover scrolls
// past ~8 (max-height in node-page.css).

export default function SearchBox({ index }: { index: SearchEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const matches = q
    ? index.filter((e) => e.title.toLowerCase().includes(q))
    : [];
  const showPopover = open && q.length > 0;

  useEffect(() => {
    if (!showPopover) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showPopover]);

  const go = (slug: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/node/${slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setQuery("");
      setOpen(false);
      return;
    }
    if (!showPopover || matches.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(matches[active].slug);
    }
  };

  return (
    <span className="shell-search" ref={wrapRef}>
      <span className="shell-search-glyph" aria-hidden="true">
        ⌕
      </span>
      <input
        className="shell-search-input"
        type="search"
        placeholder="search lesson titles…"
        aria-label="Search lesson titles"
        role="combobox"
        aria-expanded={showPopover}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showPopover && (
        <ul className="search-results" id={listId} role="listbox">
          {matches.length === 0 ? (
            <li className="search-empty" role="option" aria-selected="false">
              no matching titles
            </li>
          ) : (
            matches.map((entry, i) => (
              <li
                key={entry.slug}
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                className={
                  i === active ? "search-result search-result-active" : "search-result"
                }
                onMouseEnter={() => setActive(i)}
                onClick={() => go(entry.slug)}
              >
                <span className="search-result-title">{entry.title}</span>
                <span className="search-result-slug">{entry.slug}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </span>
  );
}
