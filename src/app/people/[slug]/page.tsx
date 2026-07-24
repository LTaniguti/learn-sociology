import type { Metadata } from "next";
import Shell from "@/components/Shell";
import PersonArticle from "@/components/PersonArticle";
import { getAllPersonSlugs, getPerson } from "../../../../lib/content";
// The article styles live with the /node route; this is the third host that
// renders the same article panel and reuses them (the import is deduplicated
// by the bundler).
import "@/app/node/[slug]/node-page.css";
import "./person-page.css";

// Static export has no server: every slug must be known at build time, and an
// unknown slug must fail the build rather than fall through to a runtime 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPersonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const person = await getPerson((await params).slug);
  return {
    title: `${person.name} — learn-sociology`,
    description: person.summary,
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <Shell />
      <PersonArticle slug={slug} />
    </>
  );
}
