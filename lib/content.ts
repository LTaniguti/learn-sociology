// Server/build-time only. This module reads the filesystem during builds
// and static generation. It must never be imported into client code.
// Utilities needed client-side are passed as props from server components.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { load } from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "content");
const QUIZ_DIR = path.join(CONTENT_DIR, "quizzes");

export type NodeFrontmatter = {
  title: string;
  summary: string;
  parent: string | null; // null only for the root node "sociology"
  prerequisites: string[];
  tags: string[];
  difficulty: "intro" | "intermediate" | "advanced";
  status: "stub" | "draft" | "review" | "published";
  related?: string[];
  thinkers?: string[];
  adapted_from?: string; // e.g., "OpenStax Introduction to Sociology 3e, Section 1.1"
};

export type ConceptNode = NodeFrontmatter & {
  slug: string;
  html: string; // rendered body
};

export type CourseModule = { title: string; nodes: string[] };
export type Course = { course: string; modules: CourseModule[] };

// ===== Self-check quizzes (companion files; see docs/quiz-schema.md) =====
// Quizzes live in content/quizzes/<slug>.yml, never in node frontmatter — the
// ten-field frontmatter budget is spent. The schema is validated by
// scripts/lint-quizzes.mjs; these types mirror the shapes it enforces.

export type QuizChoiceOption = { text: string; correct: boolean; why: string };
export type QuizChoiceQuestion = {
  type: "choice";
  prompt: string;
  paradigm: string | null;
  options: QuizChoiceOption[];
};
export type QuizReflectQuestion = { type: "reflect"; prompt: string };
export type QuizQuestion = QuizChoiceQuestion | QuizReflectQuestion;
export type Quiz = {
  version: number;
  status: "draft" | "published";
  adapted_from?: string;
  questions: QuizQuestion[];
};

export type TreeNode = { slug: string; title: string; children: TreeNode[] };

// ===== Slugs =====

export function getAllSlugs(): string[] {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
  return files;
}

// ===== Single Node =====

let allNodesCache: ConceptNode[] | null = null;

export async function getNode(slug: string): Promise<ConceptNode> {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Node not found: ${slug}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const { data, content: body } = matter(content);

  const fm = data as NodeFrontmatter;

  // Validate required fields
  const required: (keyof NodeFrontmatter)[] = [
    "title",
    "summary",
    "parent",
    "prerequisites",
    "tags",
    "difficulty",
    "status",
  ];
  for (const field of required) {
    if (field === "parent" && fm.parent === null) {
      // parent: null is valid for the root node
      continue;
    }
    if (!(field in fm) || fm[field] === undefined || fm[field] === null) {
      throw new Error(`${slug}: missing required field '${field}'`);
    }
  }

  // Render HTML from markdown body
  const renderedHtml = await remark().use(html).process(body);
  const htmlString = renderedHtml.toString();

  return {
    ...fm,
    slug,
    html: htmlString,
  };
}

// ===== All Nodes (cached) =====

export async function getAllNodes(): Promise<ConceptNode[]> {
  if (allNodesCache !== null) {
    return allNodesCache;
  }

  const slugs = getAllSlugs();
  const nodes: ConceptNode[] = [];

  for (const slug of slugs) {
    const node = await getNode(slug);
    nodes.push(node);
  }

  allNodesCache = nodes;
  return nodes;
}

// ===== Quiz (published only) =====

// Returns the quiz for a node, or null when there is no quiz file or the quiz
// is not `status: published`. The draft filter lives HERE, in the loader, not
// in the component: a draft quiz must never ship in the page payload at all.
// A `published` quiz on a `stub` node is a lint error (scripts/lint-quizzes.mjs),
// so that case cannot reach a build.
export function getQuiz(slug: string): Quiz | null {
  const filePath = path.join(QUIZ_DIR, `${slug}.yml`);
  if (!fs.existsSync(filePath)) return null;

  const quiz = load(fs.readFileSync(filePath, "utf8")) as Quiz;
  if (!quiz || quiz.status !== "published") return null;
  return quiz;
}

// ===== Course Manifest =====

export function getCourse(): Course {
  const courseFile = path.join(CONTENT_DIR, "course.yaml");
  const content = fs.readFileSync(courseFile, "utf8");
  const course = load(content) as Course;
  return course;
}

// ===== Tree Hierarchy =====

export async function getTree(): Promise<TreeNode> {
  const nodes = await getAllNodes();
  const nodeMap = new Map(nodes.map((n) => [n.slug, n]));

  // Find the root (parent: null)
  const roots = nodes.filter((n) => n.parent === null);
  if (roots.length !== 1) {
    throw new Error(
      `Tree integrity error: expected exactly one root, found ${roots.length}`
    );
  }

  const root = roots[0];

  // Check for cycles
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  function hasCycle(slug: string): boolean {
    if (inProgress.has(slug)) return true;
    if (visited.has(slug)) return false;

    inProgress.add(slug);
    const node = nodeMap.get(slug);
    if (node && node.parent && nodeMap.has(node.parent)) {
      if (hasCycle(node.parent)) return true;
    }
    inProgress.delete(slug);
    visited.add(slug);
    return false;
  }

  for (const slug of nodeMap.keys()) {
    if (hasCycle(slug)) {
      throw new Error(`Tree integrity error: cycle detected through ${slug}`);
    }
  }

  // Load course ordering to sort children
  const course = getCourse();
  const courseOrder = course.modules.flatMap((m) => m.nodes);
  const orderMap = new Map(courseOrder.map((slug, i) => [slug, i]));

  // Build tree
  function buildTree(slug: string): TreeNode {
    const node = nodeMap.get(slug);
    if (!node) {
      throw new Error(`Node not found: ${slug}`);
    }

    // Find children of this node
    const children = nodes
      .filter((n) => n.parent === slug)
      .sort((a, b) => {
        const orderA = orderMap.get(a.slug) ?? Infinity;
        const orderB = orderMap.get(b.slug) ?? Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return a.slug.localeCompare(b.slug); // fallback to alphabetical
      })
      .map((child) => buildTree(child.slug));

    return {
      slug,
      title: node.title,
      children,
    };
  }

  return buildTree(root.slug);
}
