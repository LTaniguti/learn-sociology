import type { Metadata } from "next";
import CourseView from "@/components/course/CourseView";
import { getCourse, getNode } from "../../../../lib/content";

// Static export has no server: every slug must be known at build time, and an
// unknown slug must fail the build rather than fall through to a runtime 404.
export const dynamicParams = false;

export function generateStaticParams() {
  // course.yaml (flattened module order) is the only source of course
  // membership — a node outside the manifest has no Mode 1 page.
  return getCourse()
    .modules.flatMap((m) => m.nodes)
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const node = await getNode((await params).slug);
  return { title: `${node.title} — learn-sociology`, description: node.summary };
}

export default async function CourseLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <CourseView slug={(await params).slug} />;
}
