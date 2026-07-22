import Link from "next/link";
import Shell from "@/components/Shell";
import NetworkSnapshot from "@/components/home/NetworkSnapshot";
import { type GraphInput } from "@/components/network/graph";
import { getAllNodes, getTree } from "../../lib/content";
// Reuses the shell styles that live with the node route (see CourseView).
import "@/app/node/[slug]/node-page.css";
import "./home.css";

const REPO_URL = "https://github.com/LTaniguti/learn-sociology";

// Real homepage (Phase 5.0) — replaces the Step 2.5 structure-only landing.
// Hero with a live build-time network snapshot, the four modes as cards
// (Sociologists honest-disabled, mirroring the Shell tab), a contribute band
// sourced from CONTRIBUTING.md, and a repo/license footer. Server component
// throughout — nothing on this page needs interactivity beyond what the Shell
// brings.
export default async function Home() {
  const nodes = await getAllNodes();
  // The concept count is derived from the content pipeline, never hardcoded —
  // the lede stays true as contributors add nodes.
  const conceptCount = nodes.length;
  // Same inputs the /network page assembles for its canvas.
  const input: GraphInput[] = nodes.map((n) => ({
    slug: n.slug,
    title: n.title,
    summary: n.summary,
    difficulty: n.difficulty,
    status: n.status,
    tags: n.tags,
    prerequisites: n.prerequisites,
    related: n.related,
  }));
  const tree = await getTree();

  return (
    <>
      <Shell />
      <main className="home">
        {/* ---- Hero ---- */}
        <section className="home-hero" aria-label="Introduction">
          <div className="home-hero-text">
            <h1 className="home-title">
              Learn sociology the way ideas actually connect.
            </h1>
            <p className="home-lede">
              Free and open: {conceptCount}&nbsp;concepts drawn into one graph
              — walk it in order as a course, or jump straight to the ideas
              you&rsquo;re after.
            </p>
            <div className="home-ctas">
              <Link href="/course" className="home-cta-primary">
                Start the course
              </Link>
              <Link href="/network" className="home-cta-secondary">
                Explore the concept map
              </Link>
            </div>
          </div>
          <NetworkSnapshot input={input} tree={tree} />
        </section>

        {/* ---- Modes grid ---- */}
        <section className="home-modes" aria-labelledby="home-modes-heading">
          <h2 id="home-modes-heading" className="home-eyebrow">
            Four ways in
          </h2>
          <div className="home-modes-grid">
            <Link href="/course" className="home-card">
              <span
                className="home-card-chip home-card-chip-functionalism"
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" focusable="false">
                  <path d="M4 5.5h12M4 10h12M4 14.5h8" />
                  <path d="M15 12.5l2.5 2-2.5 2" fill="none" />
                </svg>
              </span>
              <h3 className="home-card-title">Linear course</h3>
              <p className="home-card-body">
                A curated path through every module in teaching order, with
                progress kept on your device.
              </p>
            </Link>
            <Link href="/hierarchy" className="home-card">
              <span
                className="home-card-chip home-card-chip-conflict"
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" focusable="false">
                  <path d="M10 5v4M10 9l-5 4M10 9l5 4" fill="none" />
                  <circle cx="10" cy="4.5" r="2" />
                  <circle cx="4.5" cy="14.5" r="2" />
                  <circle cx="15.5" cy="14.5" r="2" />
                </svg>
              </span>
              <h3 className="home-card-title">Concept hierarchy</h3>
              <p className="home-card-body">
                The discipline as a tree — fields, subfields, and concepts,
                from the root down.
              </p>
            </Link>
            <Link href="/network" className="home-card">
              <span
                className="home-card-chip home-card-chip-interactionism"
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" focusable="false">
                  <path d="M10 5L5 15M10 5l5 10M5 15h10" fill="none" />
                  <circle cx="10" cy="5" r="2" />
                  <circle cx="5" cy="15" r="2" />
                  <circle cx="15" cy="15" r="2" />
                </svg>
              </span>
              <h3 className="home-card-title">Concept network</h3>
              <p className="home-card-body">
                Every prerequisite and relationship as a navigable map of how
                the ideas connect.
              </p>
            </Link>
            {/* Honest-disabled, mirroring the Shell's Sociologists tab: the
                roadmap is advertised, not hidden — muted, no link semantics,
                skipped by tab order. */}
            <div className="home-card home-card-disabled">
              <span className="home-card-chip" aria-hidden="true">
                <svg viewBox="0 0 20 20" focusable="false">
                  <circle cx="10" cy="7" r="3" />
                  <path d="M4.5 16.5c0-3 2.5-4.8 5.5-4.8s5.5 1.8 5.5 4.8" fill="none" />
                </svg>
              </span>
              <h3 className="home-card-title">
                Sociologists <span className="home-card-planned">planned</span>
              </h3>
              <p className="home-card-body">
                Profiles of the thinkers behind these concepts, linked into the
                graph where their ideas appear.
              </p>
            </div>
          </div>
        </section>

        {/* ---- Contribute band ---- */}
        <section
          className="home-contribute"
          aria-labelledby="home-contribute-heading"
        >
          <div className="home-contribute-main">
            <h2 id="home-contribute-heading" className="home-contribute-title">
              Built in the open
            </h2>
            <p>
              The content is adapted from OpenStax{" "}
              <em>Introduction to Sociology 3e</em> (CC BY 4.0), the code is
              MIT, and the whole thing is a public repository anyone can read —
              and improve.
            </p>
            <p>
              Every seed concept already exists with complete metadata and a
              placeholder body: each stub is an article waiting for an author.
              Writing a lesson happens entirely in the browser — no local setup
              — following the step-by-step tutorial. Claim a concept by
              commenting on its module Issue, submit your work as a draft pull
              request, and review takes it from there.
            </p>
            <p className="home-contribute-links">
              <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>
                How to contribute →
              </a>
              <a href={`${REPO_URL}/blob/main/docs/writing-a-lesson.md`}>
                Write your first lesson →
              </a>
            </p>
          </div>
          <ul className="home-contribute-steps">
            <li>Write a lesson — all in the browser</li>
            <li>Claim a concept with an Issue</li>
            <li>Open a pull request as a draft</li>
          </ul>
        </section>

        {/* ---- Footer ---- */}
        <footer className="home-footer">
          <div className="home-footer-repo">
            <a
              href={REPO_URL}
              className="home-footer-mark"
              aria-label="learn-sociology on GitHub"
            >
              {/* The official GitHub mark, monochrome via currentColor so it
                  themes by inversion — unmodified, per GitHub's logo usage
                  rules. */}
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                />
              </svg>
            </a>
            <span className="home-footer-path">LTaniguti/learn-sociology</span>
          </div>
          <p className="home-footer-license">
            MIT code · CC BY 4.0 content · adapted from{" "}
            <span className="home-footer-source">
              OpenStax Introduction to Sociology 3e
            </span>
            . Changes were made to the original.
          </p>
        </footer>
      </main>
    </>
  );
}
