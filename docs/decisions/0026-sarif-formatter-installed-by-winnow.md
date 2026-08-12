# 0026 — winnow installs the ESLint SARIF formatter; it never requires it from the repository

**Question:** `eslint -f @microsoft/eslint-formatter-sarif` needs that package inside the linted project,
and no fixture has it. An owner may add it; winnow must still work where nobody did.

**Options:** A) install it in a directory winnow owns, passing ESLint the path to its entry file; B) add it
to the analysed tree (`npm i --no-save`), mutating what the lockfile describes; C) require it from adopters.

**Choice:** A, pinned to `@3.1.0`. Verified on ESLint 9.39: a formatter outside `node_modules` loads, and
the SARIF still reports the project's own ESLint version.

**Reason:** the repository stays exactly as its lockfile describes it, one path serves npm and pnpm, and the
same commands become a composite action step in Fase 2. Its absolute `file://` URIs: `ROADMAP.md` Fase 1.

**Date:** 2026-08-12 · **Re-evaluate when:** ESLint stops accepting a path for `--format`, or the formatter
(April 2024, `eslint: ^8.9.0`) breaks — fallback: `eslint -f json` plus a converter, like Fase 2's `tsc`.
