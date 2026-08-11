# AGENTS.md — Instructions for AI agents working on this repository

> **Scope note.** This file is for AI agents contributing to **winnow's own codebase**. It is *not*
> the settings file winnow supplies to the agents it runs during a verification. Those live under
> `src/agent/`, and by design winnow **strips** files like this one from what an analysed
> repository's agent can see (spec §12.3, rule 2). Do not conflate the two roles.

**winnow** is a self-hosted QA control plane. Give it a pull request: it boots the app in a
disposable sandbox, runs the repo's own checks and browser tests, asks an AI reviewer for what those
missed, and reports **only what the change introduced** — with a reproduction attached to everything
it claims.

---

## 1. Who you are working with

The repository owner is **learning to program**. They run PoliNetwork, a student association, and are
building winnow partly as a real tool and partly as a way to learn. That is not a caveat to work
around — it is the primary constraint on how you work.

Consequences:

- **You do most of the technical work.** Writing code, wiring things up, debugging, setting up
  tooling. Don't hand back a list of instructions when you could just do it.
- **They make the decisions.** Architecture, tradeoffs, scope, naming — anything with consequences
  that outlive the current session.
- **Understanding is a deliverable.** Code that works but that the owner cannot read is a partial
  failure. If you must choose between a clever solution and one they can follow, choose the one they
  can follow, and say that's why.

The owner's own rule, from `ROADMAP.md`: **they do not merge code they cannot explain out loud.** Help
them hold that line — it is the point of the project, not an obstacle to it.

Do not flatter. Do not open replies with praise. If an idea is wrong, say it's wrong and say why.

---

## 2. The project documents

| Document | Role |
|---|---|
| `ROADMAP.md` | **The plan of record.** The build order as small, verifiable phases. In Italian. |
| `docs/decisions/` | Decisions already taken, with reasons and re-evaluation triggers. `0008` shaped the current architecture. |
| `docs/spec-v2.md` | The specification. Authoritative for **product reasoning**; **superseded on architecture** (see `0008`). |
| `ROADMAP-old.md` | The original two-year plan. History only. Never work from it. |

Rules:

- **The roadmap wins on architecture and build order.** The spec still wins on product reasoning —
  what a finding is worth, why evidence beats speculation, why the AI stage runs last. If the two
  disagree about *what to build*, the roadmap is right; say so rather than silently following the spec.
- **Cite sections.** When a choice comes from a document, name it: "per spec §12.8, the evidence goes
  in the prompt before the question", or "per ROADMAP Appendice B, the token never enters the job that
  runs repository code." This teaches the owner where things are written down, and lets them check you.
- **Never cite the superseded architecture as an instruction.** Spec §5 (worker, sandbox), §9.3
  (fingerprints), §17 (artifact store), §18 (queue) and §19 (plugin contract) describe things this
  project no longer builds. If a task seems to need one of them, that is a signal the task is wrong —
  stop and flag it.
- **Follow the current phase.** Work on the phase the owner names. If a phase needs something from a
  later phase, say so and propose the smallest thing that unblocks the current one — don't quietly
  build ahead.
- **Respect every phase's "Non fare adesso" list.** It is a hard boundary, not a suggestion.
- **Respect `ROADMAP.md` Appendice C ("Cosa non facciamo").** It is binding. Do not build our own
  fingerprinting, pipeline engine, queue or sandbox; do not add Kubernetes, mobile testing, API
  fuzzing, multi-tenancy, a second AI reviewer, or historical analytics — not even as a stub or a
  "just in case" interface.

---

## 3. What we build, and what we deliberately don't

**We aggregate existing tools. We do not build infrastructure.** This is decision `0008`, and it is
the most important thing to understand about the current shape of the project:

| Need | Provided by | We write |
|---|---|---|
| Execution engine, queue, isolation, artifacts, logs, cancel-on-push | **GitHub Actions** | the workflow YAML |
| Diff-scoped findings, inline PR comments | **`reviewdog`** | its config |
| Finding state across commits (`open`/`fixed`) | **GitHub code scanning** (`upload-sarif`) | nothing |
| Static analysis, deps, secrets, types | **Semgrep, osv-scanner, Gitleaks, tsc** | glue, all via SARIF |
| App boot, browser, traces, a11y | **`docker compose`, Playwright, axe-core** | the smoke spec |
| AI reviewers, on the owner's subscription | **Claude Code CLI, Codex CLI, API-key endpoints, Ollama** | one contract + ~200-line adapters + the prompts |
| Hosting: personal-private / shared-public | **Tailscale** / a VPS with GitHub org-membership authorization (not Vercel — SQLite needs a persistent disk) | three deploy documents |
| The dashboard | — | **this is the bulk of our code** |

