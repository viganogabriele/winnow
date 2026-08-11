# 0025 — The dashboard discards the GitHub user token after login

**Question:** `0020` separated user identity from repository access but did not say how the dashboard keeps
organization authorization current. Persisting the GitHub App user access token and refresh token would
add another credential class to encrypt, rotate and revoke. Checking membership only once would let a user
who leaves the organization keep access for the whole session.

**Options:** A) use the user token only during the login callback, then discard it; re-check organization
membership with an installation token carrying `Members: read`; B) persist and rotate user/refresh tokens
and use those for membership checks.

**Choice:** A. The server-side session stores the immutable GitHub user id and login, not a GitHub token.
For organization authorization, membership is checked at login and every 15 minutes through the App
installation; the session expires after one hour and fails closed if revalidation fails. Whitelist mode
resolves configured usernames to immutable GitHub ids and checks the stored user id instead. The App
resolves the configured organization's installation id with App authentication; it does not need a user
token for that. Repository operations continue to use short-lived installation tokens.

**Private-key custody:** the GitHub App private key is never stored in SQLite or in an environment-variable
value. The process receives a path such as `GITHUB_APP_PRIVATE_KEY_PATH`; local development uses an ignored,
owner-readable file, and deployments mount the file from their secret mechanism. Installation tokens are
minted when needed and are not persisted.

**Reason:** the dashboard can prove identity without turning the user's identity credential into a durable
repository credential. A database leak contains sessions and installation ids, but neither user tokens nor
the App private key. Periodic membership checks bound revocation delay without retaining refresh tokens.

**Cost:** the App needs organization `Members: read`, shared deployments require the App to be installed on
the authorizing organization, and a GitHub outage fails closed after the 15-minute authorization window.

**Date:** 2026-08-11

**Re-evaluate when:** GitHub removes installation-token access to organization membership, or operators
show that the revalidation interval creates a material rate-limit problem.
