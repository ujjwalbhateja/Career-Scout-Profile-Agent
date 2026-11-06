# Validation record

Date: November 5, 2026, America/New_York.

## Executed checks

- Independent dependency installation succeeded in this standalone project.
- **185 tests passed**, zero failures: copied factual grounding, current-profile, Builder, source coverage, question policy, provider behavior, PostgreSQL migration and related regression checks, plus standalone ownership/action-boundary and synthetic-demo checks.
- The synthetic demo exercised explicit simulated Builder approval, revision-checked in-memory saving, read-back verification and the current-profile handoff. Its test forbids network calls.
- All **52 upstream files** matched their recorded SHA256 hashes from Career Scout commit `cedc267896578988c2c4607e5cd0877e45e28f39`, including the four preserved Profile-family prompts.

## Scope and limitations

The tests use synthetic data and mocked providers or local PGlite. No live Gemini request, Supabase profile write, Pinecone indexing or real resume analysis was performed for this extraction. Credentials were not copied, migrations were not applied to an existing database and the original Career Scout application code was not changed.

The package is runnable locally as a library/CLI. It is not a new browser app or hosted service. The synthetic demo is not evidence of live model extraction quality, complete resume ingestion or production deployment. Provider availability, authentication and representative end-to-end model results remain configuration-dependent checks.

Historical ingestion omissions, duplicate grouping risks, the Builder approved-fact prerequisite and legacy snapshot messages are documented in [PROFILE_AGENT.md](PROFILE_AGENT.md). They are preserved rather than silently changed during extraction.
