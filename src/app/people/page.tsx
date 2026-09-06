import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PeopleIndex from "@/components/people/PeopleIndex";
import { getPeopleIndex } from "../../../lib/content";
// Shell / chips / type roles live with the node route (see CourseView).
import "@/app/node/[slug]/node-page.css";
import "./people-index.css";

// The People index (6.3) — Mode 4's front door, and the page that makes People
// a mode rather than a set of pages reachable by link. Server-enriches, client
// renders: getPeopleIndex derives both orderings at build time and the client
// component only selects between them (see PeopleIndex.tsx), the same division
// the hierarchy route uses. lib/content stays server-only.

export const metadata: Metadata = {
  title: "People — learn-sociology",
  description:
    "The people behind the concepts, grouped by when they were born.",
};

export default async function PeoplePage() {
  const index = await getPeopleIndex();

  return (
    <>
      <Shell active="people" />
      <main className="people-page">
        <PeopleIndex index={index} />
      </main>
    </>
  );
}
