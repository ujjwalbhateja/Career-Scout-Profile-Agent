# Validation record

## Local Profile webpage addition — November 9, 2026

- `npm test`: **186 passed**, zero failed, including a new HTTP boundary test for local session admission, cross-origin POST rejection, credential-free setup and static assets.
- `npm run verify:upstream`: all **52 original extracted files** still match the recorded Career Scout hashes. The four Profile-family prompt files are unchanged.
- The local webpage was opened in Chrome at `127.0.0.1:5175`; its setup screen, navigation and copied Career Scout styling rendered. The page was not connected to live Supabase or Gemini because this standalone project's `.env.local` is absent.
- The browser host binds to loopback and does not accept browser-supplied owner IDs. Its one-process local access link is converted to an HTTP-only session cookie; the test confirmed unauthenticated GET and cross-origin POST are blocked.
- The original Career Scout CSS files copied into `web/` matched the source bytes; provenance is recorded in [web/UPSTREAM.md](../web/UPSTREAM.md).

This validates the local host and offline boundaries. It does **not** validate a real resume upload, Supabase write, Gemini analysis, Builder output or hosted deployment. The PDF manual below records the earlier library/CLI release and has not been regenerated for the new webpage.

### Follow-up live configuration check — November 9, 2026

After the user reported that the setup screen was wrong for the requested webpage, the standalone project received an ignored local `.env.local` populated from Career Scout's existing provider settings with a new `profile-agent:` owner. Duplicate source entries were reduced to their active last values. The page's authenticated local `GET /api/profile` returned HTTP 200 with revision 0 and zero documents. Provider configuration reports Supabase and Gemini present; no Gemini request, resume upload or profile mutation was performed. The original Career Scout page at `127.0.0.1:5173` was opened separately and was not modified. The first restricted local process could not reach Supabase; the relaunched host with provider network access completed the read.

The webpage now displays the workflow even if configuration is absent, with mutating controls disabled and a setup notice. This check does not establish live Fact/Builder model quality or an exact visual copy of the original React webpage.

The launcher was then corrected to reopen a running local host using its ignored access-link file. Its second invocation opened the existing page without a port conflict. The live GET again returned HTTP 200 for the separate owner, revision 0, zero documents. No profile data was written.

Date: November 5, 2026, America/New_York.

## Executed checks

- Independent dependency installation succeeded in this standalone project.
- **185 tests passed**, zero failures: copied factual grounding, current-profile, Builder, source coverage, question policy, provider behavior, PostgreSQL migration and related regression checks, plus standalone ownership/action-boundary and synthetic-demo checks.
- The synthetic demo exercised explicit simulated Builder approval, revision-checked in-memory saving, read-back verification and the current-profile handoff. Its test forbids network calls.
- All **52 upstream files** matched their recorded SHA256 hashes from Career Scout commit `cedc267896578988c2c4607e5cd0877e45e28f39`, including the four preserved Profile-family prompts.

## Scope and limitations

The tests use synthetic data and mocked providers or local PGlite. No live Gemini request, Supabase profile write, Pinecone indexing or real resume analysis was performed for this extraction. Credentials were not copied, migrations were not applied to an existing database and the original Career Scout application code was not changed.

At the extraction baseline, the package was runnable as a library/CLI only. A later loopback-only Profile webpage was added as recorded above; it is not a hosted service. The synthetic demo is not evidence of live model extraction quality, complete resume ingestion or production deployment. Provider availability, authentication and representative end-to-end model results remain configuration-dependent checks.

Historical ingestion omissions, duplicate grouping risks, the Builder approved-fact prerequisite and legacy snapshot messages are documented in [PROFILE_AGENT.md](PROFILE_AGENT.md). They are preserved rather than silently changed during extraction.
