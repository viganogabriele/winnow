# 0027 — Corepack selects the repository's exact pnpm version

**Question:** GitHub's Ubuntu runner does not provide pnpm, so how does Fase 1 honour a pnpm lockfile?
**Options:** A) use Node 22's Corepack and require an exact `packageManager` value; B) add the
`pnpm/action-setup` third-party action and define a winnow-owned fallback version.
**Choice:** A. If both supported lockfiles exist, or pnpm has no exact `packageManager`, fail with the cause
and next action instead of guessing. npm continues to use `npm ci` from `package-lock.json`.
**Reason:** the analysed repository chooses the pnpm version that interprets its lockfile, while winnow adds
no action or version policy of its own. **Date:** 2026-08-12.
**Re-evaluate when:** the Node floor no longer bundles Corepack, or a real fixture cannot declare the field.
