# 0017 — No cross-repository queue: dispatch everything, display the truth

**Question:** the dashboard lets several pull requests be reviewed at once, possibly across different
repositories. Subscription quota is effectively single-lane, so those AI stages contend. GitHub's
`concurrency` groups are **per repository**, so Actions does not serialise runs across repositories for
us. Who queues?

**Options:**

- A) **The dashboard queues**: dispatch one, wait for it to finish, dispatch the next. True serialisation
  and an accurate "in queue" display — at the cost of queue state, timeouts, and crash recovery in the
  dashboard.
- B) **Restrict multi-select to a single repository**, where Actions' `concurrency` handles it for free.
  No queue code, but the multi-repository launch — a feature the owner explicitly asked for — is gone.
- C) **Dispatch everything and display honestly.** Runs start in parallel and contend for quota; the
  dashboard shows which runs are waiting on quota rather than implying orderly progress.

**Choice:** C.

**Reason:** the deterministic stages — which are most of the run and all of Part A's value — do not
contend at all: they cost only Actions minutes, and parallelism there is a benefit, not a hazard. Only the
AI stage contends, and the pipeline already treats exhausted quota as an **expected** outcome rather than
a failure (invariant 8): deterministic results publish, the AI stage is marked skipped, the run is
retryable. So the contention has a well-defined, already-required behaviour, and building a queue would
add state and failure modes to buy orderliness the product does not need. C also keeps the
multi-repository launch the owner asked for.

**What this obliges:**

- **The "skipped: quota" path is load-bearing, not an edge case.** It is now the normal outcome of
  launching several reviews at once, so it must be implemented properly in Fase 5 and shown clearly in
  the dashboard — with a retry that is one click.
- **The dashboard never displays a queue it does not have.** No fake position numbers, no "waiting its
  turn". A run is running, done, or skipped for quota.
- **Retry is the user's lever.** Since order is not controlled, the answer to "this one got skipped" is
  re-running it, and that must be obvious.

**Cost, stated honestly:** launching five reviews at once will sometimes produce fewer than five AI
reviews, and the user has to retry — friction that option A would have removed. If that friction turns
out to be constant rather than occasional, A becomes worth its complexity, and the dashboard already has
SQLite to hold queue state.

**Date:** 2026-08-11

**Re-evaluate when:** users routinely retry quota-skipped runs (the friction is constant, not
occasional); or a provider exposes quota headroom well enough to schedule against it.
