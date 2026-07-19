# Task Brief — Phase 2.8: Deploy (CI → GitHub Pages)

**Destination:** `docs/tasks/phase-2.8-deploy.md`
**Executor:** Claude Code, in the local clone of `LTaniguti/learn-sociology`
**Roadmap reference:** Phase 2, Step 2.8 — GitHub Actions workflow: lint → build → deploy the static export to GitHub Pages. Every merged commit auto-publishes. After this step the project has a public URL.

## Human prerequisites (Lucas, in the browser)

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions** (one dropdown; without it the deploy job fails with a clear error)
2. After the first successful deploy: paste the public URL into the repo's **About → Website** field (repo description is not writable from the working tree)

## Precondition

2.7 merged and pushed (deploying with the placeholder instead of live Giscus is acceptable if 2.7 is deliberately deferred — note which state is being deployed). `npm run lint:content`, `npm run lint`, and `npm run build` all green locally.

## Architecture decisions (pre-made — follow, don't relitigate)

1. **basePath.** The site deploys to `https://ltaniguti.github.io/learn-sociology/`, so `next.config.ts` gains `basePath: "/learn-sociology"` — **unconditionally**, not gated on an env var. Dev then also serves under `localhost:3000/learn-sociology`, which is mildly less convenient but means dev and prod can never diverge on link resolution; environment-conditional basePath is a classic source of works-locally-404s-in-prod bugs. Add a comment noting that a future custom domain would remove this line. Audit for hardcoded root-relative URLs that bypass `next/link`/`next/image` (the hash deep-links from 2.6 are unaffected; the giscus `data-term` slug mapping is exactly why 2.7 avoided pathname mapping).
2. **One workflow**, `.github/workflows/deploy.yml`, on `push` to `main` plus `workflow_dispatch`:
   - **Job `check`:** checkout → setup Node LTS with npm cache → `npm ci` → `npm run lint:content` → `npm run lint` → `npm run build` → upload `out/` with `actions/upload-pages-artifact`
   - **Job `deploy`:** `needs: check`, environment `github-pages`, `actions/deploy-pages`
   - Permissions: `contents: read`, `pages: write`, `id-token: write`; concurrency group `pages` with `cancel-in-progress: true`
   - The ordering **is** the gate: content lint or ESLint failure means no artifact, no deploy. No separate CI file — this closes the "wire lint into Actions" item from Issue #1's follow-up.
3. **Pull requests:** a second trigger on `pull_request` running only the `check` job (deploy job conditioned on `github.ref == 'refs/heads/main'`). Contributor PRs get machine-checked before merge — the CONTRIBUTING.md promise becomes enforced.
4. **No `.nojekyll` needed** — artifact-based Pages deploys don't run Jekyll. Don't add one "just in case"; dead config invites cargo-culting.

## README updates (same PR)

- Public URL prominently near the top ("**Live at:** …")
- Status section updated: PoC deployed, Modes 1 & 2 usable, all lessons currently stubs (link the contribution workflow for anyone who wants to write articles)
- Optional single workflow status badge

## Constraints

- No changes to `/content`, schema, taxonomy, `course.yaml`, or the lint script
- No deploy keys, tokens, or secrets in the repo — `deploy-pages` uses the workflow's OIDC token automatically

## Verification (report results)

1. Workflow runs green end-to-end on push to `main`
2. Site loads at the public URL; spot-check `/`, `/course`, `/course/social-norms`, `/hierarchy`, `/node/labeling-theory` — no 404s on `_next` assets (the basePath proof)
3. Hierarchy deep link `…/learn-sociology/hierarchy#intersectionality` expands and scrolls correctly in production
4. Progress marking works on the live site and persists across reload
5. Giscus loads on a live lesson page (if 2.7 deployed)
6. A deliberately broken frontmatter field on a scratch branch PR turns the `check` job red (then delete the branch) — proves the gate gates

## Commits

(1) basePath + any URL audit fixes, (2) workflow, (3) README. Main message: `Deploy: lint-gated GitHub Actions build to GitHub Pages (Phase 2, Step 2.8)`.

## Stop-and-report conditions

- Pages source not set to GitHub Actions (deploy job will say so)
- Any asset or link requiring a basePath-conditional hack
- Anything requiring secrets or schema/content changes
