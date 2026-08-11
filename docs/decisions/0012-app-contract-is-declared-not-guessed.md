# 0012 — How to boot the app: declared in `.winnow/app.yml`, never guessed

> **The principle is here; the complete schema is `0022`.** This file decided *that* booting is declared
> rather than detected. The sketch below turned out not to be implementable (no image/build path, no env,
> no service health, no route templates, and `compose_services` used in the roadmap without ever being
> defined). `0022` settles the full v1 shape — including the forced choice that support services come from
> `docker compose`, because Actions' `services:` is static job configuration and cannot be generated from a
> file read at run time.

**Question:** Fase 3 promises to start the application and drive a browser through it. To do that winnow
needs the install command, the start command, the port, a health endpoint, the migration and seed steps,
and something to crawl from. The roadmap said "generated smoke suite" without saying how any of that is
discovered. Spec §7.3 calls this the hardest step in the whole system and the place most runs die — so
hand-waving it is the one omission that would silently sink Part A.

**Options:**

- A) **Auto-detect.** Read `package.json` scripts, guess the port, probe common health paths. Zero
  configuration when it works — and the v2 spec already rejected the hand-rolled detection matrix as an
  infinite treadmill (§1.2). Worse here: a wrong guess produces a *mysterious* failure, which is exactly
  what §7.3 says to avoid.
- B) **Delegate to Railpack / devcontainer / compose detection**, as spec §7.1 does. Right long-term
  answer, but it is a whole dependency and a precedence chain for a phase whose real job is "get one
  browser session running".
- C) **A small committed declaration**, `.winnow/app.yml`, with an honest failure when it is missing:
  winnow says exactly what to add and degrades to the analyser-only stages.

**Choice:** C, with one narrow concession to A: if the repository has a `compose.yml`, use it for the
services rather than re-deriving their topology (spec §7.3's first rule).

**Reason:** the declaration is a dozen lines the repository owner writes once, and it converts the
failure mode from "winnow guessed wrong and something timed out" into "winnow told me which field to
add". That is the trade the spec explicitly asks for: *the honest failure message is far better than a
heuristic guess.* It also keeps the phase small — no detection library, no precedence chain — and the
config lives in the repository, so it is reviewable, travels with forks, and is not invisible state on a
server.

**The shape** (every field optional except `start` and `health`; the schema is the documentation):

```yaml
# .winnow/app.yml
version: 1
install: pnpm install --frozen-lockfile
build: pnpm build
start: pnpm start
port: 3000
health: /api/health          # winnow polls this until it answers 2xx
boot_timeout: 90s
setup:                       # after services are healthy, before start
  - pnpm db:migrate
  - pnpm db:seed:test        # MUST be idempotent and non-destructive
services:                    # ignored when compose.yml is present
  postgres: { image: postgres:16 }
crawl:
  from: ["/"]                # seeds for the generated smoke suite
  depth: 2
  max_routes: 20
```

**Read from the base commit, like `.winnow/agents.yml`** (`0009`, and the same reasoning): `start` and
`setup` are **commands winnow executes**, so letting a pull request change them would let a PR author
choose what runs. Config changes take effect after merge.

**When it is absent:** no guessing. The browser stages are skipped, the run says so in its summary, and
the analyser stages still produce their findings — the graceful downgrade Fase 3 already required.

**Cost, stated honestly:** this is a new committed file format, so it is a compatibility surface from the
day someone else adopts it — adding a required field later is a breaking change for them. Mitigation:
`version: 1` is there from the start and every field except `start`/`health` is optional. Second cost:
adoption friction — a repository that hasn't written the file gets analyser findings only, which will
look like winnow doing less than advertised until the file exists. The README must be explicit that
browser QA needs twelve lines of configuration. Third: it deviates from spec §7.1's precedence chain, so
if Railpack ever becomes worth its weight, this file becomes the highest-priority source in that chain
rather than the only one.

**Date:** 2026-08-11

**Re-evaluate when:** more than a couple of fixture repositories need fields this shape can't express; or
supporting an ecosystem beyond Node makes per-language detection worth delegating to Railpack; or real
users repeatedly fail to write the file, which would mean the friction outweighs the honest failure.
