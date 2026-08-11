# 0008 — GitHub Actions as the execution engine; aggregate OSS tools instead of building them

**Question:** spec §5 describes a system we build ourselves: a worker, a Postgres-backed queue, a
Podman sandbox, semantic finding fingerprints, an aggregator, and an OCI plugin contract. Roadmap v2
estimated this at roughly two years part-time. Do we build that, or assemble the same product surface
out of tools that already exist?

**Options:**

- A) Build it per spec §5 / roadmap v2. Full control, portable across forges, works on arbitrary
  hostile repositories, semantic fingerprints that survive refactors.
- B) GitHub Actions as the execution engine; `reviewdog` for diff-scoped findings; GitHub code scanning
  for cross-commit finding state; `docker compose` + Playwright + axe for the browser stage;
  `anthropics/claude-code-action` for the AI reviewer. We write only the workflow, the prompts, and the
  dashboard.

> **Provider amendment, 2026-08-11:** the architectural choice remains B, but Fase 5 now invokes the
> Claude Code CLI directly. `claude-code-action` would add GitHub integration to a `review` job that is
> deliberately `permissions: {}`; the CLI accepts the subscription token without that coupling.

**Choice:** B.

**Reason:** the owner's goal is a tool they use on their own repositories, plus a
portfolio project they can explain — not a general-purpose hostile-repo analysis platform. Option A
spends its first year rebuilding a CI system that GitHub gives away, and its hardest single component
(fingerprinting, §9.3) exists to answer "is this finding new?" — a question code scanning already
answers per-commit and `reviewdog` already answers per-diff. Roughly 90% of the product surface the
owner actually wants survives the substitution; the timeline goes from ~2 years to ~3 months, which
matters because the dominant risk to this project is attrition, not architectural debt.

**What we lose, stated honestly:**

- **Hostile-repo capability.** The isolation story becomes "GitHub's ephemeral runner", which is
  genuinely good but is not ours to reason about. winnow becomes safe for your own repositories and
  PRs from people you trust, and the README must say so. Pointing it at arbitrary public repositories
  is out of scope.
- **Forge portability.** The product is now GitHub-shaped. GitLab/Gitea support would mean a second
  engine, not a config flag.
- **Diff precision.** `reviewdog`'s diff filter is line-scoped: a pre-existing defect on a line the PR
  merely reindents reads as new, and a defect introduced in an untouched shared file can be missed.
  Semantic fingerprints would not have those failure modes. Accepted deliberately.
- **Private repositories.** Code scanning SARIF upload is free on public repositories; private ones
  need GitHub Advanced Security. Mitigated by decision N3 (the repositories are public).

**What we keep from the spec:** evidence before speculation (§4.2), evidence tiers with `speculative`
collapsed by default (§9.4), gating so deterministic stages run first and feed the AI stage (§8),
subscription auth as the default (§12), the failing-test precondition on fix mode (§14), and — most
importantly — the credential separation of §12.3, which Actions provides per-job instead of per
container.

**Consequences for other decisions:** `0003` (Podman rootless) and `0004` (Dagger later) are moot —
there is no sandbox layer left to write. `0002` (TypeScript instead of Go) stops being a trade-off at
all: with no worker and no container tooling, Go had no remaining advantage, so the decision stands and
its re-evaluation trigger is void. `docs/spec-v2.md` remains authoritative for product reasoning and is
superseded on architecture; `ROADMAP-old.md` is kept for the record, not for work.

**Date:** 2026-08-11

**Re-evaluate when:** any one of — a real user needs a forge other than GitHub; the line-scoped diff
filter demonstrably misses or invents findings on a concrete PR (not hypothesized); Actions minutes or
the free code-scanning tier stop covering actual usage; or the tool needs to run on repositories the
owner does not control.
