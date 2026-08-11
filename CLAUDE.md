# CLAUDE.md

**Read `AGENTS.md` in the repository root before doing anything else here.** It is the working
agreement for AI agents contributing to this project: how much to explain, when to stop and ask, the
stack conventions, and the security invariants that must never be broken.

There are no separate instructions in this file. `AGENTS.md` is the single source of behavioural
guidance, so that every agent — Claude Code, Codex, or anything else — follows the same rules.

## The documents, in order of authority

1. **`docs/spec-v2.md`** — the specification. The source of truth for architecture, security model,
   findings model and milestones. If anything disagrees with it, that thing is wrong.
2. **`ROADMAP.md`** — the specification broken into small, verifiable build phases (in Italian). Work
   on the phase the owner names. Every phase has a *"Non fare adesso"* list; treat it as a hard
   boundary.
3. **`AGENTS.md`** — how to work: explain before and after important changes, prefer simple and
   readable code, avoid premature complexity, and flag any architectural decision that isn't already
   written down in the two documents above.
4. **`docs/decisions/`** — decisions already taken, with their reasons and their re-evaluation
   triggers. Read before proposing a change to any of them.

## Four things to know immediately

- **The owner is learning to program.** You do most of the implementation; they make the decisions;
  their understanding is part of the deliverable. They do not merge code they cannot explain out
  loud.
- **The stack is TypeScript on Node 22**, which is a *deliberate, recorded deviation* from spec §5.4
  (which chooses Go). See `ROADMAP.md` D2. Do not "correct" it — if you think its re-evaluation
  trigger has fired, flag it rather than acting.
- **This is a security tool, and the repository under test is always assumed hostile.** The
  invariants in `AGENTS.md` §9 are not tradeoffs.
- **This file is not the settings file winnow gives to the agents it runs during a verification.**
  winnow deliberately strips `CLAUDE.md` and `AGENTS.md` from what an analysed repository's agent can
  see (spec §12.3, rule 2), precisely because a hostile repository would love to control them. Don't
  confuse the two roles.
