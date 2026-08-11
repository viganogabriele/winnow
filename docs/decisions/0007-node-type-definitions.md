# 0007 — Node type definitions

Date: 2026-08-11
Question: Should winnow add Node type definitions in Phase 0?
Options: Add `@types/node`; avoid Node APIs; or declare the types ourselves.
Decision: Add `@types/node` as a development dependency.
Reason: The CLI uses Node APIs such as `process.argv`; the standard definitions keep TypeScript strict and readable.
Re-evaluate: If winnow stops running on Node.js.
