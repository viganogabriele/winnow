# 0010 — Hosting: local, Tailscale, or public — three configurations, one app

**Question:** where does the dashboard run? It holds a GitHub App private key and triggers workflow runs,
so the answer is a security decision, not a deployment detail. It also has to serve two different needs:
the owner reaching it from their own devices, and several people on a team seeing the same reports.

**Options:**

- A) Local only (`localhost`). Smallest attack surface, no hosting cost — but nobody else can see it,
  which defeats the shared-review use case.
- B) Public only. Shareable and demonstrable — but an internet-facing app holding GitHub tokens,
  requiring OAuth, authorization, rate limiting and security headers all done correctly before it is
  safe. Overkill when the owner just wants it on their own laptop and phone.
- C) **All three as configurations of one app**: local, Tailscale-private, or public — with
  authentication built in Fase 9 regardless of which one is used first.

**Choice:** C, with the recommendation split by audience:

| Audience | Mode |
|---|---|
| The owner alone, across their own devices | **Tailscale** (or local) |
| **A group — an association, a team, anyone else who must see it** | **Public site**, authorized by GitHub organization membership |

**Reason.** The three modes differ in attack surface, not in code, so supporting all three costs a
Dockerfile and three short deploy documents rather than three implementations.

The split matters because **Tailscale is the wrong tool for shared access here, for a reason specific to
this situation**: the tailnet is the owner's personal one, with their personal machines on it. Adding
association members to it puts them inside that network boundary — the wrong boundary to be handing out,
even with ACLs configured correctly. On top of that, asking an association whose membership rotates to
install a client and accept a tailnet invitation is friction nobody sustains. A domain with HTTPS and a
GitHub login is the thing people already know how to use.

**Model credentials are a separate matter and they are not shared** (`0015`): subscription mode is for a
personal install, so a shared deployment uses an API key, a Team/Enterprise plan, or a cloud path. This
decision settles *who can reach the dashboard*, not *whose quota it spends*.

**Authorization for the public mode is GitHub organization membership, not a hand-maintained
whitelist.** After login, the user token is discarded (`0025`). The app checks the verified GitHub user
id with an installation token carrying `Members: read`, at login and at least every 15 minutes. This is
the correct authorization for the actual use case and it maintains itself: joining the organization
grants access, leaving revokes it within the revalidation window, with no file to edit. An explicit
username whitelist stays available as the fallback for operators without an organization.

Building authentication in Fase 9 rather than at deploy time is the load-bearing part of this decision:
retrofitting auth onto an app that assumed a single trusted local user is a rewrite, and "we'll add login
when we deploy" is how apps get deployed without login.

**Where execution happens is a separate axis.** In all three modes the *work* runs on GitHub Actions;
the dashboard only triggers and reads. Self-hosted runners are documented as an option for people who
want execution on their own hardware, with one hard constraint: **never on a public repository that
accepts pull requests from forks**, because a stranger's PR would then execute arbitrary code on the
runner. That is the same class of mistake as `pull_request_target` with secrets, and it is recorded as
invariant 12 in `ROADMAP.md` Appendice B.

**Cost, stated honestly:** the public path — the shared one — carries security
work (CSRF, session handling, org-membership checks, rate limiting, headers) that the local and Tailscale
paths never exercise, so a bug there can go unnoticed by someone who only runs locally. Mitigation: its
verification is explicit in Fase 14, including a negative test with a second GitHub account that is not
an organization member. Second cost: SQLite means the history lives in one file on one host, so backups
are the operator's problem, and every deploy document must say so. Third: periodic org-membership checks
consume API quota and require the GitHub App's `Members: read` permission (`0025`).

**Date:** 2026-08-11 (recommendation corrected the same day: the first draft recommended Tailscale for
shared PoliNetwork access, which ignored that the tailnet is personal and that rotating membership makes
tailnet invitations unworkable; and the PoliNetwork-specific framing was generalised — winnow is a
general tool, and a shared association deployment is one consumer of the public mode, not its definition)

**Re-evaluate when:** concurrent usage outgrows SQLite on a single host; or an operator's group does not
use GitHub as its identity source, making org membership the wrong authorization signal; or a real user
reports that the public deployment's setup is what blocks adoption.
