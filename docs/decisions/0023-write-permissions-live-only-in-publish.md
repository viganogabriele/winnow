# 0023 — Repository code never runs with GitHub write, starting in Fase 1

**Question:** Fase 1 originally used `reviewdog/action-eslint` in the same job that installed and ran the
repository's dependencies. That job needed `pull-requests: write` and `security-events: write` to comment
and upload SARIF, so repository code and a write-capable GitHub token coexisted until Fase 4 introduced the
trust-zone split. The security invariants say that boundary is never temporarily violated.

**Options:** A) accept the combined job during the early phases and split it later; B) establish
`checks → publish` in Fase 1 and keep it for every later analyser.

**Choice:** B. From Fase 1, `resolve` turns the event or explicit PR number into trusted head/base metadata
and detects forks; `checks` has `contents: read`, installs dependencies, runs ESLint and uploads its SARIF
as a workflow artifact. `publish` has the two write permissions, never installs or executes repository code,
downloads that SARIF, sends it to reviewdog with `-f=sarif`, and uploads the same file to code scanning.
`publish` runs only when head and base repositories match, regardless of trigger.
It passes the PR number, head SHA and repository resolved by `resolve` explicitly: reviewdog receives the
portable `CI_PULL_REQUEST`, `CI_COMMIT`, `CI_REPO_OWNER` and `CI_REPO_NAME` variables, while
`upload-sarif` receives `ref: refs/pull/<number>/head` and `sha: <head SHA>`. This matters on
`workflow_dispatch`, whose ambient ref and SHA describe the default branch rather than the reviewed PR.
The generic `reviewdog/action-setup` replaces `reviewdog/action-eslint`, because the latter deliberately
combines execution and publication. Every action remains pinned by commit SHA.

**Amendment (2026-08-12): `publish` does not check out the repository; it runs `git init` in the empty
workspace.** An earlier draft of Fase 1 checked out the head "to give reviewdog the diff context". That
reason is wrong — the `github-pr-review` reporter takes the diff from the GitHub API
(`githubservice.PullRequestDiffService`) — but a first version of this amendment then concluded that no git
directory was needed at all, which is also wrong: `service/github/github.go` calls
`serviceutil.GetGitRoot()` while posting, and that walks up for a `.git` directory and **errors** if there
is none. It uses the root only to build permalink paths in comment bodies, so a bare `git init` satisfies
it, and the write-capable job then extracts no repository file into its workspace and runs none. Stated
precisely, because "holds no repository file at all" would be false: when the diff API answers `406` — large
diffs — reviewdog v0.21.0 always falls back to the git CLI (`FallBackToGitCLI: true` is hardcoded in its
`main.go`), running `git fetch --depth=1 <base repo URL> <sha>` and `git diff`, so commit objects land in
`.git` and are read. That is data read by git: no checked-out tree, no script, no hook, no repository binary
executed. The invariant holds; the sweeping sentence did not.
`upload-sarif` needs no git: given the `ref` and `sha` inputs it uses them and tolerates the failed
`git rev-parse`. Two constraints come with this: reviewdog runs from the workspace root ESLint ran in,
because the SARIF carries absolute paths (`0026`); and the reviewdog **binary** is pinned to a version
(`reviewdog_version: v0.21.0`), since `action-setup` installs `latest` by default — pinning the action by
SHA does not pin the program that runs beside the write token, and this amendment depends on that
program's behaviour.

**Reason:** the artifact is a data diode: untrusted execution can produce data for the writer, but it never
receives the writer's token. Reusing the same canonical SARIF for reviewdog and code scanning also avoids a
second formatter and two results that can disagree.

**Cost:** one extra job and artifact round trip from the first phase; `publish` still parses untrusted SARIF,
so malformed input is a publication-stage failure with zero findings, never something we execute.

**Date:** 2026-08-11

**Re-evaluate when:** never by collapsing the boundary; only replace the transport if GitHub provides a
safer native mechanism with the same separation.
