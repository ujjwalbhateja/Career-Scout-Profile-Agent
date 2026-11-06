# Maintaining the standalone Profile Agent

- Keep this repository scoped to Profile, Fact, Profile Builder and Profile-owned memory. Master is the external coordinator boundary; never let the analysis children access each other's state or memory directly.
- Read `docs/PROFILE_AGENT.md` and `docs/SETUP.md` before changing behavior. Preserve exact evidence, owner scoping, revisions, explicit decisions, idempotent retries and verified save receipts.
- Do not alter prompts as part of packaging or routine documentation work. The copied prompt files and source hashes are recorded in `UPSTREAM.json`.
- `UPSTREAM.json` records the extraction baseline. If an upstream file is deliberately changed later, document the divergence and update the preservation strategy; do not silently claim byte-identical upstream behavior.
- Run `npm test` for behavioral changes and `npm run verify:upstream` for preservation checks. Record actual validation in `docs/VALIDATION.md`; fixtures are not live-provider evidence.
- Keep `.env.local`, credentials, real resumes, private outputs and local caches out of Git. Use `.local/` for private operation files and fixtures containing personal data.
- Never use the existing Career Scout owner/profile for tests. The standalone CLI uses an explicit separate `profile-agent:` identity; library integrations must resolve owner identity from trusted server context.
- This repository does not include a browser server or downstream Scout/applications. Do not present copied shared utility modules as newly activated workflows.
