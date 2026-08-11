# 0024 — Codex subscription auth requires a trusted persistent runner

**Question:** Codex subscription authentication lives in `auth.json`. The CLI may rotate and rewrite that
file while refreshing the session. A GitHub-hosted runner is destroyed after the job, and restoring the
original secret on the next run loses the rotated state. Persisting it ourselves would create a credential
store inside the workflow — exactly the kind of sensitive infrastructure winnow is trying not to build.

**Options:** A) API-key authentication on ephemeral GitHub-hosted runners, and ChatGPT-subscription
authentication only on a trusted persistent self-hosted runner; B) design encrypted cross-run persistence
for `auth.json` in Actions caches, artifacts or repository secrets.

**Choice:** A for v1.

**Reason:** OpenAI recommends API keys as the default for programmatic CI and describes persisted account
auth as an advanced trusted-runner pattern. B adds rotation, recovery and leakage failure modes to a QA
tool, while also fighting the `review` job's deliberate lack of GitHub permissions. A keeps both supported
paths honest: API billing on an ephemeral runner, or included subscription usage where the credential store
actually persists.

**Consequences:** winnow never seeds `auth.json` from a GitHub secret or discards a rotated update. The Codex
adapter uses `OPENAI_API_KEY` on GitHub-hosted runners. Subscription mode requires a personal persistent
runner and inherits invariant 12: never use that runner for a public repository accepting fork pull
requests. No custom auth-state cache is built.

**Cost:** unlike Claude, Codex cannot use an individual subscription on the default GitHub-hosted path in
v1. The README and provider diagnostics say this before a user configures it.

**Date:** 2026-08-11

**Re-evaluate when:** OpenAI provides a non-rotating, CI-scoped subscription credential, or GitHub provides
a suitable encrypted mutable secret store that does not weaken the trust-zone split.
