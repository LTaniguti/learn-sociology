import Link from "next/link";
import Shell from "@/components/Shell";
// Reuses the shell styles that live with the node route (see CourseView).
import "@/app/node/[slug]/node-page.css";

// Minimal real landing (Step 2.5) — structure only; styling is Step 2.9.
export default function Home() {
  return (
    <>
      <Shell />
      <main className="landing">
        <h1>learn-sociology</h1>
        <p>
          An open-source, graph-navigable platform for self-learning Sociology.
          Instead of a single fixed sequence of lessons, the discipline is
          treated as a network of interconnected concepts that learners can
          navigate in whatever way suits them — a traditional course order, a
          top-down concept hierarchy, or free exploration through the links
          between ideas.
        </p>
        <ul className="landing-links">
          <li>
            <Link href="/course">Start the course</Link>
          </li>
          <li>
            <a href="https://github.com/LTaniguti/learn-sociology">
              GitHub repository
            </a>
          </li>
        </ul>
      </main>
    </>
  );
}
