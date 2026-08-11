# 0021 — Findings are promoted by observation, in a credential-free `confirm` job

**Question:** three separate problems turned out to be the same missing piece.

1. **A described reproduction is not a reproduction.** The reviewer prompt asks the model for "the minimal
   reproduction you would run" — text. But `aggregate` may only assign `reproduced` when a reproduction
   actually re-fails, and the first real generated test lives in Fase 13. So every AI-only finding in
   Fase 5 would be `speculative`, and the phase's exit criterion — "≥50% of non-speculative AI findings are
   true positives" — would have a **zero denominator**. Unmeasurable.
2. **The visual check was temporally impossible.** The model picks element ids while reading evidence in
   `review`; the targeted measurement was scheduled in `checks`, which has already finished. A completed
   job cannot receive the model's choices retroactively.
3. **The 2-of-3 repetition policy had nowhere to run.** `checks` captures one execution, and the findings
   that need repeating are only known after the model has spoken.

**Options:**

- A) **Accept it: all AI-only findings stay `speculative`** until Fase 13 produces real tests. Simplest and
  honest, but the evidence ladder of spec §4.2 never materialises, the visual confirmation of `0019` cannot
  run at all, and the Fase 5 exit criterion has to be reworded around findings nobody has verified.
- B) **A `confirm` job, after `review`, with no model credential.** It re-boots the app, *executes* the
  reproduction the model proposed, measures the element rectangles the model named, and performs the
  repetitions. `aggregate` then promotes on what `confirm` **observed**.

**Choice:** B.

**Reason:** it is the only one that makes promotion mean something, and it costs one job rather than a
subsystem — because `confirm` holds **no model credential**, so it is free to run repository code, boot the
app, and issue requests. It belongs to the same trust zone as `checks`. All three problems above are
"something must act *after* the model but *without* its credential", which is exactly one job-shaped hole.

**The workflow DAG, in full:**

```
resolve   (no credentials at all)
  resolve the PR number → head SHA, base SHA, head repo
  ⚠️ gate: if head repo ≠ base repo, review/confirm/publish are skipped — see below

checks    (no model credential · contents: read)
  install → build → services → setup → app → Playwright + axe
  base run and head run (0018) · manifest capture (0019)

review    (model credential · permissions: {})
  reads evidence only · no repository code runs here, at all

confirm   (no model credential · contents: read)
  re-boots the app · executes proposed reproductions · measures named element ids
  runs the 2-of-3 repetitions on findings that claim to be reproducible

publish   (GitHub write · no model credential)
  aggregate assigns severity and tier from observed facts · comment + SARIF
```

**The fork gate lives in `resolve`, and this is a security fix, not a convenience.** `pull_request` from a
fork gets no secrets — but **`workflow_dispatch` runs from the default branch with its secrets**, and the
manual review path takes a PR number. So a manually dispatched review of a *fork* PR would not be protected
by GitHub's event semantics at all. Therefore the protection must be **ours and trigger-independent**:
`resolve` compares head and base repository, and every credentialed or write-capable job is conditioned on
them matching. What the README already promised is now enforced by the workflow rather than inferred from
the event.

**What `confirm` may and may not do:**

- **May:** boot the app, run repository commands from `.winnow/app.yml`, issue HTTP requests, run Playwright.
- **May not:** hold any model credential, hold GitHub write, or execute anything the model *wrote as code*.
  It executes **structured reproduction descriptors** — an HTTP method plus a route plus a body, or a list
  of element ids — validated against a schema. A shell command or a script from the model is never run
  (invariant 7). That is the line between "the model proposes an experiment" and "the model runs code".
- **A reproduction it cannot express as a descriptor is not attempted**, and the finding stays speculative.
  The descriptor vocabulary is deliberately small in v1: HTTP request, navigate-and-observe, element ids.

**Consequences for the phases:**

- **Fase 5 owns the honest version of its own exit criterion:** `confirm` does not exist yet there, so all
  AI-only findings are `speculative`, and the criterion measures the true-positive rate over **all** AI
  findings on ten pull requests. Measurable, and it tests the prompt rather than the plumbing.
- **Fase 6 builds `confirm`**, and that is what makes the visual check and the repetition policy possible.
  Promotion to `reproduced` begins there.
- **Fase 13 reuses `confirm`'s shape** for fix mode rather than inventing a second verification path.

**Cost, stated honestly:** the app is booted twice per run in the worst case — once in `checks`, once in
`confirm` — on top of the base/head doubling from `0018`. On a slow-booting application this is the
dominant cost of the whole pipeline, and the mitigation (only boot when there is something to confirm) has
to be built rather than assumed. Second cost: the descriptor vocabulary is a small language of our own, so
every reproduction shape a model might propose but we cannot express is a promotion we silently forgo — and
"silently" is the dangerous part, so it must be visible in the report. Third: a fifth job makes the workflow
harder to read, and the DAG is now the thing a newcomer must understand first.

**Date:** 2026-08-11

**Re-evaluate when:** the descriptor vocabulary keeps failing to express real reproductions (then the shape
is wrong, not the size); or double app boot dominates run time; or Fase 13's generated tests make the
descriptor path redundant.
