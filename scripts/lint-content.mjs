// Content lint: validates every node in /content against the contracts in
// docs/schema.md (frontmatter fields), docs/taxonomy.md (tag vocabulary and
// counting rules), docs/concept-list.md (the slug registry), and
// content/course.yaml (Mode 1 ordering).
//
// Run with: npm run lint:content
// Exits non-zero on any violation, so it can gate CI on pull requests.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const DIFFICULTIES = ["intro", "intermediate", "advanced"];

// Nodes live one discipline level deep (content/<discipline>/<slug>.md) since
// Phase 4.7. Walk content/ recursively — the directory is for humans, the slug
// (basename) is the identity. README.md is folder docs, not a node, at any depth.
function walkNodeFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkNodeFiles(full));
    else if (entry.name.endsWith(".md") && entry.name !== "README.md") out.push(full);
  }
  return out;
}
const STATUSES = ["stub", "draft", "review", "published"];
const REQUIRED = ["title", "summary", "parent", "prerequisites", "tags", "difficulty", "status"];

const errors = [];

// --- Slug registry: docs/concept-list.md table rows ---
const conceptList = fs.readFileSync(path.join(ROOT, "docs/concept-list.md"), "utf8");
const registry = new Map(
  [...conceptList.matchAll(/\| \d+ \| `([a-z-]+)` \| [^|]+ \| ([^|]+) \| ([^|]+) \|/g)].map(m => [
    m[1],
    {
      parent: m[2].includes("null") ? null : (m[2].match(/`([a-z-]+)`/) || [])[1],
      prereqs: m[3].trim() === "—" ? [] : [...m[3].matchAll(/`([a-z-]+)`/g)].map(x => x[1]),
    },
  ]),
);

// --- Controlled vocabulary: docs/taxonomy.md ---
const taxonomy = fs.readFileSync(path.join(ROOT, "docs/taxonomy.md"), "utf8");
const validTags = new Set(
  [...taxonomy.matchAll(/`((?:discipline|level|type|paradigm|subfield)\/[a-z-]+)`/g)].map(m => m[1]),
);

