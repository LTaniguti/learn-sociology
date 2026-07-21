// Quiz lint: validates every content/quizzes/*.yml companion file against the
// quiz schema v1 (docs/quiz-schema.md). Runs after lint-content.mjs under
// `npm run lint:content`. Kept as a separate script — quizzes are a distinct
// file family with their own schema — but merged into the one command so a
// single gate covers both content and quizzes.
//
// Each error names the file and the path within it, and each failure class has
// a distinct message, so an author knows which rule they broke without reading
// this source (the 3.5 linter style).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const QUIZZES = path.join(CONTENT, "quizzes");

const PARADIGMS = ["functionalism", "conflict-theory", "symbolic-interactionism"];
const FILE_KEYS = ["version", "status", "adapted_from", "questions"];
const CHOICE_KEYS = ["type", "prompt", "paradigm", "options"];
const REFLECT_KEYS = ["type", "prompt"];
const OPTION_KEYS = ["text", "correct", "why"];

const errors = [];

// --- Node registry with status (parse content/*.md frontmatter) ---
// Needed for the slug-resolution and stub-node rules. Mirrors lint-content's
// frontmatter read rather than importing it, so the two scripts stay independent.
const nodeStatus = new Map();
for (const file of fs.readdirSync(CONTENT).filter(f => f.endsWith(".md") && f !== "README.md")) {
  const slug = file.replace(/\.md$/, "");
  const text = fs.readFileSync(path.join(CONTENT, file), "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) continue; // lint-content already reports missing frontmatter
  try {
    nodeStatus.set(slug, load(match[1])?.status);
  } catch {
    // lint-content already reports YAML parse errors on nodes
  }
}

const isString = v => typeof v === "string" && v.trim() !== "";

if (!fs.existsSync(QUIZZES)) {
  console.log("lint:quizzes — no content/quizzes directory; nothing to check");
  process.exit(0);
}

const files = fs.readdirSync(QUIZZES).filter(f => f.endsWith(".yml"));

for (const file of files) {
  const slug = file.replace(/\.yml$/, "");
  const at = `quizzes/${file}`;
  let quiz;
  try {
    quiz = load(fs.readFileSync(path.join(QUIZZES, file), "utf8"));
  } catch (e) {
    errors.push(`${at}: YAML parse error: ${e.message.split("\n")[0]}`);
    continue;
  }
  if (quiz === null || typeof quiz !== "object" || Array.isArray(quiz)) {
    errors.push(`${at}: top level must be a mapping (version, status, questions)`);
    continue;
  }

  // Rule 1 — slug must resolve to a content node; a published quiz on a stub is
  // an error (a stub has no lesson to check against). A draft quiz on a stub is
  // allowed — a placeholder is meant to exist before its lesson does, and a
  // draft never ships (see docs/quiz-schema.md → Node-status coupling).
  if (!nodeStatus.has(slug)) {
    errors.push(`${at}: no content node '${slug}.md' — a quiz filename must match an existing node`);
  } else if (nodeStatus.get(slug) === "stub" && quiz.status === "published") {
    errors.push(`${at}: quiz is 'published' but node '${slug}' is a stub — publish the lesson first, or set the quiz to 'draft'`);
  }

  // File-level unknown keys.
  for (const key of Object.keys(quiz)) {
    if (!FILE_KEYS.includes(key)) errors.push(`${at}: unknown key '${key}' — allowed: ${FILE_KEYS.join(", ")}`);
  }

  // version
  if (quiz.version !== 1) errors.push(`${at}: version must be 1, got ${JSON.stringify(quiz.version)} — a reader must refuse an unknown version`);

  // status
  if (quiz.status !== "draft" && quiz.status !== "published") {
    errors.push(`${at}: status must be 'draft' or 'published', got ${JSON.stringify(quiz.status)}`);
  }

  // adapted_from (optional)
  if ("adapted_from" in quiz && !isString(quiz.adapted_from)) {
    errors.push(`${at}: adapted_from, when present, must be a non-empty string`);
  }

  // questions: 1–8
  if (!Array.isArray(quiz.questions)) {
    errors.push(`${at}: questions must be a list`);
    continue;
  }
  if (quiz.questions.length < 1 || quiz.questions.length > 8) {
    errors.push(`${at}: questions must have 1–8 entries, has ${quiz.questions.length}`);
  }

  quiz.questions.forEach((q, qi) => {
    const qat = `${at} → questions[${qi}]`;
    if (q === null || typeof q !== "object" || Array.isArray(q)) {
      errors.push(`${qat}: must be a mapping`);
      return;
    }
    if (q.type !== "choice" && q.type !== "reflect") {
      errors.push(`${qat}: type must be 'choice' or 'reflect' (v1 has no others), got ${JSON.stringify(q.type)}`);
      return;
    }
    if (!isString(q.prompt)) errors.push(`${qat}: prompt must be a non-empty string`);

    // Placeholder guard — a published quiz may not carry a PLACEHOLDER — prompt.
    if (quiz.status === "published" && typeof q.prompt === "string" && q.prompt.trimStart().startsWith("PLACEHOLDER —")) {
      errors.push(`${qat}: 'PLACEHOLDER —' prompt in a 'published' quiz — placeholders must stay 'draft'`);
    }

    if (q.type === "choice") {
      for (const key of Object.keys(q)) {
        if (!CHOICE_KEYS.includes(key)) errors.push(`${qat}: unknown key '${key}' on a choice question — allowed: ${CHOICE_KEYS.join(", ")}`);
      }
      // paradigm key required (may be null); when non-null must be a valid slug.
      if (!("paradigm" in q)) {
        errors.push(`${qat}: choice question needs a 'paradigm' key (use null when the claim is not paradigm-specific)`);
      } else if (q.paradigm !== null && !PARADIGMS.includes(q.paradigm)) {
        errors.push(`${qat}: paradigm must be null or one of ${PARADIGMS.join(" | ")}, got ${JSON.stringify(q.paradigm)}`);
      }
      // options: 3–5, exactly one correct, every option carries why.
      if (!Array.isArray(q.options)) {
        errors.push(`${qat}: choice question needs an 'options' list`);
      } else {
        if (q.options.length < 3 || q.options.length > 5) {
          errors.push(`${qat}: choice needs 3–5 options, has ${q.options.length}`);
        }
        let correctCount = 0;
        q.options.forEach((opt, oi) => {
          const oat = `${qat}.options[${oi}]`;
          if (opt === null || typeof opt !== "object" || Array.isArray(opt)) {
            errors.push(`${oat}: must be a mapping (text, correct, why)`);
            return;
          }
          for (const key of Object.keys(opt)) {
            if (!OPTION_KEYS.includes(key)) errors.push(`${oat}: unknown key '${key}' — allowed: ${OPTION_KEYS.join(", ")}`);
          }
          if (!isString(opt.text)) errors.push(`${oat}: text must be a non-empty string`);
          if (typeof opt.correct !== "boolean") errors.push(`${oat}: correct must be true or false`);
          if (opt.correct === true) correctCount += 1;
          if (!isString(opt.why)) errors.push(`${oat}: every option must carry a non-empty 'why' — the distractor rationale is where the teaching happens`);
        });
        if (correctCount !== 1) errors.push(`${qat}: exactly one option must be correct, found ${correctCount}`);
      }
    } else {
      // reflect: prompt only.
      for (const key of Object.keys(q)) {
        if (!REFLECT_KEYS.includes(key)) errors.push(`${qat}: unknown key '${key}' on a reflect question — allowed: ${REFLECT_KEYS.join(", ")}`);
      }
    }
  });
}

console.log(`lint:quizzes — ${files.length} quiz file(s)`);
if (errors.length > 0) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`${errors.length} violation(s)`);
  process.exit(1);
}
console.log("OK — quiz schema v1: versions, status, question/option shape, paradigm enum, placeholder guard, and node-status coupling all valid");