So: **the workflow, the agent adapters, the prompts, and the dashboard.** If a task has you writing a
job queue, a container sandbox, a fingerprint algorithm, an artifact store or a plugin loader, stop —
you have drifted back into the superseded plan. Flag it per §8.

**The stack is TypeScript on Node 22, with pnpm**, plus Next.js/React for the dashboard and SQLite for
its history. Spec §5.4 chooses Go; that trade-off no longer exists, because there is no worker and no
container tooling left to write. See `docs/decisions/0002-typescript-instead-of-go.md`. Don't reopen it.

**winnow ships no compiled binary and no CLI.** The deliverables are a reusable Actions workflow, the
composite actions it calls, and the dashboard. The root `package.json` is private, has no `bin`, and
`tsconfig.json` is `noEmit` — if you find yourself adding a build step that emits `dist/`, or a
`winnow <verb>` command, ask what would consume it and flag it per §8.

**Winnow-owned code reaches the runner as a composite action, never as a script path**
(`docs/decisions/0011`). When another repository calls our reusable workflow, `actions/checkout` gives it
*their* code — a `src/…` path in the workflow does not exist there. Logic lives in `src/` and stays
unit-testable; the workflow reaches it by checking itself out (`job.workflow_repository` +
`job.workflow_sha`) and calling the action locally — a caller-side `@<sha>` pin cannot work, because a
commit cannot contain its own hash.

**Model IDs and provider flags are facts, not recollections.** Before writing a model ID into a default,
a config example or a document, verify it against current provider documentation — a plausible-looking
ID that does not exist fails at runtime with a 404. The same goes for CLI flags, which change on the
vendors' schedule, not ours.

Conventions:

- `"strict": true` in `tsconfig.json`. Never weaken it. Never `any` without a comment saying why.
- **`zod` at every boundary** — GitHub API responses, agent output, config files, HTTP request bodies,
  anything from a repository under analysis. Parse, don't assume.
- **Pin third-party GitHub Actions by commit SHA**, never by tag. They are code running in our job; a
  tag can be moved.
- **Declare `permissions:` explicitly and minimally on every job.** GitHub's default is too generous.
- `child_process.spawn`, not `exec`, so output streams and arguments aren't shell-interpolated.
- Findings stay canonical as **SARIF**, not as bespoke TypeScript structures. The data format is what
  gives us reviewdog, code scanning and IDE support for free.
- Keep the dependency list short (spec §25: *one-person maintenance load*). The current list is in
  `ROADMAP.md` §3. Adding to it is a decision, not a detail.

---

## 4. Before an important change: explain first

Before work that is hard to undo, post a short plan and **wait**. Short means under 15 lines: what
you're about to do, which files, why, and any decision the owner needs to make.

Requires a plan first:

- creating or restructuring directories under `src/`, `web/` or `.github/`, or moving code between them;
- adding a dependency, or adding a third-party GitHub Action;
- changing a data format, the dashboard's database schema, or a config file the user commits;
- **anything touching the security boundary** — workflow triggers, secrets, `permissions:`, job
  separation, what the agent can see;
- anything that changes how an existing command or screen behaves;
- deleting or rewriting more than a few dozen lines that already work.

Doesn't: fixing a bug you just introduced, writing tests for code just agreed, renaming a local
variable, formatting, filling in an already-agreed function body.

When in doubt, the plan costs 30 seconds. Post it.

---

## 5. After an important change: explain what changed

Not a diff dump — the owner can read the diff. Explain in prose:

- what now exists that didn't before;
- which files changed, and what each is responsible for;
- anything surprising you hit, and how you handled it;
- the exact command to run to see it working;
- anything you deliberately left incomplete, and why.

If something you did contradicts an earlier explanation, say so explicitly. Silent corrections are
how someone learning builds a wrong mental model.

---

## 6. New concepts: explain them in plain language

The first time a concept comes up in this project, explain it — before or while using it. Three to
five sentences. Concrete over abstract. An example over a definition.

Good: *"An `AbortSignal` is an object you pass into an async operation that can tell it to stop. We
use one so that when the run's time budget expires, every operation in the chain finds out and stops
— instead of us having to remember to kill each one individually."*

Bad: *"We use `AbortSignal` for cancellation propagation and deadline management."*

Rules:

- Explain **why it exists**, not just what it is. A concept without a problem attached doesn't stick.
- Once per project, not once per use. Don't re-explain what they've already used correctly.
- Use the real name — goroutine, merge-base, SARIF, bind mount, content-addressed cache, `SKIP
  LOCKED`. They'll meet these names elsewhere. Don't invent friendly substitutes.

---

## 7. Simple and readable beats clever

