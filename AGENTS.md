# Maintaining the Career Scout fork and Profile Agent library

- The user's current scope is the complete Career Scout application except its Scout job-discovery agent. `career-scout-app/` is the active application; preserve the Career Scout page name and its Profile, Fact, Builder, Memory and application agent workflows.
- The public teacher deployment is a separate Sites project identified by `career-scout-app/.openai/hosting.json`. Keep each signed-in visitor's Supabase profile and application runs scoped to their Sites user ID. Do not publish credentials or resume data.
- The root library and original local Profile webpage remain as historical extracted artifacts. Instructions below apply to that legacy code where relevant; they do not remove applications from the active fork.

- Keep this repository scoped to Profile, Fact, Profile Builder and Profile-owned memory. Master is the external coordinator boundary; never let the analysis children access each other's state or memory directly.
- Read `docs/PROFILE_AGENT.md` and `docs/SETUP.md` before changing behavior. Preserve exact evidence, owner scoping, revisions, explicit decisions, idempotent retries and verified save receipts.
- Do not alter prompts as part of packaging or routine documentation work. The copied prompt files and source hashes are recorded in `UPSTREAM.json`.
- `UPSTREAM.json` records the extraction baseline. If an upstream file is deliberately changed later, document the divergence and update the preservation strategy; do not silently claim byte-identical upstream behavior.
- Run `npm test` for behavioral changes and `npm run verify:upstream` for preservation checks. Record actual validation in `docs/VALIDATION.md`; fixtures are not live-provider evidence.
- Keep `.env.local`, credentials, real resumes, private outputs and local caches out of Git. Use `.local/` for private operation files and fixtures containing personal data.
- Never use the existing Career Scout owner/profile for tests. The standalone CLI uses an explicit separate `profile-agent:` identity; library integrations must resolve owner identity from trusted server context.
- The legacy root webpage is loopback-only and Profile-only. The active fork has a separately deployed signed-in Career Scout webpage with applications. Keep both ownership boundaries server-controlled and never send server credentials to the browser.
