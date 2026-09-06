// People lint: validates the person registry under content/people/ against the
// contract in docs/person-schema.md, and validates that every name a node lists
// in `people:` resolves to exactly one person. Runs after lint-content.mjs and
// lint-quizzes.mjs under `npm run lint:content`.
//
// Kept as a separate script for the same reason lint-quizzes.mjs is — people are
// a distinct file family with their own schema doc — but merged into the one
// command so a single gate covers nodes, quizzes and people, and CI
// (.github/workflows/deploy.yml) picks it up with no workflow change.
//
// Error message style follows lint-content.mjs: `<slug>: <what's wrong> (<which
// doc to read>)`, so an author knows which rule they broke without reading this
// source.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const PEOPLE = path.join(CONTENT, "people");
const STATUSES = ["stub", "draft", "review", "published"];

// See NON_NODE_DIRS in lib/content.ts and scripts/lint-content.mjs — the node
// walk below must skip sibling entity types, exactly as those two do.
const NON_NODE_DIRS = new Set(["quizzes", "people"]);

const errors = [];

// --- Field allowlist: docs/person-schema.md is the single source ---
// The "Frontmatter fields" table *is* the allowlist and *is* the required-field
// list, parsed rather than hardcoded so the document and the gate cannot drift —
// the arrangement docs/schema.md has with lint-content.mjs.
//
// Rows are split on the pipe rather than regex-matched cell by cell, because the
// `status` row's type cell contains an escaped pipe (`stub \| draft \| ...`).
const schemaDoc = fs.readFileSync(path.join(ROOT, "docs/person-schema.md"), "utf8");
const fieldSection =
  schemaDoc.split(/^## /m).find(s => s.startsWith("Frontmatter fields")) ?? "";
const FIELDS = fieldSection
  .split("\n")
  .filter(line => /^\| `[a-z_]+` \|/.test(line))
  .map(line => line.replace(/\\\|/g, "/").split("|").map(c => c.trim()))
  .map(cells => ({ name: cells[1].replace(/`/g, ""), required: cells[3] === "yes" }));
const KNOWN_FIELDS = new Set(FIELDS.map(f => f.name));
const REQUIRED_FIELDS = FIELDS.filter(f => f.required).map(f => f.name);
if (KNOWN_FIELDS.size === 0) {
  errors.push("schema: could not parse the Frontmatter fields table from docs/person-schema.md");
}

// --- Controlled vocabulary: docs/taxonomy.md ---
// `disciplines` draws on discipline/, `traditions` on paradigm/. Same source of
// truth as node tags; only the counting rules differ (docs/person-schema.md).
const taxonomy = fs.readFileSync(path.join(ROOT, "docs/taxonomy.md"), "utf8");
const validTags = new Set(
  [...taxonomy.matchAll(/`((?:discipline|level|type|paradigm|subfield)\/[a-z-]+)`/g)].map(m => m[1]),
);

// --- Node slugs and their `people:` lists ---
function walkNodeFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (NON_NODE_DIRS.has(entry.name)) continue;
      out.push(...walkNodeFiles(full));
    } else if (entry.name.endsWith(".md") && entry.name !== "README.md") out.push(full);
  }
  return out;
}

const nodeSlugs = new Map(); // slug → repo-relative path
const nodePeople = new Map(); // slug → string[] from `people:`
for (const file of walkNodeFiles(CONTENT)) {
  const slug = path.basename(file, ".md");
  nodeSlugs.set(slug, path.relative(ROOT, file));
  const match = fs.readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) continue; // lint-content already reports missing frontmatter
  try {
    nodePeople.set(slug, load(match[1])?.people ?? []);
  } catch {
    // lint-content already reports YAML parse errors on nodes
  }
}

// --- Parse every person file ---
const people = new Map(); // slug → frontmatter

// A corpus with no registry is valid only while no node names anyone. Reported
// as unresolved references rather than as a missing directory, so the message
// points at the node the author actually has to fix.
const entries = fs.existsSync(PEOPLE)
  ? fs.readdirSync(PEOPLE, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
  : [];

for (const entry of entries) {
  if (entry.isDirectory()) {
    errors.push(`people: unexpected directory content/people/${entry.name}/ — person entries are flat files (docs/person-schema.md)`);
    continue;
  }
  if (!entry.name.endsWith(".md") || entry.name === "README.md") continue;
  const slug = path.basename(entry.name, ".md");
  const text = fs.readFileSync(path.join(PEOPLE, entry.name), "utf8");

  // Slug shape: lowercase kebab-case with diacritics folded, so it is typeable
  // and URL-safe without escaping (docs/person-schema.md → Identity).
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    errors.push(`${slug}: slug must be lowercase kebab-case with diacritics folded (docs/person-schema.md)`);
  }
  // One namespace: nodes and people share it, so a cross-reference is never
  // ambiguous (docs/schema.md → content structure).
  if (nodeSlugs.has(slug)) {
    errors.push(`${slug}: slug collides with the node at ${nodeSlugs.get(slug)} — one namespace covers all of content/ (docs/person-schema.md)`);
  }

  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    errors.push(`${slug}: missing frontmatter block (docs/person-schema.md)`);
    continue;
  }
  let fm;
  try {
    fm = load(match[1]);
  } catch (e) {
    errors.push(`${slug}: YAML parse error: ${e.message.split("\n")[0]} (docs/person-schema.md)`);
    continue;
  }
  if (fm === null || typeof fm !== "object" || Array.isArray(fm)) {
    errors.push(`${slug}: frontmatter must be a mapping (docs/person-schema.md)`);
    continue;
  }
  people.set(slug, fm);
}

const isString = v => typeof v === "string" && v.trim() !== "";
const isStringList = v => Array.isArray(v) && v.every(isString);

// --- Per-person field checks ---
for (const [slug, fm] of people) {
  for (const key of Object.keys(fm)) {
    if (!KNOWN_FIELDS.has(key)) {
      errors.push(`${slug}: unknown frontmatter key '${key}' — not a person schema field (docs/person-schema.md → Frontmatter fields)`);
    }
  }
  for (const field of REQUIRED_FIELDS) {
    const v = fm[field];
    if (v === undefined || v === null || v === "") {
      errors.push(`${slug}: missing required field ${field} (docs/person-schema.md → Frontmatter fields)`);
    }
  }

  if ("name" in fm && !isString(fm.name)) errors.push(`${slug}: name must be a non-empty string (docs/person-schema.md)`);
  if ("summary" in fm && !isString(fm.summary)) errors.push(`${slug}: summary must be a non-empty string (docs/person-schema.md)`);
  if ("lived" in fm && !isString(fm.lived)) errors.push(`${slug}: lived must be a non-empty string, e.g. '1858–1917' or 'b. 1959' (docs/person-schema.md)`);
  if ("active" in fm && !isString(fm.active)) errors.push(`${slug}: active, when present, must be a non-empty string (docs/person-schema.md)`);

  // A birth year must be readable out of `lived`: the /people index bands by it
  // (docs/person-schema.md → Era bands (derived)), and a person with no
  // parseable year has no band. lib/content.ts throws on the same condition —
  // this is the authoring gate, that is the build gate, and both point at the
  // same section. The field stays free text; only a four-digit run is required.
  if (isString(fm.lived) && !/(?<!\d)\d{4}(?!\d)/.test(fm.lived)) {
    errors.push(`${slug}: lived '${fm.lived}' has no four-digit year — era banding reads the birth year out of it (docs/person-schema.md → Era bands (derived))`);
  }

  for (const field of ["aliases", "disciplines", "traditions", "works", "sources"]) {
    if (field in fm && fm[field] !== null && !isStringList(fm[field])) {
      errors.push(`${slug}: ${field} must be a list of non-empty strings (docs/person-schema.md)`);
    }
  }

  // aliases never repeats name: resolution checks name first, so a repeat adds
  // nothing and invites drift (docs/person-schema.md → Frontmatter fields).
  if (isStringList(fm.aliases) && isString(fm.name) && fm.aliases.includes(fm.name)) {
    errors.push(`${slug}: aliases repeats name '${fm.name}' — list only the other forms (docs/person-schema.md)`);
  }

  // disciplines: one or more discipline/ values from the taxonomy. A person may
  // carry several where a node carries exactly one — the asymmetry is deliberate
  // (docs/person-schema.md → One node, one discipline; one person, many).
  if (isStringList(fm.disciplines)) {
    if (fm.disciplines.length < 1) {
      errors.push(`${slug}: disciplines needs at least one discipline/ value (docs/person-schema.md)`);
    }
    for (const d of fm.disciplines) {
      if (!d.startsWith("discipline/")) errors.push(`${slug}: disciplines entry '${d}' is not a discipline/ value (docs/taxonomy.md)`);
      else if (!validTags.has(d)) errors.push(`${slug}: discipline not in taxonomy: ${d} (docs/taxonomy.md)`);
    }
  }

  // traditions: zero or more paradigm/ values. Empty is common and correct.
  if (isStringList(fm.traditions)) {
    for (const t of fm.traditions) {
      if (!t.startsWith("paradigm/")) errors.push(`${slug}: traditions entry '${t}' is not a paradigm/ value (docs/taxonomy.md)`);
      else if (!validTags.has(t)) errors.push(`${slug}: tradition not in taxonomy: ${t} (docs/taxonomy.md)`);
    }
  }

  // works: 1–5 principal works when present — a hint at the shape of a body of
  // work, not a bibliography (docs/person-schema.md → Deliberately absent).
  if (isStringList(fm.works) && (fm.works.length < 1 || fm.works.length > 5)) {
    errors.push(`${slug}: works, when present, must have 1–5 entries, has ${fm.works.length} (docs/person-schema.md)`);
  }
  if (isStringList(fm.sources) && fm.sources.length < 1) {
    errors.push(`${slug}: sources must have at least one entry — attribution travels with the material (docs/person-schema.md)`);
  }

  if ("status" in fm && !STATUSES.includes(fm.status)) {
    errors.push(`${slug}: invalid status: ${JSON.stringify(fm.status)} — one of ${STATUSES.join(" | ")} (docs/person-schema.md)`);
  }
}

// --- Alias table: no string may be claimed by two people ---
// Built as name → [slugs] so the resolution check below can distinguish "no
// match" from "ambiguous match" without guessing.
const claims = new Map();
for (const [slug, fm] of people) {
  const forms = [];
  if (isString(fm.name)) forms.push(fm.name);
  if (isStringList(fm.aliases)) forms.push(...fm.aliases);
  for (const form of forms) {
    if (!claims.has(form)) claims.set(form, []);
    if (!claims.get(form).includes(slug)) claims.get(form).push(slug);
  }
}
for (const [form, slugs] of claims) {
  if (slugs.length > 1) {
    errors.push(`people: '${form}' is claimed by ${slugs.join(" and ")} — a name or alias must identify exactly one person (docs/person-schema.md)`);
  }
}

// --- Node `people:` resolution: exactly one person, by name or alias ---
// Zero matches and multiple matches are distinct failures: the first is a
// missing registry entry (or a typo), the second is an ambiguous registry.
let referenceCount = 0;
for (const [slug, names] of nodePeople) {
  if (!Array.isArray(names)) {
    errors.push(`${slug}: people: must be a list of display names (docs/schema.md → Frontmatter fields)`);
    continue;
  }
  for (const name of names) {
    referenceCount += 1;
    if (!isString(name)) {
      errors.push(`${slug}: people: entries must be non-empty display names (docs/schema.md → Frontmatter fields)`);
      continue;
    }
    const matched = claims.get(name) ?? [];
    if (matched.length === 0) {
      errors.push(`${slug}: people: '${name}' matches no person — add content/people/<slug>.md or list the string in an existing entry's aliases (docs/person-schema.md)`);
    } else if (matched.length > 1) {
      errors.push(`${slug}: people: '${name}' is ambiguous, matching ${matched.join(" and ")} (docs/person-schema.md)`);
    }
  }
}

console.log(`lint:people — ${people.size} person entries, ${referenceCount} node reference(s)`);
if (errors.length > 0) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`${errors.length} violation(s)`);
  process.exit(1);
}
console.log("OK — person schema fields, slug uniqueness across content/, alias uniqueness, taxonomy values, status, and every node's people: resolution all valid");
