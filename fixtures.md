# Fixture repositories

This file records the repositories used to verify winnow.

Because the workflow runs on GitHub Actions, fixtures must be **real GitHub repositories with real pull
requests** — not local folders. They live outside this repository and are never committed here.

**To start Fase 1 you need exactly one of these, and only part of it:** fixture #1, with Node, a working
ESLint configuration, and either package manager — the registered one uses **npm**. The web app and `compose.yml` are not needed until Fase 3, so the fixture can
grow with the roadmap — but nothing in Fase 1 can be verified without it, because the workflow runs on
GitHub and needs a real pull request on a real repository.

Per `ROADMAP.md` §3, five are needed:

| # | What | Needed from |
|---|---|---|
| 1 | A repository of yours with Node + ESLint, npm or pnpm. Add a web app and a `compose.yml` before Fase 3 | **Fase 1** |
| 2 | A deliberately broken repository you write yourself: a 500 on a route, a type error, an overlap on mobile (the 500 is caught in Fase 3; the overlap needs Fase 6) | Fase 3 |
| 3–4 | Two small open source repositories **not written by you** — they surface the cases you couldn't anticipate | Fase 3 |
| 5 | A hostile fixture that *tries* to read and exfiltrate the token, and must visibly fail | Fase 4 |

## Registered

| # | Repository | Package manager | Linter | Browser | Good for | Watch out for |
|---|---|---|---|---|---|---|
| 1 | [`viganogabriele/viganogabriele.com`](https://github.com/viganogabriele/viganogabriele.com) | **npm** (`package-lock.json`) | ESLint (`eslint .`) | Playwright | Fase 1, Fase 2 (`tsc -b`), Fase 3 (real specs) | npm, not pnpm; default branch is **`master`** |
| 2 | [`viganogabriele/winnow-fixture-broken`](https://github.com/viganogabriele/winnow-fixture-broken) — **written for this purpose**, [PR #1](https://github.com/viganogabriele/winnow-fixture-broken/pull/1) | pnpm | ESLint | Playwright, 2 viewports | **Everything**: `main` green, PR #1 plants one defect of each class. Has `.winnow/app.yml` ready | zero runtime dependencies, so it is *easier* than reality — do not tune only against it |
| 3 | [`unjs/ofetch`](https://github.com/unjs/ofetch) | pnpm@10.20.0 | ESLint | — | Fase 1 and 2 on somebody else's code. Small (1.6 MB), MIT, actively maintained | `lint` is `eslint . && prettier -c …` — **not just ESLint** |
| 4 | [`pmndrs/zustand`](https://github.com/pmndrs/zustand) | pnpm@11 | ESLint | — | Fase 1 and 2 at a larger size (8 MB), MIT, active | there is **no `lint` script** — it is `test:lint` |
| 5 | [`PoliNetworkOrg/web`](https://github.com/PoliNetworkOrg/web) | pnpm (enforced by `preinstall: only-allow pnpm`) | **Biome**, not ESLint | — | Fase 2 (`typecheck: tsc --noEmit`), Fase 3 (has a `Dockerfile`) | **no ESLint at all**, so it cannot verify Fase 1 |

Still needed: the **hostile fixture** for Fase 4 — a repository that *tries* to read and exfiltrate the
credential and must visibly fail. Write it when you build the perimeter, not before: it is only meaningful
once you know exactly what it is attacking.

**#3 and #4 have to be forked.** You cannot add a caller workflow to a repository you do not own, so those two
live as forks under your account. Note the consequence for invariant 9: a pull request inside *your* fork is
same-repository and therefore gets secrets, which is what you want for ordinary testing — but it means testing
the **fork gate** needs a pull request from a genuinely different account's fork.

### What these two taught us before a line of code was written

- **Fase 1's declared limit was too narrow.** It said "Node/TypeScript with pnpm", but the only repository
  here with ESLint uses **npm**, and the one with pnpm uses **Biome**. The phase now supports both package
  managers, chosen by reading which lockfile exists — see the note in `ROADMAP.md` Fase 1.
- **winnow must not run the repository's own lint script.** Across five repositories the same job has four
  different shapes: `eslint .` (#1), `eslint . && prettier -c …` (#3), `test:lint` rather than `lint` (#4),
  and `biome check` (#5). Running `pnpm lint` would variously pick up prettier output, fail to find the
  script, or lint with the wrong tool. winnow invokes ESLint itself with the SARIF formatter.
- **No fixture has the SARIF formatter among its dependencies, and winnow must not require it.** An owner is
  free to add `@microsoft/eslint-formatter-sarif` to their own `package.json`, but a repository that has not
  must still work: so winnow installs it in a directory of its own on the runner and passes ESLint the path
  to it — verified working with ESLint 9.39 (`0026`).
- **Biome is an open question for Fase 2, not Fase 1.** To lint `PoliNetworkOrg/web` at all, Biome's output
  needs a route to SARIF: either a native reporter (check the current Biome docs — do not assume) or a
  converter of ours. Until then that repository contributes `tsc`, not lint.
- **`master` vs `main`:** the base branch is an input, never a hardcoded string. Fixture #1 would have
  caught that assumption the hard way.
