# 0009 — One agent contract, many providers; model selectable per role

**Question:** winnow must be usable by someone with a Claude subscription, someone with a ChatGPT
subscription, someone who prefers metered API keys, and someone who wants a local model — and the model
should be choosable per task, not fixed. How do we express that without building the Provider × Model ×
Role configuration matrix that spec §12.1 explicitly rejects?

**Options:**

- A) One provider (`claude-code`) only. Simplest; excludes everyone without an Anthropic subscription
  and makes the project a single-vendor tool.
- B) A provider matrix with its own configuration UI — the shape spec §12.1 calls out as the wrong
  answer.
- C) **One contract with several implementations behind it.** A fixed input/output shape
  (`{task, workspace, diff, prior_findings, instructions, budgets, model}` → SARIF | patch | test files);
  each provider is a ~200-line adapter. `model` is a field on the contract, resolved from a four-level
  precedence chain with working defaults.

**Choice:** C.

**Reason:** the contract is the only thing the rest of the pipeline sees, so adding a provider is an
adapter plus a registry entry — never a change to the workflow, the prompts, or the dashboard. Making
`model` a contract field (rather than adapter-specific configuration) is what lets the dashboard offer a
per-run model picker without knowing anything about providers. The four-level precedence — per-run
choice → `.winnow/agents.yml` in the analysed repo → dashboard defaults → winnow's built-in defaults —
means nothing is required to get started and everything is overridable, which is the actual requirement.

**Sequencing matters as much as the design:** the contract is written in Fase 5 with one implementation,
and the second, third and fourth adapters land in Fase 7 — *after* one works end to end. Generalising
from a single case produces the wrong abstraction; writing no contract at all and retrofitting one costs
more. Fase 5 defines it, Fase 7 proves it. If an adapter needs the contract changed, that is the signal
the contract was wrong — stop and discuss, don't add a provider-specific field.

**Note on `AGENTS.md` §7 ("no interface with one implementation"):** this is a deliberate, bounded
exception, and the bound is that the second implementation is scheduled one part later. It is not a
licence to add speculative interfaces elsewhere.

**Cost, stated honestly:** four adapters are four things that can break, each against a vendor CLI whose
flags change on someone else's schedule. Mitigation: adapters stay under ~200 lines and hold no domain
logic, so a flag change is a small fix rather than an architectural one. Second cost: model IDs go stale
— they must be verified against current provider documentation when defaults are written, not recalled.

**Date:** 2026-08-11

**Re-evaluate when:** an adapter cannot be expressed within the contract without adding a
provider-specific field; or a provider's terms change such that subscription-backed automation is no
longer permitted; or after a year of real use only one adapter has ever been used, in which case the
others are dead weight and should be dropped rather than maintained.
