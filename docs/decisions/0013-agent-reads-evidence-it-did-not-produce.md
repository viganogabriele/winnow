# 0013 — The agent reads evidence; it never shares a job with running repository code

**Question:** the agent-driven browser stage needed the application **live** while the agent ran. But
`0008` translated spec §12.3's container boundary into GitHub **jobs**, and every job is a fresh VM — so an
app booted in `checks` does not exist in `review`. Where does the live app come from, and can the agent
reach it without sitting next to repository code?

**History, because the reasoning matters more than the conclusion.** Three answers were tried:

1. *Boot the app in `review`.* Rejected: `install`/`build` execute arbitrary repository scripts, and a
   hostile `postinstall` reads the job environment where the model credential lives.
2. *Build an image in `checks`, run it in `review`.* Adopted, then **withdrawn**. The argument was that
   `docker run` on a pre-built image "executes no repository code" — but the image's entrypoint is the
   repository's own `start` command. So `review` would hold the model credential *and* application code
   authored by the pull request, separated only by container isolation. The decision claimed both that the
   boundary was intact and that the app was running there; those cannot both be true. It also asserted
   "egress restricted to the model endpoint plus localhost", which GitHub-hosted runners do not provide —
   they have public internet access by default.
3. *Agent proposes steps, a credential-free job executes them.* This is literally spec §12.3 rule 1
   (commands go back to the orchestrator and run where there is no credential), and it preserves
   everything — but each round trip is a new job, and job startup on Actions is tens of seconds. With a
   browser-action budget in the hundreds it is not practical.

**Choice:** the agent analyses **evidence produced earlier by a credential-free job**. It does not drive a
live browser. Interactive agent exploration is deferred, not hidden.

```
checks    (no model credential, contents: read)
  app boots · Playwright drives it · axe runs
  → traces, HAR, screenshots, bounding boxes, console errors, failed requests, 5xx

review    (model credential, permissions: {})
  the agent READS that evidence
  → no repository code runs in this job, at all

publish   (GitHub write, no model credential)
  comment + SARIF, from validated output only
```

**Reason:** it is the only one of the four that makes the invariant *true* rather than argued. `review`
runs no repository code — not a build, not a start command, not an entrypoint — so the credential is not
protected by container hardening, egress rules, or kernel isolation; it is protected by the absence of
anything hostile in that job. That is a property that can be verified by reading the workflow, which is
worth more than a property that depends on configuration nobody re-checks.

**What is actually lost is smaller than it looks.** The differentiator — *winnow boots the app and drives
it with a real browser* — belongs to Fase 3 and needs no credential at all: Playwright still clicks
through the application, still catches the 500 on form submit, still records traces. What is deferred is
only the agent *choosing the next click interactively*. The agent still reviews with runtime evidence in
hand, which is the thing that separates it from a source-only reviewer.

**What this obliges:**

- **Evidence must be model-readable.** A trace zip is not: the useful parts have to be extracted into a
  bundle a model can actually consume. The textual bundle is built in Fase 5; Fase 6 adds images and
  visual confirmation (`0019`, `0021`).
- **Visual defects stay detectable without a live app beside the agent.** `checks` captures element ids
  and bounding boxes alongside each screenshot. The agent names only ids from that captured manifest;
  the credential-free `confirm` job then reboots the app and measures the selected ids (`0021`).
- **`.winnow/app.yml` needs no image-handoff fields.** `checks` may still use its declared Docker Compose
  support services (`0022`), but no image crosses into `review`.
- **Playwright MCP leaves the stack.** It is only useful for live agent navigation.
- **No claim anywhere may say the agent uses the application.** README, AGENTS.md and the roadmap say the
  agent reads what the browser found.

**Cost, stated honestly:** bugs that need multi-step interaction the scripted smoke did not perform will
be missed — an agent exploring freely would find some of them. That is the price of a boundary that holds
without hardening, and it is paid in capability rather than in risk. Second cost: the evidence bundle is a
new surface to design and maintain, and a bad bundle silently degrades review quality (the agent cannot
ask for more). Third: if interactive exploration is ever genuinely needed, option 2 with a written threat
model, container hardening, verified egress and negative tests is the honest path to it — but it is a
deliberate change to the security posture, not an optimisation.

**Date:** 2026-08-11 (this file replaces a same-day draft that chose option 2; that draft was withdrawn
because it asserted two incompatible things)

**Re-evaluate when:** the missed-bug class becomes concrete — a real defect found by hand that
scripted-browser plus evidence review demonstrably could not catch; or Actions gains a way for one job to
reach a service in another; or job startup becomes cheap enough for option 3.
