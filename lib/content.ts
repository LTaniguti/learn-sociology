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
import { toString as mdToString } from "mdast-util-to-string";
import type { Root, RootContent, List, Paragraph } from "mdast";

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

// ===== Structured Perspectives (Phase 4.5) =====
// The `## Perspectives` section is extracted from the body at build time and
// rendered as paradigm-accented cards (see src/components/Perspectives.tsx and
// docs/design/components.md). Extraction is a pure function of the file: same
// markdown in, same structure out, computed only here at build/static-gen time.

export type Paradigm = "functionalism" | "conflict" | "interactionism";

// One reading/response inside the Perspectives section. `paradigm` is null when
// the label matches no alias (a neutral card — an unrecognized or future
// paradigm renders un-accented rather than being dropped or mis-attributed).
export type PerspectiveItem = {
  paradigm: Paradigm | null;
  label: string; // the authored label (heading text or bold lead)
  html: string; // the reading's body, rendered with the article's prose styles
};

export type Perspectives = {
  intro: string | null; // prose between the heading and the first item, if any
  items: PerspectiveItem[];
};

export type ConceptNode = NodeFrontmatter & {
  slug: string;
  html: string; // full rendered body (unchanged path — the null-Perspectives case)
  // When `perspectives` is non-null, NodeArticle renders htmlBefore → cards →
  // htmlAfter in place of `html`. When null, `html` is used as-is (identical to
  // pre-4.5 output), so a lesson with no Perspectives section is byte-identical.
  htmlBefore: string;
  htmlAfter: string;
  perspectives: Perspectives | null;
};

// Alias table: matched case-insensitively as a substring of the item label.
// Deliberately tiny and explicit — a future paradigm (a feminist reading, say)
// arrives as a neutral card with zero code change here, and earns its own accent
// only when the taxonomy formally grows and a row is added.
const PARADIGM_ALIASES: { match: string; paradigm: Paradigm }[] = [
  { match: "functionalis", paradigm: "functionalism" },
  { match: "conflict", paradigm: "conflict" },
  { match: "interaction", paradigm: "interactionism" },
  { match: "symbolic", paradigm: "interactionism" },
];

function attributeParadigm(label: string): Paradigm | null {
  const l = label.toLowerCase();
  for (const { match, paradigm } of PARADIGM_ALIASES) {
    if (l.includes(match)) return paradigm;
  }
  return null;
}

// Shared processor: `remark().use(html)` produces byte-identical output whether
// invoked via .process() or .parse()/.stringify() (verified against a stub), so
// one instance serves both the full-body render and the sub-tree renders below.
const mdProcessor = remark().use(html);

function renderNodes(nodes: RootContent[]): string {
  if (nodes.length === 0) return "";
  return String(mdProcessor.stringify({ type: "root", children: nodes } as Root));
}

// Is `heading`/`node` a top-level `## Perspectives` heading?
function isPerspectivesHeading(node: RootContent): boolean {
  return (
    node.type === "heading" &&
    node.depth === 2 &&
    mdToString(node).trim().toLowerCase() === "perspectives"
  );
}

// A list item is "bold-led" when its first paragraph opens with a `strong` run
// (`- **Functionalist response.** …`); the strong text is the item's label.
function boldLead(item: List["children"][number]): string | null {
  const first = item.children[0];
  if (
    first &&
    first.type === "paragraph" &&
    first.children[0] &&
    first.children[0].type === "strong"
  ) {
    return mdToString(first.children[0]).trim();
  }
  return null;
}

// The bold lead is the label; the item's html is the paragraph remainder (minus
// the strong and its trailing space) plus any nested block content, untouched.
function stripBoldLead(item: List["children"][number]): RootContent[] {
  const first = item.children[0] as Paragraph;
  const rest = first.children.slice(1);
  if (rest[0] && rest[0].type === "text") {
    rest[0] = { ...rest[0], value: rest[0].value.replace(/^\s+/, "") };
  }
  const trimmedParagraph = { ...first, children: rest } as RootContent;
  return [trimmedParagraph, ...(item.children.slice(1) as RootContent[])];
}

type ParsedItems = { introNodes: RootContent[]; items: PerspectiveItem[] };

