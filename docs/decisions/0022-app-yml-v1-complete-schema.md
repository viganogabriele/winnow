# 0022 — `.winnow/app.yml` v1: the complete executable schema

> **Amended 2026-08-11 before implementation.** The first version still left three things implicit:
> command strings contradicted the repository's shell-free `spawn` rule, arbitrary secret names could not
> cross a reusable-workflow boundary, and route-template matching had no grammar. The schema below is the
> amended v1. No external repository adopted the earlier draft.

**Question:** `0012` decided the *principle* — how to boot the app is **declared, never guessed** — but the
schema it sketched is not implementable. The roadmap uses `compose_services:`, a field that appears in no
example. Missing entirely: environment variables and test secrets, the command for a repository's existing
Playwright tests, health checks for support services, what happens when `compose.yml` also contains the app,
and how a concrete URL becomes the route template that `0018`'s comparison keys need.

It is committed configuration and therefore a compatibility surface: adding a required field after an
external repository has adopted it is a breaking change for that repository. So the schema is settled now.

**A forced technical choice, discovered while writing this.** GitHub Actions' `services:` block is **static
job configuration** — it is parsed with the workflow, before any step runs. It therefore **cannot** be
generated from an `app.yml` we read at run time. Support services must be started with **`docker compose`**
(or controlled `docker` commands) inside a step. This is not a preference; the alternative does not exist.

**Options considered for scope:**

- A) **Complete the v1 schema now**, before any external repository adopts it.
- B) **Reduce Fase 3 to a single rigidly-conventioned fixture** (fixed port, fixed scripts, no compose) and
  design the general schema later, from experience.

**Choice:** A. B removes exactly what Fase 3 exists to prove — that winnow can boot *real* repositories —
and the schema would then be designed against one artificial case.

**The schema:**

```yaml
# .winnow/app.yml
version: 1

# ── how it is built ────────────────────────────────────────────────
install: [pnpm, install, --frozen-lockfile]
build:   [pnpm, build]                   # optional

# ── how it is started ──────────────────────────────────────────────
start:   [pnpm, start]
port:    3000
health:  /api/health                    # polled until 2xx
boot_timeout: 90s

# ── environment ────────────────────────────────────────────────────
env:
  literal:
    NODE_ENV: test
  from_secrets: [DATABASE_URL, NEXTAUTH_SECRET]   # names inside WINNOW_APP_SECRETS_JSON

# ── support services: compose, never Actions `services:` ───────────
compose:
  file: compose.yml
  services: [postgres, redis]           # explicit list of SUPPORT services
  health_timeout: 60s
# …or, when the repository has no compose file:
services:
  postgres:
    image: postgres:16
    env: { POSTGRES_PASSWORD: winnow }
    ports: ["5432:5432"]
    health: [pg_isready, -U, postgres]  # executed inside the container

# ── preparation, after services are healthy, before start ──────────
setup:
  - [pnpm, db:migrate]
  - [pnpm, db:seed:test]                # MUST be idempotent and non-destructive

# ── the browser stage ──────────────────────────────────────────────
browser:
  test_command: [pnpm, test:e2e]        # the repository's own Playwright tests
  crawl:                                # used only when test_command is absent
    from: ["/"]
    depth: 2
    max_routes: 20
  routes:                               # route templates for 0018's keys
    - /api/users/:id
    - /posts/:slug
```

**Command grammar — deliberately boring.** Every command is a non-empty YAML array. Item zero is the
executable; the rest are arguments passed unchanged to `child_process.spawn` with `shell: false`. No string
splitting, pipes, redirects, variable expansion or command substitution exists. If a repository needs a
shell pipeline, it puts that logic in a reviewed script of its own and declares, for example,
`start: [pnpm, run, start:test]`. NUL bytes and empty executable names are schema errors.

**How secrets cross `workflow_call`.** The called workflow declares one optional secret with the stable
name `winnow_app_secrets`; the caller maps it explicitly from one repository secret:

```yaml
secrets:
  winnow_app_secrets: ${{ secrets.WINNOW_APP_SECRETS_JSON }}
```

