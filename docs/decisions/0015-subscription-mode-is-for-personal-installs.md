# 0015 — Subscription mode is for personal installs; shared deployments use their own credentials

> **Operational amendment, 2026-08-11:** the product-level choice below still stands, but “no API key”
> depends on the adapter and runner. Claude's setup token works on a hosted runner; Codex subscription
> auth needs a trusted persistent runner, so the hosted Codex path uses an API key (`0024`).

**Question:** winnow's headline promise is "runs on the subscription you already pay for, no API key".
Vendor terms reserve subscription OAuth credentials for the subscriber's own ordinary use and point to
API or cloud credentials for products and services. Does a *shared* winnow deployment — one dashboard,
several people triggering reviews — get to use one person's personal subscription?

**Options:**

- A) **Subscription mode is a personal-install feature.** Shared deployments use an API key, a
  Team/Enterprise plan, or a cloud provider path. The "zero API key" promise is scoped honestly to
  personal use.
- B) **Keep the promise as written** and route everyone's reviews through the owner's personal
  subscription, accepting the policy risk.

**Choice:** A.

**Reason:** the risk in B lands on the owner's own account — the credential has no spend cap, is
account-wide, and revoking it disrupts their daily work — and spec §12.5 already warns that an individual
plan is not a lane for a team. Scoping the promise costs a sentence in the README; getting it wrong costs
an account. A is also the only version of the promise that stays true as winnow gains users: each
adopter's personal install uses their own subscription, which is exactly what subscription credentials are
for.

**What this changes:**

- **The README says "your subscription" for personal use**, and names API key / Team / cloud credentials
  as the path for a shared deployment. No wording implies one person's plan serves a group.
- **The provider contract (`0009`) already covers this** — `auth: subscription | api_key` is a config
  field, so a shared deployment is a configuration change, not a different codebase. Nothing to build.
- **Parts A–C are unaffected**: there the tool is only ever used by its owner, so subscription mode is the
  correct and intended path. The question first has teeth in Part D, when a dashboard serves more than one
  person.
- **The dashboard must surface whose credential is being spent** once more than one person can trigger
  runs — otherwise the boundary is invisible at the moment it matters.

**Cost, stated honestly:** the most attractive line in the pitch gets a qualifier, and the shared
deployment — the version most likely to be demonstrated — is the one that needs paid credentials. That is
the honest trade. Deferred: a shared install that is both free and within terms may be possible via a
Team/Enterprise arrangement; that is a separate question for when a real shared deployment exists, and it
is explicitly not solved here.

**Date:** 2026-08-11

**Re-evaluate when:** a real shared deployment is actually needed (the owner has flagged this as a
"later" problem); or vendor terms change what a subscription credential may automate; or a
Team/Enterprise path makes shared subscription use straightforwardly permitted.
