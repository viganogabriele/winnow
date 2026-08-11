# 0016 — Composite actions install their dependencies at runtime from a lockfile

**Question:** `0011` makes composite actions the package for winnow-owned code. GitHub fetches the
action's repository, so the *sources* are present — but `node_modules` is not, and the code needs `zod`
and `yaml`. `dist/` is excluded by decision (`0008`: no compiled binary). So how does an action's code get
its dependencies?

**Options:**

- A) **Install at runtime inside the action**, from the committed lockfile, with the package manager's
  cache. Nothing committed that is generated; one obvious mechanism.
- B) **Commit a bundled JavaScript file** per action (the conventional approach for published JS actions).
  Fastest at run time, no install step — but it commits build output, needs a bundler in the toolchain,
  and creates the "did you rebuild the bundle?" review failure mode.
- C) **Second checkout plus one centralised install** shared by all actions. Fewer installs, but it
  reintroduces the coordination `0011` chose composite actions to avoid.

**Choice:** A, and measure. If install time turns out to dominate, revisit B **with numbers**, not on
principle.

**Reason:** A keeps the repository free of generated artifacts, which is the same reason `0008` dropped
the compiled binary, and it keeps the toolchain to what already exists — `pnpm` and a lockfile. The
dependency surface is deliberately tiny (`zod`, `yaml`), so the install is small, and the runner's package
cache makes the repeat case cheap. B's real advantage only matters if we are paying seconds per action
per run; that is a measurable claim, and measuring it is cheaper than adopting a bundler for a benefit we
have not observed.

**Rules:**

- **Each action sets up Node itself** and installs from the lockfile — a caller must not have to install
  anything for winnow's steps to work (`0011`).
- **Dependencies stay minimal.** Every package added is paid on every run of every action that needs it,
  which is one more reason the dependency list is a decision (`AGENTS.md` §3).
- **Log the install duration** from the first action, so the revisit has data instead of impressions.

**Cost, stated honestly:** seconds per action per run, multiplied by however many winnow-owned steps a
run has — and that multiplication is the thing to watch, because it grows with the number of actions
rather than the amount of work. Second cost: a runtime install is a network operation, so an action can
now fail for a reason unrelated to its job (registry unavailable); that is an infrastructure failure and
must produce zero findings (invariant 8).

**Date:** 2026-08-11

**Re-evaluate when:** measured install time is a meaningful share of run time; or the number of
winnow-owned actions grows enough that per-action installs multiply; or a dependency arrives that is
expensive to install.
