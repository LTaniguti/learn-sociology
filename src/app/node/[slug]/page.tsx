import type { Metadata } from "next";
import Shell from "@/components/Shell";
import NodeArticle from "@/components/NodeArticle";
import { getAllSlugs, getNode } from "../../../../lib/content";
import "./node-page.css";

// Static export has no server: every slug must be known at build time, and an
// unknown slug must fail the build rather than fall through to a runtime 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const node = await getNode((await params).slug);
  return { title: `${node.title} — learn-sociology`, description: node.summary };
}

export default async function NodePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <>
      <Shell />
      <NodeArticle slug={slug} />
    </>
  );
}
