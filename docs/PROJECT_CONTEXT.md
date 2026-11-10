# Standalone Profile Agent context

## Two-digit employment dates (November 9, 2026)

The user reported that “Experience gained” now showed “Unable to calculate” for dates such as `Sep 24`. Both main Career Scout and this fork have the same strict duration code. A read-only aggregate check of the main local profile found eight roles with short years and no calculable durations; its four older approved full-year employment assertions have withdrawn source evidence, so the current evidence guardrail cannot reuse them. The local fork profile was empty. No private resume text was printed or changed.

The active fork now lets the signed-in user confirm four-digit years beside each affected role in Facts. Confirmation is bound to the exact current role, source date values and source references, saved in the owner's Supabase profile, and read back before acknowledging it. A changed or withdrawn source stops the confirmed years from being used. The UI labels these years as user confirmed, leaves the résumé untouched and rejects suffix mismatches or reversed dates. The duration and Profile action tests passed; TypeScript and hosted build passed. Main Career Scout's saved facts and separate website were not changed by this fork update.

## Public Career Scout teacher site (November 9, 2026)

The user asked for a third-party link where their teacher can upload a resume and run the live Profile and application workflow. The active fork was published as a separate public Sites project at `https://career-scout.ujjwalbhateja.chatgpt.site`. The page title and logo remain Career Scout. Visitors sign in with ChatGPT; the server uses each Site user ID for private Supabase profile and application data. This Site is separate from the original Career Scout Site and the local `127.0.0.1` launcher.

The hosted deployment uses the existing Supabase project and configured Gemini/Pinecone providers. It executes Matcher, Tailor, Critic and application package storage within the hosted Worker because the local Python pipeline cannot run on Cloudflare Workers. It reuses the checked-in agent prompt files and current approved-profile loader, and stores bounded runs in the owner-scoped profile state. Hosted application requests await the agent chain to completion, avoiding a short background-worker lifetime. The local launcher still uses the Python pipeline when configured. Public deployment succeeded, and an anonymous HTTPS request to the final link returned the expected ChatGPT sign-in redirect. A signed-in teacher resume-to-package run has not yet been observed, so do not describe that end-to-end path as live-provider verified.

The current hosted source was pushed to the Sites source repository at commit `dbd608deeac27279e5f7ec22dacda12b2a3af9d7` and deployed as version 3. The public GitHub repository keeps the same application source under `career-scout-app/`; the Sites source checkout and package remain ignored under `.local/`.

## Full Career Scout fork (November 9, 2026)

The user corrected the scope: this repository should contain all Career Scout application features except the Scout agent. The full Career Scout application was imported at commit `dd95addd8811f960a7235d70f747193bfd94aa23` into `career-scout-app/`. The root standalone library and earlier port-5175 webpage remain as history; `Start-Profile-Agent.ps1` now launches the imported app on port 5176.

The active fork keeps the Profile/Fact/Builder/Memory workflow, optional JD intake, privacy controls, applications, Matcher, Tailor, Critic and package storage. It removes Scout's Python agent, job-discovery API and search screen. Application preparation requires a supplied job. Master and Profile prompt files were adjusted to remove Scout instructions; the other agent prompts are preserved. The fork uses local mock user `profile_agent_local_seedy` in the same Supabase project, separate from Career Scout's `local_seedy`, so existing Career Scout profile progress is not reused or overwritten.

The Hirebridge JD parser was repaired for ASP.NET form wrappers and `jobdesc` section IDs. The experience review now explains why a duration cannot be calculated when source dates are ambiguous. The fork passed 631 Node tests, 49 Python tests and TypeScript type checking on November 9. See `career-scout-app/PROFILE_AGENT_FORK.md`. The older standalone PDF and setup documents predate this full application fork.

Updated November 9, 2026, America/New_York.

The user requested Profile Agent documentation, diagrams, an account of its two analysis agents and tools/APIs, and a separate public GitHub repository containing runnable code and documentation. Repository name: `ujjwalbhateja/Career-Scout-Profile-Agent`.

