> **early development — do not run this on untrusted repositories.**

# winnow

**The QA control plane GitHub doesn't give you.** Point it at a pull request: it runs the linters and
analysers, boots the app with its database, drives a real browser through it, then asks an AI reviewer
for what the tools missed. You get inline comments on the diff, a report with screenshots and a
downloadable trace, and proposed fixes you approve before anything is pushed.

For a **personal install**, Claude can use your existing subscription on a GitHub-hosted runner; Codex
subscription mode requires a persistent trusted self-hosted runner. An ephemeral runner uses an API key.
A **shared deployment** uses its own credentials (API key, a Team/Enterprise plan, or a cloud provider):
one person's individual subscription is not a lane for a group. See
[`docs/decisions/0015`](docs/decisions/0015-subscription-mode-is-for-personal-installs.md).

Two pieces, both assembled from existing open source tools:

1. **A reusable GitHub Actions workflow** a repository adopts with one short caller file.
2. **A self-hosted dashboard** where you connect your repositories, see every open pull request in one
   list, launch reviews (several at once, picking the model), and read the results. Run it on
   `localhost` or privately over Tailscale for yourself, or publicly for a team — authorized by GitHub
   organization membership. Same app, three configurations.

Reviewers are pluggable behind one contract: **Claude Code**, **Codex CLI**, any API-key endpoint, or a
local **Ollama** model — with the model choosable per task and defaults you can change.

What makes it different from a text-only AI reviewer: it **starts the application and drives it with a
real browser**, so a 500 on form submit or a layout that breaks on mobile shows up as an observed fact with
a reproduction attached, not as a guess about the source code. The AI reviewer then works from that
evidence — it reads what the browser found rather than navigating itself, which is what keeps the model
credential in a job where no repository code runs
([`0013`](docs/decisions/0013-agent-reads-evidence-it-did-not-produce.md)).

## How it works

```
dashboard  ──workflow_dispatch──▶  GitHub Actions
 (local ·                            │
  Tailscale ·      checks  ─────────▶├─ ESLint · Semgrep · osv-scanner · Gitleaks · tsc  → SARIF
  public)     (no AI credential)     ├─ compose up  →  app + database + seed
                                     └─ Playwright + axe  →  traces, HAR, screenshots, 5xx
                                            │
                  review  ─────────────────▶  the agent READS that evidence
              (AI credential, no                ← your subscription, your model
               GitHub write, no                 no repository code runs in this job
               repository code)                        │
                  publish ────────────────────────────▶  inline comments · code scanning
              (GitHub write, no AI credential)              │
                                     ◀── dashboard reads results
```

The ordering is the design: cheap and certain before expensive and probabilistic. The AI reviewer
receives everything above as evidence, so it checks a body of facts rather than guessing from source.

## Built on

[GitHub Actions](https://docs.github.com/actions) ·
[reviewdog](https://github.com/reviewdog/reviewdog) ·
[GitHub code scanning](https://docs.github.com/code-security/code-scanning) ·
[Playwright](https://playwright.dev) · [axe-core](https://github.com/dequelabs/axe-core) ·
[Semgrep](https://semgrep.dev) · [osv-scanner](https://github.com/google/osv-scanner) ·
[Gitleaks](https://github.com/gitleaks/gitleaks) ·
[Claude Code CLI](https://code.claude.com/docs/en/cli-usage) ·
[Ollama](https://ollama.com) · [Tailscale](https://tailscale.com)

We deliberately build almost none of this ourselves — see
[`docs/decisions/0008-github-actions-as-the-engine.md`](docs/decisions/0008-github-actions-as-the-engine.md).

## Limits, stated plainly

- **For your own repositories, and pull requests from people you trust.** Not for pointing at
  arbitrary repositories from strangers: the isolation that would justify that is explicitly out of
  scope.
- **On a fork pull request, inline comments, SARIF upload and the AI review do not run.** The workflow
  enforces this from the resolved head/base repositories for every trigger; GitHub's read-only token and
  absent secrets provide another layer on the normal `pull_request` trigger. The analysers still run;
  the run says so.
- **Subscription mode is for personal installs.** A shared deployment needs its own credentials.
- **GitHub only.** Another forge would mean a second engine, not a config flag.
- **Node/TypeScript with ESLint**, for now — npm or pnpm. Other languages and other linters (Biome,
  oxlint) are not supported yet.
- **Public repositories.** GitHub code scanning is free there; private repositories would need GitHub
  Advanced Security.
- Findings are scoped to the pull request's diff, which is line-based: a pre-existing defect on a line
  your PR merely reindents can read as new.

## Documents, in order of authority

1. [`ROADMAP.md`](ROADMAP.md) — the plan of record, as small verifiable phases (in Italian).
2. [`docs/decisions/`](docs/decisions/) — decisions taken, with reasons and re-evaluation triggers.
3. [`docs/spec-v2.md`](docs/spec-v2.md) — the specification. Authoritative for product reasoning,
   **superseded on architecture**.
4. [`AGENTS.md`](AGENTS.md) — the working agreement for AI agents contributing here.
5. [`ROADMAP-old.md`](ROADMAP-old.md) — the original two-year, build-it-all plan. History only.

## Stack

TypeScript on Node 22 with pnpm, Next.js/React for the dashboard, SQLite for its history. No compiled
binary: the deliverables are a workflow and a web app.
See [`docs/decisions/0002-typescript-instead-of-go.md`](docs/decisions/0002-typescript-instead-of-go.md).

## Status

Documentation and decisions only — no working code yet. Following [`ROADMAP.md`](ROADMAP.md), Part A:
the workflow. No tags, no releases, and no announcement before the end of Part B.

## Licence

Apache-2.0. See [`LICENSE`](LICENSE). Contributions use a DCO sign-off (`git commit -s`); no CLA.

No telemetry — not opt-out, absent.
