# Standalone Profile Agent context

Updated November 5, 2026, America/New_York.

The user requested Profile Agent documentation, diagrams, an account of its two analysis agents and tools/APIs, and a separate public GitHub repository containing runnable code and documentation. Repository name: `ujjwalbhateja/Career-Scout-Profile-Agent`.

The active Profile workflow is implemented in Career Scout's JavaScript service. This project extracts that service and its required dependency closure unchanged from commit `cedc267896578988c2c4607e5cd0877e45e28f39`. The legacy Python Profile graph is documented but is not shipped as a second runnable implementation. The original prompt paths are preserved; all four Profile-family Markdown policies are unchanged.

The new trusted-library entry point, CLI and offline demo provide independent execution. This is not a browser interface. Live setup requires explicit credentials and a distinct CLI owner beginning `profile-agent:`. No existing Career Scout secrets, profiles, resumes or databases were copied or changed. No live provider call or database migration was performed for extraction.

Validation: 185 tests passed, standalone CLI help/demo ran successfully, local Markdown links and fences checked, and 52 upstream file hashes matched. The demo uses synthetic model outputs and a simulated user decision; it is not live Fact/Builder model validation. See `VALIDATION.md` and `UPSTREAM.json`.

Keep the original extraction limits visible: Builder currently requires approved professional factual context; current-profile search readiness can use eligible resume statements. Preserve known ingestion quality limits, current versus legacy snapshot distinctions, explicit approval, source evidence, revision checks, idempotent replay and read-back verification.

The user authorized public publication. Git history and the remote provide the publication receipt. Future changes to copied source must record their divergence rather than silently preserving a false upstream-equivalence claim.

## PDF documentation

The user requested a Word version, then explicitly accepted PDF. Published the consolidated documentation as `Career Scout Profile Agent Documentation.pdf`: 24 pages, four rendered diagrams, clickable contents and source links. All pages were rendered with bundled Poppler and visually checked. The PDF includes the project overview, Profile architecture, setup, API, validation, handoff and maintenance instructions. The initial Word export could not be rendered successfully; its unverified draft and QA intermediates remain ignored under `.local/`. No application code, agent prompts, credentials or saved profile data changed.