The active Profile workflow is implemented in Career Scout's JavaScript service. This project extracts that service and its required dependency closure unchanged from commit `cedc267896578988c2c4607e5cd0877e45e28f39`. The legacy Python Profile graph is documented but is not shipped as a second runnable implementation. The original prompt paths are preserved; all four Profile-family Markdown policies are unchanged.

The trusted-library entry point, CLI and offline demo provide independent execution. A later request added a loopback-only local Profile webpage. Live setup requires explicit credentials and a distinct owner beginning `profile-agent:`. No existing Career Scout secrets, profiles, resumes or databases were copied or changed. No live provider call or database migration was performed for extraction or the webpage addition.

Current validation: 186 tests passed, the local website rendered in Chrome, standalone CLI help/demo ran at the extraction baseline, and 52 upstream file hashes still match. The demo uses synthetic model outputs and a simulated user decision; it is not live Fact/Builder model validation. See `VALIDATION.md` and `UPSTREAM.json`.

## Local Profile webpage

The user clarified that the standalone repository should also contain Career Scout's Profile webpage, in `C:\Users\ujjwa\Job Search\Career Scout Profile Agent`. The original Profile page was coupled to Scout, applications, progress and hosted authentication, so this project adds a Profile-only local adaptation that reuses Career Scout's exact workspace/Profile CSS and connects to this repository's extracted Profile service. Source provenance and CSS hashes are in `web/UPSTREAM.md`. No copied agent source or prompt was edited.

Run `Start-Profile-Agent.ps1` or `npm run web`. The local host binds to `127.0.0.1:5175`, prints a per-process access link and opens a browser on Windows. The owner is fixed by `PROFILE_OWNER_ID` in `.env.local`, not supplied by the browser. Session, same-origin, request-size and private-response checks guard the HTTP boundary. The page offers document intake, Fact evidence/decisions, optional Builder comparison and decisions, current-profile JSON handoff, and memory retrieval/export/deletion. It does not start Scout, applications or reminders. The absence of `.env.local` leaves the UI on its setup screen; no real provider request was made during this change.

The PDF manual is still the November 5 extraction manual and predates the local webpage. Current web setup and boundaries are documented in `README.md`, `docs/SETUP.md`, `docs/API.md` and `docs/VALIDATION.md`.

The user rejected the initial setup-only opening as the wrong webpage. The original Career Scout Profile page was opened at `http://127.0.0.1:5173/?view=profile`. The standalone web client was revised to show its workflow even without configuration, and an ignored local `.env.local` was created from the existing Career Scout provider settings with a distinct `profile-agent:ujjwa-local` owner. The latest standalone host opened at `http://127.0.0.1:5175/` and returned HTTP 200 for that owner's empty profile, revision 0 and zero documents. This was a read-only live Supabase check; Gemini was configured but not called. Existing Career Scout profile records and code were not changed. The standalone webpage remains a Profile-only adaptation of the original, not an exact copy of the original React UI.

The Windows launcher now reopens an already-running local host using an ignored `.local/web-access-<port>.txt` link file. It was exercised against the running host and opened the page without restarting the service. The access link is private and per-process; it is removed on a normal process exit.

Keep the original extraction limits visible: Builder currently requires approved professional factual context; current-profile search readiness can use eligible resume statements. Preserve known ingestion quality limits, current versus legacy snapshot distinctions, explicit approval, source evidence, revision checks, idempotent replay and read-back verification.

The user authorized public publication. Git history and the remote provide the publication receipt. Future changes to copied source must record their divergence rather than silently preserving a false upstream-equivalence claim.

## PDF documentation

The user requested a Word version, then explicitly accepted PDF. Published the consolidated documentation as `Career Scout Profile Agent Documentation.pdf`: 24 pages, four rendered diagrams, clickable contents and source links. All pages were rendered with bundled Poppler and visually checked. The PDF includes the project overview, Profile architecture, setup, API, validation, handoff and maintenance instructions. The initial Word export could not be rendered successfully; its unverified draft and QA intermediates remain ignored under `.local/`. No application code, agent prompts, credentials or saved profile data changed.
