# 0004 — Dagger after the container foundations

Date: 2026-08-11
Question: Should winnow use Dagger from the first container phase?
Options: Use Dagger now; or invoke Podman directly for phases 1–11.
Decision: Invoke Podman directly and reconsider Dagger at the start of Part C.
Reason: Learning the concrete container commands first makes the security boundary understandable and debuggable.
Cost: The early sandbox code is less abstracted.
Re-evaluate: At the start of Part C, or sooner if Dagger becomes genuinely necessary.
