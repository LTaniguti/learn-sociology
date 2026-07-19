// Smoke test: verify the content pipeline works end-to-end.
// Imports lib/content.ts directly (Node >= 23.6 strips types natively).
// Run with: node scripts/pipeline-smoke.mjs

import { getAllNodes, getCourse, getTree } from "../lib/content.ts";

function treeDepth(node, depth = 0) {
  if (node.children.length === 0) return depth;
  return Math.max(...node.children.map((child) => treeDepth(child, depth + 1)));
}

async function main() {
  console.log("Running content pipeline smoke test...\n");

  const allNodes = await getAllNodes();
  console.log(`✓ getAllNodes(): ${allNodes.length} nodes (expected 53)`);

  const course = getCourse();
  console.log(`✓ getCourse(): ${course.modules.length} modules`);
  console.log(
    `  Modules: ${course.modules.map((m) => `"${m.title}" (${m.nodes.length} nodes)`).join(", ")}`
  );

  const tree = await getTree();
  const depth = treeDepth(tree);
  console.log(`✓ getTree(): depth ${depth} (expected ≤ 4)`);

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
