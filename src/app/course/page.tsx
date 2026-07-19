import type { Metadata } from "next";
import CourseView from "@/components/course/CourseView";
import { getCourse, getNode } from "../../../lib/content";

// Static export has no redirects, so the course index *is* the first lesson
// of the manifest rather than redirecting to it.
function firstLesson(): string {
  return getCourse().modules[0].nodes[0];
}

export async function generateMetadata(): Promise<Metadata> {
  const node = await getNode(firstLesson());
  return { title: `${node.title} — learn-sociology`, description: node.summary };
}

export default async function CourseIndexPage() {
  return <CourseView slug={firstLesson()} />;
}
