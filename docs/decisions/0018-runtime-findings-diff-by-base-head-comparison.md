# 0018 — Runtime findings are diffed by comparing a base run against a head run

**Question:** `0008` claims `reviewdog` (diff-scoped comments) and GitHub code scanning (state across
commits) replace the semantic fingerprinting of the superseded plan. That is true for analyser findings,
which carry a file and a line. It is **false for runtime findings** — a 500 on `PATCH /api/profile`, an
axe violation, a layout defect — because they have no source location: `reviewdog` filters by changed
line, and code scanning requires a physical location to surface a SARIF result at all.

Consequence, which is a product failure rather than a technical one: Fase 3 runs the app on the pull
request's head only, so a 500 that already existed on the base branch would be reported as something the
pull request broke. That is precisely the thing winnow promises not to do (spec §4.1: the report is a
**diff** against the merge base, not a list of everything observed).

**Options:**

- A) **Run the browser profile twice in the same run** — once on the merge base, once on the head — and
  compare exact runtime keys. Location-less findings go in the report and the run summary, never as
  code-scanning alerts.
- B) **Head only, honestly labelled** "observed, origin unknown". Cheap, and it contradicts the product:
  on the first repository with pre-existing problems the report is noise again.
- C) **No diff for runtime findings in v1** — show them as evidence, not as new findings; keep the diff
  model for analysers only. Defers the problem honestly rather than half-solving it.

**Choice:** A.

**Reason:** the differential report is the product, not a feature of it — and runtime findings are the
class winnow is *distinctive* for producing. Shipping them undiffed would mean the one thing winnow does
that a source-only reviewer cannot do is also the one thing it reports badly.

**This is a narrow, deliberate exception to Appendice C's ban on our own fingerprinting**, and the
boundary matters:

- **In scope:** a comparison **key** for runtime findings — `method + route template + status + error
  class` for HTTP, `rule + selector-ish target` for axe, `page + viewport + defect class` for visual —
  compared between two runs **of the same commit pair, in the same workflow run**.
- **Out of scope:** everything that made v2's fingerprinting expensive. No hash of surrounding syntactic
  context, no stability guarantee across tool version bumps, no persistence across runs, no database of
  fingerprints over time. The key only has to be stable for **twenty minutes**, between two runs of the
  same profile on two commits.

That difference is what keeps this from being the six-to-ten-week subsystem `0008` cut.

**How it works:**

```
run on merge-base  →  key set B      (cacheable by base SHA + profile)
run on head        →  key set H

new       = H \ B   ← this is the report
resolved  = B \ H   ← show it as a win
unchanged = H ∩ B   ← collapsed, one line
```

- **Location-less findings never become code-scanning alerts.** They live in the pull request comment and
  the run summary. Attempting to give them a synthetic file and line to satisfy code scanning would create
  alerts pointing at innocent code — worse than not having them there.
- **⚠️ Caching the base run is harder than it first looks, and the first draft of this file got it wrong.**
  A cache written during a `pull_request` run is scoped to that pull request's ref, so it is **not** readable
  by other pull requests — "an active default branch means a cache hit almost always" was false. Only caches
  written from the **default branch** are readable by every branch and pull request. Two further hazards: a
  `workflow_dispatch` run writes into the default-branch scope while potentially analysing an untrusted
  head, so it must **never** write a cache that later runs will trust.
  **Therefore, in order:** v1 simply **runs the browser twice per pull request** and accepts the cost;
  later, a trusted `push`-triggered workflow on the base branch may prepare the baseline, and only that
  workflow writes the shared cache. Correct first, fast second.
- **If the base run fails for infrastructure reasons, the head findings are published without the diff,
  flagged as un-diffed.** Never silently present un-diffed runtime findings as new — that is the failure
  mode this whole decision exists to prevent.
- **Analyser findings keep using `reviewdog` and code scanning** exactly as before. This decision adds a
  second, narrower mechanism alongside them; it does not replace them.

**Amends `0008` and N2:** their claim must be scoped to "findings that carry a source location". The
honest version is that upstream tools cover the analyser diff completely and the runtime diff not at all,
and the gap is filled by a base/head comparison rather than by a fingerprint store.

**Cost, stated honestly:** the browser stage runs twice **on every pull request** in v1, which doubles the
most expensive deterministic stage — the caching that would have avoided it is deferred because getting it
wrong is worse than not having it (a wrong baseline mislabels findings, and an untrusted head must never
poison a trusted cache). Second cost: the comparison keys are
ours to design and get wrong; a key that is too precise reports pre-existing problems as new, one that is
too coarse hides real ones. That is exactly the tuning work `0008` hoped to avoid, now scoped to one
finding class instead of all of them. Third: two runs of a non-deterministic stage disagree sometimes,
which is why the repetition policy (2-of-3) is not optional here.

**Date:** 2026-08-11

**Re-evaluate when:** the comparison keys prove unstable enough that the diff misleads on real
repositories (then C — evidence without diff — is more honest than a wrong diff); or base-run caching
turns out not to hit, making every pull request pay 2×.