// --- Frontmatter field allowlist: docs/schema.md is the single source ---
// KNOWN = the backticked field names in the "Frontmatter fields" table.
// RESERVED = the backtick-colon field names in the "Reserved fields" section
// (currently `discipline:` / `branch:`) — recorded as a direction, valid for no
// node until a future phase activates them. Parsed rather than hardcoded so the
// schema doc and the gate cannot drift.
const schema = fs.readFileSync(path.join(ROOT, "docs/schema.md"), "utf8");
const section = name => (schema.split(/^## /m).find(s => s.startsWith(name)) ?? "");
const KNOWN_FIELDS = new Set(
  [...section("Frontmatter fields").matchAll(/^\| `([a-z_]+)` \|/gm)].map(m => m[1]),
);
// Only the bullet (definition) lines declare reserved fields — the `key:` form.
// Scoping to bullets keeps prose examples (e.g. a "`prerequisite:` typo for
// `prerequisites:`") from being misread as reserved declarations, which would
// flag every node's real `prerequisites` field.
const RESERVED_FIELDS = new Set(
  section("Reserved fields")
    .split("\n")
    .filter(line => line.trimStart().startsWith("- "))
    .flatMap(line => [...line.matchAll(/`([a-z_]+):`/g)].map(m => m[1])),
);
if (KNOWN_FIELDS.size === 0) errors.push("schema: could not parse the Frontmatter fields table from docs/schema.md");

// --- Parse every node's frontmatter ---
// Slugs are globally unique across ALL of content/ (present and future): the
// completion invariant, both localStorage stores, prerequisites, and cross-
// references all stand on it. A duplicate basename anywhere under content/ is an
// error — it silently splits one slug's identity across two files. Today no
// duplicate exists; this rule exists so the first content/anthropology/culture.md
// collides loudly at PR time. (See docs/schema.md → content structure.)
const files = walkNodeFiles(CONTENT);
const slugPaths = new Map(); // slug → repo-relative path of the first file seen
const nodes = new Map();
for (const file of files) {
  const slug = path.basename(file, ".md");
  const rel = path.relative(ROOT, file);
  if (slugPaths.has(slug)) {
    errors.push(`duplicate slug '${slug}': ${slugPaths.get(slug)} and ${rel} — a basename must be unique across all of content/`);
    continue;
  }
  slugPaths.set(slug, rel);
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    errors.push(`${slug}: missing frontmatter block`);
    continue;
  }
  try {
    nodes.set(slug, load(match[1]));
  } catch (e) {
    errors.push(`${slug}: YAML parse error: ${e.message.split("\n")[0]}`);
  }
}
const slugs = new Set(slugPaths.keys());

// --- Registry coverage: files and concept-list rows must match 1:1 ---
for (const slug of registry.keys()) if (!slugs.has(slug)) errors.push(`registry: no file for concept-list slug ${slug}`);
for (const slug of slugs) if (!registry.has(slug)) errors.push(`registry: ${slug} is not in docs/concept-list.md`);

// --- Per-node frontmatter checks ---
let rootCount = 0;
for (const [slug, fm] of nodes) {
  // Every frontmatter key must be a known schema field. A reserved key gets a
  // distinct error (it is a legible future direction, not a valid field yet);
  // any other unknown key is a typo or an invented field and is rejected by
  // name — closing the gap where unknown keys were silently ignored.
  for (const key of Object.keys(fm)) {
    if (RESERVED_FIELDS.has(key)) {
      errors.push(`${slug}: '${key}' is reserved for a future phase and is not valid yet (docs/schema.md → Reserved fields)`);
    } else if (!KNOWN_FIELDS.has(key)) {
      errors.push(`${slug}: unknown frontmatter key '${key}' — not a schema field (docs/schema.md → Frontmatter fields)`);
    }
  }

  for (const field of REQUIRED) {
    if (!(field in fm) || fm[field] === undefined || fm[field] === "" || fm[field] === null) {
      if (!(field === "parent" && fm.parent === null)) errors.push(`${slug}: missing required field ${field}`);
    }
  }

  const reg = registry.get(slug);
  if (fm.parent === null) rootCount++;
  else if (typeof fm.parent === "string" && !slugs.has(fm.parent)) errors.push(`${slug}: parent does not resolve: ${fm.parent}`);
  if (reg && (fm.parent ?? null) !== reg.parent) errors.push(`${slug}: parent ${fm.parent} disagrees with concept-list (${reg.parent})`);

  for (const p of fm.prerequisites ?? []) if (!slugs.has(p)) errors.push(`${slug}: prerequisite does not resolve: ${p}`);
  if (reg && JSON.stringify(fm.prerequisites ?? []) !== JSON.stringify(reg.prereqs)) {
    errors.push(`${slug}: prerequisites disagree with concept-list`);
  }
  for (const r of fm.related ?? []) if (!slugs.has(r)) errors.push(`${slug}: related entry does not resolve: ${r}`);

  const tags = fm.tags ?? [];
  for (const tag of tags) if (!validTags.has(tag)) errors.push(`${slug}: tag not in taxonomy: ${tag}`);
  const count = prefix => tags.filter(t => t.startsWith(prefix + "/")).length;
  if (count("discipline") !== 1) errors.push(`${slug}: needs exactly one discipline/ tag, has ${count("discipline")}`);
  if (count("level") !== 1) errors.push(`${slug}: needs exactly one level/ tag, has ${count("level")}`);
  if (count("type") !== 1) errors.push(`${slug}: needs exactly one type/ tag, has ${count("type")}`);
  if (count("subfield") < 1 || count("subfield") > 2) errors.push(`${slug}: needs one or two subfield/ tags, has ${count("subfield")}`);

  if (!DIFFICULTIES.includes(fm.difficulty)) errors.push(`${slug}: invalid difficulty: ${fm.difficulty}`);
  if (!STATUSES.includes(fm.status)) errors.push(`${slug}: invalid status: ${fm.status}`);
}

// --- Tree integrity: one root, no cycles ---
if (rootCount !== 1) errors.push(`tree: expected exactly one root (parent: null), found ${rootCount}`);
for (const slug of nodes.keys()) {
  const seen = new Set();
  for (let cur = slug; cur != null; cur = nodes.get(cur)?.parent) {
    if (seen.has(cur)) {
      errors.push(`tree: cycle through ${cur}`);
      break;
    }
    seen.add(cur);
  }
}

// --- Course manifest: coverage, uniqueness, and prerequisite ordering ---
const course = load(fs.readFileSync(path.join(CONTENT, "course.yaml"), "utf8"));
const order = course.modules.flatMap(m => m.nodes);
const position = new Map(order.map((slug, i) => [slug, i]));
for (const slug of order) if (!slugs.has(slug)) errors.push(`course.yaml: no file for ${slug}`);
for (const slug of registry.keys()) {
  const n = order.filter(s => s === slug).length;
  if (n !== 1) errors.push(`course.yaml: ${slug} appears ${n} times, expected exactly once`);
}
for (const slug of order) {
  for (const p of nodes.get(slug)?.prerequisites ?? []) {
    if (position.has(p) && position.get(p) > position.get(slug)) {
      errors.push(`course.yaml: ${slug} is ordered before its prerequisite ${p}`);
    }
  }
}

console.log(`lint:content — ${nodes.size} nodes, ${registry.size} registry slugs, ${order.length} course entries`);
if (errors.length > 0) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`${errors.length} violation(s)`);
  process.exit(1);
}
console.log("OK — schema fields, slug resolution, registry coverage, tags, tree integrity, and course order all valid");