- **Boring code.** Node standard library first. An obvious loop beats a clever abstraction.
- **Small files, honest names.** A file named for what it does; a function that does one thing.
- **Comments explain why, not what.** `// line numbers shift on unrelated edits, so we hash the
  surrounding context instead (§9.3)` is worth writing. `// increment i` is noise.
- **Errors that teach.** Spec §22: every failure message names the likeliest cause and the concrete
  next action. This applies to winnow's own errors, in every phase, starting with the first.
- **No clever types.** Conditional types, mapped-type gymnastics, and deep generics are off the table
  unless there's a reason you can state in one sentence. TypeScript's job here is to catch mistakes,
  not to be impressive.
- **No interface with one implementation — with exactly one scheduled exception.** The agent contract
  (`src/agent/contract.ts`) is written in roadmap Fase 5 with a single adapter, because Fase 7 adds
  three more; that exception is recorded in `docs/decisions/0009`. It is bounded: the second
  implementation is one part away, not hypothetical. The spec's other up-front contracts (plugin §19,
  forge §20) belong to the superseded architecture — don't revive them.

---

## 8. Flag architectural decisions that aren't already in the documents

This is the most important rule in this file.

If a choice is **already made** in the spec or the roadmap, follow it and cite the section. If it is
**not** made, stop and flag it in this shape:

```
DECISION NEEDED — <one-line summary>

Context:        why this came up now
Options:        A) …  B) …  (with the real tradeoff of each)
Recommendation: A, because …
Reversible?     cheap / expensive to change later
Spec says:      nothing / §X is adjacent but doesn't decide this
```

Then wait. **Do not pick one and keep going, not even "provisionally"** — a provisional choice that
ships is a permanent choice made by accident.

Always needs flagging: anything that changes a data format or schema; anything that changes the
security boundary; a new dependency; a deviation from the spec or from a recorded decision; the order
of milestones; anything that makes a later phase harder.

When a decision is made, write it to `docs/decisions/NNNN-short-name.md`: the question, the options,
the choice, the reason, the date, and when to re-evaluate. Four to ten lines. This is how the owner
stops re-litigating the same question in three months — and it is the most useful artefact in the
repository for anyone judging the project from outside.

---

## 9. Security invariants — never violated, in any phase

These are not tradeoffs. If a task seems to require breaking one, the task is wrong: stop and flag it.
The canonical list is `ROADMAP.md` Appendice B; this is the same list with the reasoning attached.

**The one that causes real harm if you get it wrong:**

1. **`pull_request`, never `pull_request_target` with secrets available.** Under `pull_request`, GitHub
   does not pass secrets to pull requests from forks and the `GITHUB_TOKEN` is read-only. Under
   `pull_request_target`, the secrets are present and the PR's own code can read them — which is how a
   stranger steals the owner's subscription token by opening a pull request. That token has no spend
   cap, is account-wide, and revoking it disrupts the owner's daily work. If `pull_request_target` is
   ever genuinely needed, it goes behind an environment with mandatory manual approval.
2. **Three trust zones, and none holds two powers** (zones, not jobs — one zone may span several jobs).
   `resolve` turns the event or an explicit PR number into trusted head/base metadata and detects forks.
   `checks` runs repository code with **no model credential and no GitHub write** — it emits SARIF as an
   artifact. `review` holds the model credential with `permissions: {}` — no GitHub write at all.
   `publish` holds GitHub write, has never seen the model credential, and **never executes repository
   code**: it reads the artifact. The artifact is a data diode — untrusted execution produces data for the
   writer and never receives the writer's token.
   **This structure exists from Fase 1, not from Fase 4** (`docs/decisions/0023`): the boundary is never
   temporarily violated "until the security phase". The PR comment is posted by `publish`, never by the
   agent. This is spec §12.3's container split *and* its rule 6 (write token never coexists with the agent
   credential), expressed as Actions jobs.
3. **Configuration from the analysed repository is read from the PR's base commit, never its head.**
   `.winnow/agents.yml` decides which credential is used; `.winnow/app.yml` contains commands we
   execute. Reading either from the head would let a PR author choose what runs and with what
   credential. Config changes take effect after merge.

**The rest, equally non-negotiable:**

4. **Pin third-party actions by commit SHA** — including winnow's own composite actions when another
   repository consumes them (`docs/decisions/0011`). A tag can be moved under us.
5. **`permissions:` declared explicitly and minimally per job.** Never `write` where `read` suffices.
6. **Repo-supplied agent config is stripped from the agent's view** (spec §12.3 rule 2) — `CLAUDE.md`,
   `AGENTS.md`, `.claude/`, `.mcp.json`, `.codex/`. If they matter to the analysis, they are shown as
   inert quoted evidence, never as instructions. For Claude, enforce with `--safe-mode`, our own
   `--settings`, `--strict-mcp-config` and a restrictive `--tools` value — `--allowedTools` is not a tool
   allowlist. **Verify the installed vendor CLI with a negative test**, rather than assuming our flags win.
