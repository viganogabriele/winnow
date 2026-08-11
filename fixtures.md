# Fixture repositories

This file records the repositories used to verify winnow.

Because the workflow runs on GitHub Actions, fixtures must be **real GitHub repositories with real pull
requests** — not local folders. They live outside this repository and are never committed here.

**To start Fase 1 you need exactly one of these, and only part of it:** fixture #1, with Node, pnpm and a
working ESLint configuration. The web app and `compose.yml` are not needed until Fase 3, so the fixture can
grow with the roadmap — but nothing in Fase 1 can be verified without it, because the workflow runs on
GitHub and needs a real pull request on a real repository.

Per `ROADMAP.md` §3, five are needed:

| # | What | Needed from |
|---|---|---|
| 1 | A repository of yours with Node + pnpm + ESLint. Add a web app and a `compose.yml` before Fase 3 | **Fase 1** |
| 2 | A deliberately broken repository you write yourself: a 500 on a route, a type error, an overlap on mobile (the 500 is caught in Fase 3; the overlap needs Fase 6) | Fase 3 |
| 3–4 | Two small open source repositories **not written by you** — they surface the cases you couldn't anticipate | Fase 3 |
| 5 | A hostile fixture that *tries* to read and exfiltrate the token, and must visibly fail | Fase 4 |

## Registered

| # | Repository | Package manager | Linter | Browser | Good for | Missing |
|---|---|---|---|---|---|---|
| 1 | [`viganogabriele/viganogabriele.com`](https://github.com/viganogabriele/viganogabriele.com) | **npm** (`package-lock.json`) | **ESLint** (`eslint .`) | **Playwright** (`playwright test`) | **Fase 1** (the only one of the two with ESLint), Fase 2 (`tsc -b`), Fase 3 (has real Playwright specs) | no `compose.yml`; default branch is `master`, not `main` |
| 3 | [`PoliNetworkOrg/web`](https://github.com/PoliNetworkOrg/web) | **pnpm** (enforced by `preinstall: only-allow pnpm`) | **Biome**, not ESLint | — | Fase 2 (`typecheck: tsc --noEmit`), Fase 3 (has a `Dockerfile`) | **no ESLint**, so it cannot verify Fase 1; no Playwright; no `compose.yml` |

Still needed: **#2** (deliberately broken, written by you), a second repository **not written by you** for the
#3–4 slot, and **#5** (hostile, Fase 4).

### What these two taught us before a line of code was written

- **Fase 1's declared limit was too narrow.** It said "Node/TypeScript with pnpm", but the only repository
  here with ESLint uses **npm**, and the only one with pnpm uses **Biome**. The phase now supports both
  package managers, chosen by reading which lockfile exists — see the note in `ROADMAP.md` Fase 1.
- **Biome is an open question for Fase 2, not Fase 1.** To lint `PoliNetworkOrg/web` at all, Biome's output
  needs a route to SARIF: either a native reporter (check the current Biome docs — do not assume) or a
  converter of ours. Until then that repository contributes `tsc`, not lint.
- **`master` vs `main`:** the base branch is an input, never a hardcoded string. Fixture #1 would have
  caught that assumption the hard way.
