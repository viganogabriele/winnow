# Security Policy

## Reporting a vulnerability

Please report vulnerabilities privately through this repository's GitHub Private Vulnerability
Reporting feature. Do not open a public issue or disclose exploit details before a fix is available.

## Severity policy

**Credential leakage is the P0 vulnerability class.** winnow runs on a Claude subscription token, which
has no spend cap, grants account-wide access, and disrupts its owner's daily work when revoked. Any
path by which repository-controlled content reaches that token — a workflow trigger that exposes
secrets to forked pull requests, a job that holds the credential while executing repository code, a log
or artifact that echoes it — is treated as P0.

The same applies to the GitHub App private key and to any short-lived user or installation token. Per
decisions `0020` and `0025`, the user token is discarded after login, installation tokens are minted on
demand and never persisted, and the private key is supplied as a mounted file rather than stored in
SQLite or copied into an environment-variable value.

Other reports are welcome and will be assessed by impact.

## Scope

winnow is designed for repositories its operator controls, and for pull requests from people they
trust. It is **not** designed to analyse arbitrary repositories from strangers: the sandbox isolation
that would justify that is explicitly out of scope
(`docs/decisions/0008-github-actions-as-the-engine.md`). Reports that assume a fully hostile
repository are in scope only where they affect the guarantees winnow actually claims — listed as
invariants in `AGENTS.md` §9 and `ROADMAP.md` Appendice B.

## Current status

winnow is in early development and must not be run on untrusted repositories.
