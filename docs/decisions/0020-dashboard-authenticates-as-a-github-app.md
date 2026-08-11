# 0020 — The dashboard authenticates to GitHub as a GitHub App, not an OAuth App

**Question:** Fase 9 had the dashboard log users in with a GitHub **OAuth App** and hold a persistent
user token. That was never a recorded decision — it was an implementation detail that slipped in. It
governs the GitHub token that `SECURITY.md` classifies as a **P0** leakage class, so it cannot stay
implicit.

**Options:**

- A) **GitHub App**: user login for identity, plus **installation tokens** for acting on repositories.
  The operator picks *which repositories* the app may see at installation time, installation tokens expire
  in about an hour, and permissions are declared per resource.
- B) **OAuth App**: one persistent user token with the scopes requested. Fewer concepts and faster to
  build — but the token is valid on **every repository the user can reach**, does not expire, and must be
  encrypted, custodied and rotated by us.

**Choice:** A.

**Reason:** the blast radius of a compromised database is the whole argument. With B, an attacker gets
broad, durable access to everything the user can reach; with A, they get expired installation tokens
scoped to repositories the operator explicitly selected. GitHub's own guidance points at Apps for
integrations of this shape, and it matches this project's own posture everywhere else — minimal
permissions declared explicitly, credentials that expire, blast radius bounded by design rather than by
care.

It also fits what winnow actually needs: the dashboard acts on *the repositories being reviewed*, which is
a set the operator chooses once, not "anything this person can see".

**How the two credentials divide, because conflating them is the usual mistake:**

| Credential | Answers | Lifetime | Used for |
|---|---|---|---|
| User login token (OAuth flow on the App) | *who are you* | callback only, then discarded | establish verified GitHub id and login (`0025`) |
| Installation token | *what may the app do* | ~1 hour, minted on demand | listing PRs, dispatching workflows, reading check runs, opening the fix PR |

The user's identity never becomes the thing that acts on repositories. That separation is the point.

**Consequences to apply while building:**

- **Fase 9 registers a GitHub App**, not an OAuth App, and implements both halves: the user login flow and
  installation-token minting.
- **Installation tokens are minted per operation and never persisted.** What is stored is the app's
  installation ids and a reference to the mounted private-key file — not tokens or private-key material.
- **The user token is discarded after the login callback** (`0025`). The session stores the verified
  GitHub id and login, expires after one hour, and organization membership is revalidated at least every
  15 minutes with an installation token carrying `Members: read`; failures deny access.
- **Permissions are declared on the App** and reviewed when a phase needs a new one. Fix mode (Fase 13)
  is where `contents: write` and `pull-requests: write` become necessary; before that the App stays
  read-only plus `actions: write` for dispatch and `members: read` for authorization. Editing the caller
  workflow in Fase 15 also requires the App's `workflows: write` permission.
- **`SECURITY.md` gains this token class** with its own reasoning, distinct from the model credential.
- **The "which repositories" question is answered by the installation**, not by a list in our database —
  so a repository the operator did not select is not reachable even by a bug in our code.

**Cost, stated honestly:** more to build and more to understand — an App registration, a private key to
custody, two short-lived token types to keep straight, and a JWT-then-installation-token dance that is easy to get
subtly wrong. It is genuinely the harder path in Fase 9, and it is the reason a beginner reaches for
OAuth. Second cost: the private key is now the most valuable secret the dashboard holds, so its storage
is a mounted secret file decided at deploy time (Fase 14), not a database row or `.env` value. Third: local development needs its own
App instance, so the setup document is longer.

**Date:** 2026-08-11

**Re-evaluate when:** never for security reasons; only if GitHub changes App capabilities such that some
required operation is impossible for an App but possible for an OAuth App — in which case that specific
operation, not the whole model, gets the exception.