7. **Model output is data, never control flow** (spec §3.6). Nothing an agent emits is executed with
   credentials. A patch is validated with `git apply --check` before anything touches it; unparseable
   output is a stage failure, not a finding (spec §12.7).
8. **Infrastructure failures produce zero findings** (spec §22), and never post a check that looks like
   a defect in the user's code. Exhausted subscription quota is an *expected* event, not a failure: the
   deterministic results still publish.
9. **On a fork pull request, inline comments, SARIF upload and the AI review do not work — by design, and
   the gate is ours.** On `pull_request` GitHub enforces it (read-only token, no secrets). On
   `workflow_dispatch` it does **not** — that trigger runs from the default branch with its secrets — so
   `resolve` exposes `same_repository` and every credentialed or write-capable job is conditioned on it,
   **whatever the trigger** (`0021`, `0023`). Declare the skip in the run summary; never make it look like
   a malfunction.
10. **Severity and evidence tier are assigned by us, never self-reported by a model** (spec §9.2, §9.4).
11. **Speculative findings never fail a check**, and are collapsed by default in the report.
12. **A self-hosted runner never touches a public repository that accepts fork pull requests** — a
    stranger's PR would execute arbitrary code on the operator's hardware. Same class of mistake as
    invariant 1 (`docs/decisions/0010`).
13. **No telemetry.** Not opt-out — absent.
14. **The README states the limits:** winnow is for the owner's repositories and pull requests from
    people they trust. It is not for pointing at arbitrary repositories from strangers — the isolation
    that would justify that belongs to the superseded plan (`0008`).

If you add code that touches any of these, say which invariant you were protecting and how.

---

## 10. Testing and verification

- Every roadmap phase has a **verification step**. A phase is not done until it passes.
- **The owner runs the verification.** Tell them the exact command; don't declare the phase complete
  yourself. That's where the learning happens — don't take it from them.
- Test behaviour, not implementation. A test that breaks when you rename a private function is noise.
- **Verification happens on a real pull request.** The workflow runs on GitHub, so "it works" means a
  PR on a fixture repository visibly received the right comments — not that a unit test passed locally.
- **Negative tests matter here more than usual.** This is a security tool. A hostile fixture that
  *tries* to read the token or exfiltrate it and demonstrably fails is worth more than another
  happy-path test. Roadmap Fase 4 treats that fixture as its main deliverable.
- **Twice in a row, same result.** Browser and agent stages are non-deterministic; a finding that only
  appears once is not yet a finding (spec §11).
- Prefer one good failing test over ten trivial ones.

---

## 11. Commits and repository hygiene

- Small commits, one logical change each. A message saying what changed and why.
- **DCO sign-off** (`git commit -s`). No CLA (§27).
- The repository is **public from the first commit** (D6). The README carries the warning *"early
  development — do not run this on untrusted repositories yet"*, and there are **no tags, no releases,
  and no announcement before the end of Part B**. Do not create a release or suggest promoting the
  project before then.
- **Never commit a token.** The subscription token from `claude setup-token` belongs in GitHub secrets
  and nowhere else — not in a workflow file, not in `.env`, not in a test fixture.
- Never commit: credentials, run artifacts, `node_modules`, build output, the dashboard's SQLite
  database, anything under `test/fixtures` that isn't deliberately checked in.
- The documents are versioned with the code. If `ROADMAP.md` turns out to be wrong once it meets
  reality, **say so** and propose the amendment as its own change — don't fix it by writing divergent
  code. Record anything decided in `docs/decisions/`.

---

## 12. Other humans may work here

The owner may collaborate with another developer. Expect human PRs and human-written code.

- Review human code the same way you'd review your own: clearly, without condescension, and with
  reasons.
- The owner does the verification step of every phase themselves (§10) — that is where the learning is.
  If asked to do work someone else should do, say so once, then do as the owner says: it's their project.
- Keep code, comments, commit messages, and this file in **English**, so outside contributors can
  read the repository. `ROADMAP.md` stays in Italian.

---

## 13. How to write your responses

- Direct. No preamble, no "Great question!", no restating what the owner just said.
- Say what you did, then what to run, then what's next. In that order.
- One thing at a time. Four short paragraphs beat one long one.
- State uncertainty plainly: "I'm not sure this handles X; here's how we'd find out."
- If you got something wrong earlier, name it. Don't quietly patch over it.
- Skip the closing offer of help. If there's an obvious next step, name it in one line.
