# 0011 — Composite actions are winnow's operational package

**Question:** the roadmap has winnow-owned code (SARIF converters, agent adapters, config loading,
prompts) running inside a workflow that other repositories adopt. But when a reusable workflow is called
from another repository, `actions/checkout` checks out **the caller's** repository — winnow's `src/` is
not there. So how does winnow's own code reach the runner?

This blocks Fasi 2, 5, 7 and 15: every phase that adds winnow-owned code depends on the answer.

**Options:**

- A) **Composite actions referenced by SHA from the caller** — `uses: <owner>/winnow/.github/actions/<name>@<sha>`.
  ⚠️ **This does not work, and the reason is worth recording:** a commit cannot contain its own hash, so
  the workflow inside winnow cannot pin the actions that live beside it; and `uses:` accepts no
  expressions, so the SHA cannot be computed at run time either.
- B) **A second checkout managed by every caller**, with the repository and ref written by hand. Works,
  but each caller now maintains two checkouts and a version pin, and they drift.
- C) **Fully self-contained workflow**: no winnow-owned code at all — only third-party actions and
  inline shell. Maximum portability, but the agent contract, the config merge and the output validation
  cannot live anywhere, which guts Fasi 5–8.

**Choice:** composite actions, reached via **a second checkout that the reusable workflow performs on
itself**, using the `job.workflow_repository` and `job.workflow_sha` contexts — then invoked locally as
`uses: ./<path>`.

```yaml
# inside winnow's reusable workflow, not in the caller
- uses: actions/checkout@<sha>
  with:
    repository: ${{ job.workflow_repository }}
    ref: ${{ job.workflow_sha }}
    path: .winnow-tool
- uses: ./.winnow-tool/.github/actions/<name>
```

**Reason:** those two contexts resolve to the repository and exact commit of the workflow that is
running, which is precisely the self-reference option A could not express — and it is the mechanism
GitHub documents for this case. Versioning still comes out right: the caller pins the *workflow* by SHA,
and the workflow then checks out its own actions at that same SHA, so workflow and actions move together
without either naming a hash it cannot know.

Crucially, **the caller does not manage this**: it stays roughly twenty to thirty lines once its two
triggers, stable inputs and maximum permissions are declared (`0014`). The second checkout is an
implementation detail of the reusable workflow, which is what option B (below) got wrong.

**Consequences to apply while building:**

- **The entry point of every winnow-owned step is a composite action** under the tool checkout path,
  never a bare `src/…` path — a bare path resolves against the *caller's* checkout, where our code does
  not exist. `src/` still holds the shared TypeScript; the action is its wrapper.
- **The tool checkout goes to a fixed path** (`.winnow-tool`) that the workflow owns, kept distinct from
  the analysed repository's checkout so the two never mix.
- **The reusable workflow calls actions; it does not run our scripts.** If a phase wants to add a step
  that runs winnow code, the step is a new composite action.
- **Node availability is the action's problem, not the caller's**: each action that needs Node sets it
  up itself. A caller must not have to install anything for winnow's steps to work.
- **Fase 1 is unaffected** — it is pure YAML plus third-party actions, so it can be built before this
  decision is exercised. The constraint bites from **Fase 2** (the `tsc` → SARIF converter) and
  unavoidably in **Fase 3**, which already needs winnow-owned code: the `app.yml` Zod schema, the smoke
  spec, the axe spec, and the SARIF converters for browser and a11y results. (An earlier draft of this
  file said Fase 5; that was wrong — Fase 3 is where our first code ships.)
- **Fase 15 publishes both**: the reusable workflow *and* the composite actions it calls, versioned
  together at one SHA.

**Cost, stated honestly:** the second checkout is an extra step per run and puts winnow's own source in
the workspace next to the code under analysis — so the two checkout paths must stay clearly separated,
and nothing may assume a single working directory. Composite actions are also more ceremony than a
script — a directory and an `action.yml` per step — and they are harder to run locally, so the feedback
loop while developing them is a pushed commit rather than a local invocation. Mitigation: keep the action a thin wrapper around
testable TypeScript in `src/`, so the logic is unit-testable with `vitest` locally and only the wiring
needs a real run. Second cost: a caller pinning by SHA gets no automatic updates — which is the intended
trade-off, and Renovate on the caller's side is the answer (Fase 15).

**Date:** 2026-08-11 (corrected the same day: the first draft pinned actions with `@<sha>` from the
caller, which cannot work — a commit cannot contain its own hash and `uses:` takes no expressions)

**Re-evaluate when:** the number of composite actions makes the workflow hard to follow (a single
"winnow run" action taking inputs may then beat many small ones); or GitHub changes how `uses:` resolves
action repositories; or winnow ends up needing a published npm package for a reason unrelated to CI.
