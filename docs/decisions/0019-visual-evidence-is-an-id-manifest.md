# 0019 — Visual evidence is an ID manifest plus an annotated screenshot

**Question:** the visual-defect check works in two steps (spec §13): a model looks at a screenshot and
*suspects* a problem, then code measures the elements involved to confirm or discard it. But "the model
names two elements" and "code measures two records" need a deterministic link between them. There is no
such link between the phrase *"the submit button overlaps the header"* and two entries in a captured JSON
file. Without one, the second step cannot run — and a suspicion without confirmation is the false-positive
firehose winnow exists to avoid.

This must be decided **before Fase 3**, because Fase 3 is what captures the data, and it touches the agent
contract, which `0009` forbids changing once the second adapter arrives.

**Options:**

- A) **Numeric ID manifest plus an annotated screenshot.** Fase 3 captures a manifest — numeric id,
  accessible role, accessible name, bounding rectangle, viewport, screenshot reference — and renders a copy
  of the screenshot with those ids drawn on it. The model may return **only ids that exist in the
  manifest**, validated with Zod.
- B) **The model describes or emits CSS selectors** and code resolves them against the captured DOM. No
  annotation needed, but the link is fragile ("the button" — which one?) and accepting selectors from a
  model means accepting arbitrary input into a query.
- C) **No visual detection in v1.** Screenshots stay evidence a human looks at. Drops the "finds the
  mobile overlap" promise from the README and fixtures, and deletes a whole subsystem.

**Choice:** A.

**Reason:** it makes the model's output a **closed set**. The model does not name things, it picks from a
list we produced — so its answer is either a valid id or a validation failure, never a selector to
evaluate, never a string to interpret. That is the same principle as everywhere else in this project
(model output is data, invariant 7), applied to the one place where the model has to point at something.
It is also the cheapest thing to verify: an id either exists in the manifest or it does not.

**The shape, decided now so Fase 3 can capture it:**

```
manifest.v1.json
[ { "id": 7, "role": "button", "name": "Invia",
    "rect": { "x": 12, "y": 640, "w": 96, "h": 40 },
    "viewport": "390x844", "screenshot": "mobile-home.png" }, … ]
```

- **What gets captured, and not more.** Only elements that can plausibly participate in a visual defect:
  those with an accessible role or name, above a minimum size, and visible in the viewport. Capturing every
  DOM node would produce thousands of useless records and a manifest too large to attach.
- **Ids are per-screenshot and per-run.** They are a pointing mechanism, not an identity across runs —
  which keeps them out of `0018`'s comparison keys (those use `page + viewport + defect class`).
- **The model's reply is a Zod-validated object** naming ids and a reason. An id not in the manifest is a
  **stage failure**, not a finding.
- **The confirmation is targeted.** `visual.ts` measures the two named rectangles, not every pair — the
  reason a general bounding-box comparison was rejected is that parents and children overlap by
  construction.

**Consequences for the agent contract (`0009`):**

The contract as drafted carries `workspace`, `diff`, `prior_findings`, `instructions`, `budgets`, `model` —
it has **no place for evidence or attachments**. Since a provider may not force a contract change later,
the contract gains, in Fase 5:

- `evidence` — the structured, text-first bundle (console errors, failed requests, 5xx, failing tests,
  manifest references);
- `attachments` — images, with a declared per-provider limit.

**Not every provider can see images.** The contract therefore states image capability per adapter, and a
text-only or vision-less backend simply **skips the visual step** rather than failing the run — the same
graceful-degradation rule as everywhere else. `manifest.v1.json` is versioned in its filename from the
first commit, and the bundle carries a size cap with an explicit note when content was dropped.

**Cost, stated honestly:** capturing and annotating adds work to Fase 3 for a payoff that only arrives in
Fase 6, so the phase does something whose value it cannot itself demonstrate. Second cost: the "what to
capture" heuristic is tuning — too permissive and the manifest is huge, too strict and the defective
element is missing, which looks like the check not working. Third: rendering ids onto a screenshot is
image manipulation, a small new capability in a project that otherwise only moves text around.

**Date:** 2026-08-11

**Re-evaluate when:** the capture heuristic cannot be tuned to catch real defects without bloating the
manifest; or vision capability becomes universal enough that the per-adapter skip is dead weight; or the
false-positive rate stays high even with confirmation, in which case option C is more honest.
