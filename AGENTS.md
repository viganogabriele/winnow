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

## 2. The two project documents

| Document | Role |
|---|---|
| `docs/spec-v2.md` | **The specification. The source of truth.** Architecture, security model, findings model, milestones. |
| `ROADMAP.md` | The build order: the spec broken into small, verifiable phases. In Italian. |

Rules:

- **The spec wins.** If the roadmap and the spec disagree, the spec is right and the roadmap needs
  fixing. Say so rather than silently following the roadmap.
- **Cite sections.** When a choice comes from the spec, name the section: "per §9.3, the fingerprint
  must not include the line number." This teaches the owner where things are written down, and lets
  them check you.
- **Follow the current phase.** Work on the phase the owner names. If a phase needs something from a
  later phase, say so and propose the smallest thing that unblocks the current one — don't quietly
  build ahead.
- **Respect every phase's "Non fare adesso" list.** It is a hard boundary, not a suggestion.
- **Respect the deferred list.** Spec §24 defers a set of things indefinitely and the roadmap repeats
  it. It is binding. Do not add Kubernetes workers, mobile testing, API fuzzing, historical
  analytics, or model benchmarking — not even as a stub or a "just in case" interface.

---

## 3. Stack, and the one deliberate deviation from the spec

**The project is TypeScript on Node 22, with pnpm.** Spec §5.4 chooses Go for the binary and worker;
this project deviates deliberately. The reasoning, the costs, and the three guardrails are written in
`ROADMAP.md` D2 and in `docs/decisions/`.

**Do not "correct" this back to Go.** It is a recorded decision with a recorded trigger for
re-evaluation. If you think the trigger has fired, flag it using the format in §8 below — don't act
on it.

The three guardrails exist so the deviation stays reversible. Protect them:

1. **`src/sandbox/` stays thin.** It composes `podman` commands and holds no domain logic. It must
   remain the kind of module that can be rewritten in another language in two days.
2. **Findings are canonical as SARIF on disk** (§17.1), never as in-memory TypeScript structures that
   only this codebase understands. The data format outlives the language.
3. **Re-evaluation happens on a written trigger**, not on a whim: start of Part E, a genuine need for
   Dagger, or a distribution/startup complaint from a real user.

Conventions:

- `"strict": true` in `tsconfig.json`. Never weaken it. Never `any` without a comment saying why.
- **`zod` at every boundary** — config files, agent output, API request bodies, anything from a
  repository under test. Parse, don't assume.
- `child_process.spawn`, not `exec`, so output streams and arguments aren't shell-interpolated.
- `AbortSignal` for every cancellable operation. Timeouts propagate; they are not re-implemented per
  call site.
- Keep the dependency list short (§25: *one-person maintenance load*). The current list is in
  `ROADMAP.md` §2. Adding to it is a decision, not a detail.
- Pin container images by **digest**, never by tag (§16).

---

## 4. Before an important change: explain first

Before work that is hard to undo, post a short plan and **wait**. Short means under 15 lines: what
you're about to do, which files, why, and any decision the owner needs to make.

Requires a plan first:

- creating or restructuring directories under `src/`, or moving code between them;
- adding a dependency;
- changing a data format, a database schema, or a config file the user commits;
- anything touching the security boundary (sandboxing, credentials, egress, the container split);
- anything that changes how an existing command behaves;
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
- **No interface with one implementation** — with one exception: the spec explicitly defines contracts
  up front (the agent-runner contract §12.1, the plugin contract §19, the forge interface §20). Those
  are specified, so they're not speculative.

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

From the spec. These are not tradeoffs. If a task seems to require breaking one, the task is wrong:
stop and flag it.

1. **The repository under test is hostile.** No exceptions, no "internal repo so it's fine" mode
   (§3.5).
2. **Never mount the Docker socket into a sandbox** (§15.2). If a repo's tests need Docker, use a
   nested rootless daemon or refuse and explain why.
3. **The agent credential never enters a container that executes repository code** (§12.3). The exec
   container runs code and holds no model credential. The agent container holds the credential, a
   read-only workspace, and egress to exactly one host.
4. **Model output is data, never control flow** (§3.6). Nothing an agent emits is executed on the
   host or granted credentials. Agent output is schema-validated before it reaches the control plane;
   unparseable output is a stage failure, not a finding (§12.7).
5. **Egress is default-deny through a logging proxy** (§15.3). During the agent step, exactly one
   destination is reachable, and `egress.log` is an artefact of the run.
6. **Repo-supplied agent config is stripped from the agent's view** (§12.3 rule 2) — `CLAUDE.md`,
   `AGENTS.md`, `.claude/settings.json`, `.mcp.json`, `.codex/config.toml`, execpolicy rules. If they
   matter to the analysis, they are shown as inert quoted evidence, never as instructions.
7. **Infrastructure failures produce zero findings** (§22), and never post a check that looks like a
   defect in the user's code.
8. **Severity and evidence tier are assigned by the aggregator, never self-reported by a model**
   (§9.2, §9.4).
9. **Speculative findings never fail a check** (§20).
10. **The forge write token never enters a sandbox**, and never coexists with an agent credential in
    one process (§12.3 rule 6).
11. **No telemetry.** Not opt-out — absent (§27).

If you add code that touches any of these, say which invariant you were protecting and how.

---

## 10. Testing and verification

- Every roadmap phase has a **verification step**. A phase is not done until it passes.
- **The owner runs the verification.** Tell them the exact command; don't declare the phase complete
  yourself. That's where the learning happens — don't take it from them.
- Test behaviour, not implementation. A test that breaks when you rename a private function is noise.
- **Fingerprint stability tests are non-negotiable** (§9.3): stable across unrelated edits, and across
  tool version bumps, asserted against a fixture repo in CI.
- **Negative tests matter here more than usual.** This is a security tool. A hostile fixture that
  *tries* to read the credential or reach the network and demonstrably fails is worth more than
  another happy-path test.
- Prefer one good failing test over ten trivial ones.

---

## 11. Commits and repository hygiene

- Small commits, one logical change each. A message saying what changed and why.
- **DCO sign-off** (`git commit -s`). No CLA (§27).
- The repository is **public from the first commit** (roadmap D6). The README carries the warning
  *"early development — do not run this on untrusted repositories yet"*, and there are **no tags, no
  releases, and no announcement before Part C**. Do not create a release or suggest promoting the
  project before then.
- Never commit: credentials, `.winnow` files from fixture repos, run artifacts, `node_modules`, build
  output, anything under `test/fixtures` that isn't deliberately checked in.
- The spec lives at `docs/spec-v2.md` and is versioned with the code. If a spec section turns out to
  be wrong once it meets reality, **say so** and propose the amendment as its own change — don't fix
  it by writing divergent code.

---

## 12. Other humans may work here

The owner may collaborate with another developer. Expect human PRs and human-written code.

- Review human code the same way you'd review your own: clearly, without condescension, and with
  reasons.
- Some phases are deliberately reserved for the owner (roadmap §3: Parts A and B). If asked to do
  work assigned to someone else, mention the roadmap's split once, then do as the owner says — it's
  their project.
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
