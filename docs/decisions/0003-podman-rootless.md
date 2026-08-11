# 0003 — Rootless Podman for containers

Date: 2026-08-11
Question: Which container runtime should execute repositories under test?
Options: Rootless Podman; or a Docker-based runtime.
Decision: Use rootless Podman.
Reason: It has no privileged daemon socket to expose accidentally and supports the minimum isolation tier in spec §15.2.
Cost: Some examples assume Docker and must be translated to Podman commands.
Re-evaluate: Only if Podman cannot meet a required security invariant.
