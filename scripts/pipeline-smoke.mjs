// Smoke test: verify the content pipeline works end-to-end
// Run with: node --experimental-strip-types scripts/pipeline-smoke.mts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { load } from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "content");

function getAllSlugs() {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => f.replace(/\.md$/, ""))
    .sort();
  return files;
}

async function getNode(slug) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Node not found: ${slug}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const { data, content: body } = matter(content);

  const fm = data;

  // Validate required fields
  const required = ["title", "summary", "parent", "prerequisites", "tags", "difficulty", "status"];
  for (const field of required) {
    if (field === "parent" && fm.parent === null) {
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

async function getAllNodes() {
  const slugs = getAllSlugs();
  const nodes = [];

  for (const slug of slugs) {
    const node = await getNode(slug);
    nodes.push(node);
  }

  return nodes;
}

function getCourse() {
  const courseFile = path.join(CONTENT_DIR, "course.yaml");
  const content = fs.readFileSync(courseFile, "utf8");
  const course = load(content);
  return course;
}

async function getTreeDepth(node, depth = 0) {
  if (node.children.length === 0) {
    return depth;
  }
  const childDepths = await Promise.all(
    node.children.map((child) => getTreeDepth(child, depth + 1))
  );
  return Math.max(...childDepths);
}

async function getTree(nodes) {
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
  const visited = new Set();
  const inProgress = new Set();

  function hasCycle(slug) {
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
  function buildTree(slug) {
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

async function main() {
  console.log("Running content pipeline smoke test...\n");

  // Load all nodes
  const allNodes = await getAllNodes();
  console.log(`✓ getAllNodes(): ${allNodes.length} nodes (expected 53)`);

  // Load course manifest
  const course = getCourse();
  console.log(`✓ getCourse(): ${course.modules.length} modules`);
  console.log(
    `  Modules: ${course.modules.map((m) => `"${m.title}" (${m.nodes.length} nodes)`).join(", ")}`
  );

  // Load tree hierarchy
  const tree = await getTree(allNodes);
  const depth = await getTreeDepth(tree);
  console.log(`✓ getTree(): depth ${depth} (expected ≤ 4)`);

  // Sample: first rendered node
  const firstNode = allNodes[0];
  console.log(`✓ First rendered node: ${firstNode.slug}`);
  console.log(`  - Title: ${firstNode.title}`);
  console.log(`  - HTML length: ${firstNode.html.length} characters`);
  console.log(`  - Difficulty: ${firstNode.difficulty}, Status: ${firstNode.status}`);

  console.log("\n✓ Pipeline smoke test passed!");
}

main().catch((err) => {
  console.error("✗ Pipeline smoke test failed:");
  console.error(err.message);
  process.exit(1);
});
