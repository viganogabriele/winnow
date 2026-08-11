# 0007 — Node type definitions

Date: 2026-08-11
Question: Should winnow add Node type definitions in Phase 0?
Options: Add `@types/node`; avoid Node APIs; or declare the types ourselves.
Decision: Add `@types/node` as a development dependency.
Reason: winnow's TypeScript touches Node APIs (filesystem, child processes, environment) in the SARIF converters, the agent adapters, and the dashboard's server side; the standard definitions keep TypeScript strict and readable.
Re-evaluate: If winnow stops running on Node.js.

> Note 2026-08-11: originally written when Phase 0 shipped a `src/cli.ts` using `process.argv`. That CLI was removed with `0008` (winnow ships no binary), but the dependency is still correct for the reason above.