// Both authoring shapes recognized by docs/schema.md §Body structure:
//   • `###` subsections  — heading text is the label, subsection body the html.
//   • bold-led bullets   — the bold lead is the label, the remainder the html.
// `###` subsections take priority when present. A bullet list only counts as
// items when EVERY bullet is bold-led — a half-bold list is left as prose rather
// than partially structured. Returns null when neither shape yields an item.
function parseItems(section: RootContent[]): ParsedItems | null {
  const toItem = (label: string, contentNodes: RootContent[]): PerspectiveItem => ({
    paradigm: attributeParadigm(label),
    label,
    html: renderNodes(contentNodes),
  });

  const hasSubsections = section.some(
    (n) => n.type === "heading" && n.depth === 3
  );

  if (hasSubsections) {
    const introNodes: RootContent[] = [];
    const items: PerspectiveItem[] = [];
    let i = 0;
    while (i < section.length && !(section[i].type === "heading" && (section[i] as { depth?: number }).depth === 3)) {
      introNodes.push(section[i]);
      i++;
    }
    while (i < section.length) {
      const label = mdToString(section[i]).trim();
      i++;
      const contentNodes: RootContent[] = [];
      while (i < section.length && !(section[i].type === "heading" && (section[i] as { depth?: number }).depth === 3)) {
        contentNodes.push(section[i]);
        i++;
      }
      items.push(toItem(label, contentNodes));
    }
    return items.length > 0 ? { introNodes, items } : null;
  }

  // Bullet shape: the first list whose every bullet is bold-led.
  const listIndex = section.findIndex(
    (n) => n.type === "list" && n.children.length > 0 && n.children.every((li) => boldLead(li) !== null)
  );
  if (listIndex === -1) return null;

  const list = section[listIndex] as List;
  const items = list.children.map((li) => toItem(boldLead(li)!, stripBoldLead(li)));
  // Nodes before the list are the intro; anything after it is rare and folded
  // in rather than discarded (author text is never dropped).
  const introNodes = [
    ...section.slice(0, listIndex),
    ...section.slice(listIndex + 1),
  ];
  return { introNodes, items };
}

// Split the body around `## Perspectives` and structure the section. Fallbacks,
// in order: no heading → perspectives:null, htmlBefore/htmlAfter empty (the full
// `html` path renders untouched); heading present but no item parses →
// perspectives:null too, so the section stays in the body prose exactly as
// today. Only when at least one item parses do htmlBefore/After/perspectives
// carry the split.
function extractPerspectives(body: string): {
  htmlBefore: string;
  htmlAfter: string;
  perspectives: Perspectives | null;
} {
  const tree = mdProcessor.parse(body) as Root;
  const start = tree.children.findIndex(isPerspectivesHeading);
  if (start === -1) return { htmlBefore: "", htmlAfter: "", perspectives: null };

  let end = tree.children.length;
  for (let i = start + 1; i < tree.children.length; i++) {
    const n = tree.children[i];
    if (n.type === "heading" && n.depth === 2) {
      end = i;
      break;
    }
  }

  const section = tree.children.slice(start + 1, end);
  const parsed = parseItems(section);
  if (!parsed) return { htmlBefore: "", htmlAfter: "", perspectives: null };

  return {
    htmlBefore: renderNodes(tree.children.slice(0, start)),
    htmlAfter: renderNodes(tree.children.slice(end)),
    perspectives: {
      intro: parsed.introNodes.length > 0 ? renderNodes(parsed.introNodes) : null,
      items: parsed.items,
    },
  };
}

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

  // Render HTML from markdown body. This full-body path is unchanged from
  // pre-4.5 and is what renders when a lesson has no Perspectives section (or a
  // section the parser can't structure) — such pages stay byte-identical.
  const renderedHtml = await mdProcessor.process(body);
  const htmlString = renderedHtml.toString();

  // Structured Perspectives split (build-time, pure function of `body`).
  const { htmlBefore, htmlAfter, perspectives } = extractPerspectives(body);

  return {
    ...fm,
    slug,
    html: htmlString,
    htmlBefore,
    htmlAfter,
    perspectives,
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
