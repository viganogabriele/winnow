# 0014 — The workflow is reusable (`workflow_call`) from Fase 1, not Fase 15

**Question:** every phase from Fase 1 onward must be tried on external fixture repositories, but the
roadmap only made the workflow reusable in Fase 15. So where does the workflow actually live while the
first fourteen phases are built? Related: `workflow_dispatch` is needed by Fase 5 (manual AI review) but
was introduced in Fase 11.

**Options:**

- A) **`workflow_call` from Fase 1.** winnow's repository holds the workflow; each fixture holds a
  short caller. Fase 15 then *publishes and documents* a surface that has been exercised for months.
- B) **Copy the workflow into each fixture** until Fase 15. Simpler first phase, but every change must be
  replicated across five repositories, the fixtures drift, and the reusable surface gets invented for the
  first time at the very end — where discovering it does not work is most expensive.

**Choice:** A.

**Reason:** the fixtures are external from Fase 1 by design (they must be real repositories with real
pull requests), so *something* has to bridge winnow's repository and theirs from day one. `workflow_call`
is that bridge, it is the mechanism GitHub provides, and it costs a `on: workflow_call:` block plus a
caller file. Choosing B means the thing Fase 15 ships has never run — and Fase 15 is the phase whose only
verification is "someone who is not you installs it and it works".

**Consequences to apply while building:**

- **Fase 1 creates two things:** `.github/workflows/winnow.yml` in winnow's repository with
  `on: workflow_call` (plus its inputs), and a caller committed to fixture #1.
- **`workflow_dispatch` exists from Fase 1 too**, on the caller side, because the caller is where a
  human-triggered run must start. Fase 5 needs it, Fase 11 only adds the dashboard UI on top of it.
- **The caller passes the PR number explicitly.** `workflow_dispatch` runs the workflow from the default
  branch, so the run does not implicitly know which pull request it concerns: the head SHA to analyse and
  the base SHA to read configuration from (`0009`, `0012`) are both derived from that number, inside the
  workflow.
- **Inputs are a compatibility surface from Fase 1.** Renaming one breaks every caller, so Fase 1 declares
  only the input whose meaning is already fixed: the PR number. Profile, provider and model are added as
  optional inputs in the phase that defines their semantics. Adding an optional input is additive; freezing
  an undefined name, type or default now would make accidental behaviour part of the public contract.

**Cost, stated honestly:** Fase 1 is no longer "one YAML file" — it is a called workflow plus a caller,
which is more moving parts in the phase whose whole purpose is proving the loop end to end. Mitigation:
the caller is roughly twenty to thirty lines — two triggers, the inputs, `permissions`, and the secrets
passed explicitly, because a called workflow inherits neither secrets nor wider permissions than the caller
grants. Short and stable, but not the one-liner an earlier draft of this file promised; the fixture setup is
honest about what adopters will actually paste.
Second cost: iterating on a `workflow_call` workflow means pushing before you can test it, since callers
reference a ref — so the feedback loop is a push rather than a local edit. It does **not** mean pushing to
the default branch: during development the fixture's caller can point at a dedicated branch
(`uses: <owner>/winnow/.github/workflows/winnow.yml@<branch>`), and only the published form pins a SHA.

**Date:** 2026-08-11

**Amended:** 2026-08-12 — the original text predeclared four inputs while also observing that adding an
input later is harmless. The contract now grows only when each input has defined semantics.

**Re-evaluate when:** the input surface needs a breaking change and there are external adopters (then
versioning by tag/SHA becomes a real policy question rather than a convention).
