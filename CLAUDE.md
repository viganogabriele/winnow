# CLAUDE.md

**Read `AGENTS.md` in the repository root before doing anything else here.** It is the working
agreement for AI agents contributing to this project: how much to explain, when to stop and ask, the
stack conventions, and the security invariants that must never be broken.

There are no separate instructions in this file. `AGENTS.md` is the single source of behavioural
guidance, so that every agent — Claude Code, Codex, or anything else — follows the same rules.

## The documents, in order of authority

1. **`ROADMAP.md`** — **the plan of record.** The build order, in Italian, as small verifiable phases.
   Work on the phase the owner names. Every phase has a *"Non fare adesso"* list; treat it as a hard
   boundary.
2. **`docs/decisions/`** — decisions already taken, with their reasons and their re-evaluation
   triggers. Read before proposing a change to any of them. `0008` is the one that shaped the current
   architecture.
3. **`docs/spec-v2.md`** — the specification. Authoritative for **product reasoning** (why evidence
   beats speculation, why the report is a diff, why AI stages run last). **Superseded on
   architecture**: wherever it describes a worker, a queue, a Podman sandbox, semantic fingerprints or
   an OCI plugin contract, those are no longer built — see `0008`. Cite it for *why*, never as an
   implementation instruction.
4. **`ROADMAP-old.md`** — the original two-year plan. Kept for history only. Never work from it.

## Four things to know immediately

- **The owner is learning to program.** You do most of the implementation; they make the decisions;
  their understanding is part of the deliverable. They do not merge code they cannot explain out
  loud.
- **We aggregate, we do not build.** GitHub Actions is the execution engine; `reviewdog` and GitHub
  code scanning handle diff-scoped findings and finding state; Playwright, Semgrep, osv-scanner,
  Gitleaks and axe are the tools; the reviewers are vendor CLIs or API endpoints behind one contract.
  Claude supports the owner's subscription on a hosted runner; Codex subscription auth requires a
  persistent trusted runner, while an ephemeral runner uses an API key (`0024`). What we write is the
  workflow, the agent adapters, the prompts, and the dashboard. If you find yourself building a queue, a
  sandbox, or a fingerprint algorithm, stop — that is the superseded plan.
- **The one mistake here that causes real harm is leaking the subscription token.** `pull_request`,
  never `pull_request_target` with secrets; the AI token never in a job that runs repository code. See
  `AGENTS.md` §9.
- **This file is not the settings file winnow gives to the agents it runs during a verification.**
  winnow deliberately strips `CLAUDE.md` and `AGENTS.md` from what an analysed repository's agent can
  see (spec §12.3, rule 2), precisely because a hostile repository would love to control them. Don't
  confuse the two roles.