`WINNOW_APP_SECRETS_JSON` is a JSON object whose values are strings. `env.from_secrets` contains keys in
that object. Winnow validates the object, masks each extracted value with the Actions logging command
before repository code can print it, removes the carrier JSON variable from every child environment, and
injects only the requested keys into the relevant repository processes. It never puts the whole JSON value
in a command line and fails before boot with the missing key's name when a same-repo run lacks it. Extra
keys are ignored and never reach a child process. `secrets: inherit` is forbidden. These must be dedicated test
credentials with no production access, because same-repository PR code runs in this job. On a fork GitHub
provides no secrets: if the app requests any, the browser stage is skipped with the expected fork reason
while credential-free analysers continue.

**Route-template grammar.** Matching uses only the URL pathname: query and fragment are ignored, and one
trailing slash is removed except for `/`. A template is an absolute path made of literal segments and
`:name` segments, where the name matches `[A-Za-z][A-Za-z0-9_]*`; a parameter consumes exactly one non-empty
segment. There are no optional or catch-all segments in v1. A concrete path must have the same number of
segments. If several templates match, the one with more literal segments wins, then the first declared one.
An unmatched URL keeps its normalized concrete pathname as the comparison key and the report says so.

**Defaults and constraints.** Only `start` and `health` are required. `install` defaults to
`[pnpm, install, --frozen-lockfile]`, `port` to `3000`, `boot_timeout` to `90s`, `compose.health_timeout` to
`60s`, and the generated crawl to `{ from: ["/"], depth: 2, max_routes: 20 }`. Timeout strings accept only
positive integer seconds or minutes and are capped at ten minutes. `compose` and `services` are mutually
exclusive. Compose paths are relative to the repository and may not contain `..`. An inline service's
health command runs with `docker exec` inside that container; its `ports` use Docker's `host:container`
syntax. Teardown and service-log capture run even after a failed setup or health check.

**The other decisions inside that shape, each of which was a gap:**

- **`compose.services` lists only *support* services, and the app is never in it.** If `compose.yml` also
  defines the app, winnow still does not start it from compose — it starts it with `start:`. An operator who
  genuinely wants compose to run the app writes `start: [docker, compose, up, app]` and leaves it out of the
  list. Explicit either way; nothing is inferred from a service's name.
- **Route templates are declared, not derived.** Turning `/users/42` into `/users/:id` is guesswork — `42`
  might be an id or a literal page. The closed grammar above makes the declared transformation executable
  without trying to infer application semantics.
- **Secrets are referenced by name only.** Values live in the one fixed caller secret, never in the file.
  A missing key is an honest environment failure naming the field, not a mysterious boot timeout.
- **`test_command` beats the generated smoke** whenever present — the repository's own tests are the most
  trustworthy signal there is. The generated crawl is the fallback, and `crawl` is ignored when
  `test_command` is set.
- **Service health is a command**, because "wait until the port is open" is not health for a database that
  accepts connections before it can serve queries.
- **Only `start` and `health` are required.** Everything else has the explicit default above or is optional,
  so the minimal file stays about four lines.
- **`version: 1` is in the file from the first commit**, so a v2 can exist without breaking readers.

**Read from the base commit** (`0009`, `0012`): this file contains **commands winnow executes**, so a pull
request must not be able to change them for its own review.

**Cost, stated honestly:** this is a bigger surface than `0012` implied, and every field is a thing an
adopter can get wrong and a thing we must validate with a message that teaches. Second cost: `docker
compose` inside a step means we own service lifecycle — startup ordering, health polling, teardown, and log
capture — where Actions' `services:` would have given some of it for free. Third: the declared `routes` list
is maintenance an adopter must keep in step with their application, and a stale list quietly degrades
`0018`'s diff rather than failing loudly; the report must therefore say which findings used a concrete path
instead of a template. Fourth: the single JSON secret is less convenient than arbitrary GitHub secret
lookups, but unlike those lookups it can actually cross a reusable-workflow boundary without inheriting the
repository's entire secret set.

**Date:** 2026-08-11

**Re-evaluate when:** adopters consistently get a specific field wrong (that is a schema problem, not a
user problem); or a second ecosystem beyond Node needs fields this shape cannot express; or Actions gains a
way to declare services dynamically.
