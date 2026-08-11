# 0002 — TypeScript/Node instead of Go for the binary and worker

> **Update 2026-08-11 — this decision now stands unconditionally.** `0008` removed the worker, the
> queue and the container sandbox, which were the only things Go had an advantage for. The trade-off
> described below no longer exists, the three guardrails are moot (there is no `src/sandbox/`), and the
> re-evaluation trigger is void. TypeScript, with React for the dashboard. Do not reopen.

**Question:** spec §5.4 chooses Go for the `winnow` binary and worker (TypeScript/React only for the
dashboard). Do we follow that, or build the whole project in TypeScript on Node?

**Options:**
- A) Go for binary/worker, TypeScript for the dashboard, per §5.4. Single static binary; the whole
  dependency surface (BuildKit, Dagger, Railpack, containerd, gVisor tooling) is native Go.
- B) TypeScript/Node throughout. One language instead of two; Playwright and the dashboard are
  native TypeScript; loses the single-static-binary distribution story until Part E.

**Choice:** B — TypeScript/Node throughout, pnpm.

**Reason:** the owner is learning to program while running an association; §5.4's own stated cost is
two languages, and its Go-specific advantages (BuildKit, Dagger, gVisor tooling) don't apply until
Part E, many months out — until then, sandboxing is `podman` invoked as an external process, which
Node does exactly as well as Go would. One language removes real friction now for a benefit that
doesn't arrive until much later. The dominant risk to this project is attrition, not architectural
debt; optimizing stack choice for v0.5 when the real question is "are you still working on this in
three months" optimizes the wrong variable. Full reasoning: `ROADMAP.md` D2.

**Cost, stated honestly:** loses the single static binary (§5.3 calls it "a large part of the
self-host value proposition"); the distribution unit becomes a Docker image plus an npm package.
Friction with Dagger/gVisor, if it arrives, arrives in Part E.

**Guardrails that keep this reversible** (so the deviation stays a deviation, not drift):
1. `src/sandbox/` stays thin — composes `podman` commands, no domain logic, rewritable in another
   language in about two days.
2. Findings are canonical as SARIF on disk (§17.1), never as in-memory TypeScript structures.
3. Re-evaluation happens only on a written trigger, not a vibe.

**Date:** 2026-08-11

**Re-evaluate when:** ~~any one of — Part E (server) begins; Dagger becomes genuinely necessary (D4);
or CLI distribution/startup time is flagged as a problem by a real user (not hypothesized).~~
**Void** — see the update at the top of this file. None of those triggers can fire: `0008` removed the
server, Dagger, and the CLI. This decision has no re-evaluation trigger left.
