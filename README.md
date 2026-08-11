> **early development — do not run this on untrusted repositories yet.**

# winnow

winnow is a self-hosted QA control plane. Give it a pull request: it boots the app in a disposable
sandbox, runs the repo's own checks and browser tests, asks an AI reviewer for what those missed,
and reports **only what the change introduced** — with a reproduction attached to everything it
claims.

The Phase 0 CLI currently supports only `winnow version`. It does not yet isolate, inspect, or verify
repositories, so this repository is documentation and an early foundation — not a tool to run on real
or untrusted projects.

## Planned workflow

1. You will point winnow at a pull request. It will clone the exact commit into a throwaway container.
2. It will work out how to run the project (from a committed config file, or a devcontainer, or a
   compose file, or by auto-detection) and installs the dependencies.
3. It will run the cheap, certain checks first: linter, type checker, the project's own tests, the
   build. For a web project it will then start the app with its database and seed data, open a real
   browser, click through it, and record everything that goes wrong.
4. Only then will it ask an AI agent — running on your existing Claude Code or Codex subscription,
   no API key required — to look for what the tools missed, given all the evidence collected above.
5. It will merge everything into one list, throw away anything that was already broken before your
   branch, and show you what your change introduced — with a reproduction attached to each item.

## Documents, in order of authority

1. [`docs/spec-v2.md`](docs/spec-v2.md) — the specification. Source of truth for architecture, the
   security model, the findings model, and milestones.
2. [`ROADMAP.md`](ROADMAP.md) — the specification broken into small, verifiable build
   phases (in Italian).
3. [`AGENTS.md`](AGENTS.md) — the working agreement for AI agents contributing to this repository.
4. [`docs/decisions/`](docs/decisions/) — decisions already taken, with their reasons and their
   re-evaluation triggers.

## Stack

TypeScript on Node 22, with pnpm — a deliberate, recorded deviation from the specification's choice
of Go (spec §5.4). See [`docs/decisions/0002-typescript-instead-of-go.md`](docs/decisions/0002-typescript-instead-of-go.md).

## Status

Phase 0 foundation. Following [`ROADMAP.md`](ROADMAP.md), Part A. No tags, no releases, and no
announcement before Part C. Do not run winnow on untrusted repositories yet.

## Licence

Apache-2.0. See [`LICENSE`](LICENSE). Contributions use a DCO sign-off (`git commit -s`); no CLA.

No telemetry — not opt-out, absent.
