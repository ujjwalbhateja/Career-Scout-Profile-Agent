# Setup and operation

## Requirements

- Node.js 22.13 or later and npm.
- Supabase project with the supplied Profile migrations for durable live storage.
- Gemini API credentials for live Fact/Builder model calls. No OpenAI or Groq integration is used by this package.
- Optional Pinecone index compatible with 3072-dimensional Gemini vectors for semantic retrieval.

The checked-in model IDs are inherited from Career Scout. Provider availability and quotas must be verified in the environment where you run the package. There is no automatic alternate-provider fallback.

## Install and verify offline behavior

```powershell
git clone https://github.com/ujjwalbhateja/Career-Scout-Profile-Agent.git
cd Career-Scout-Profile-Agent
npm ci
npm run demo
npm test
npm run verify:upstream
```

The demo and test suite use synthetic fixtures and do not require credentials. They do not establish live model quality. `verify:upstream` checks the preserved source, prompts, migrations and tests against their recorded hashes.

## Configure live storage and models

Copy `.env.example` to ignored `.env.local`. Fill in values locally, never in documentation or Git:

| Variable | Use |
| --- | --- |
| `PROFILE_OWNER_ID` | CLI-only trusted local identity; choose a stable unique `profile-agent:` value, replacing the example |
| `SUPABASE_URL` | Project URL for the authoritative store |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret; adapter also accepts legacy `SUPABASE_SERVICE_ROLE_KEY` |
| `GEMINI_API_KEY` | Fact/Builder analysis and optional embeddings |
| `PINECONE_API_KEY` | Optional semantic index access |
| `PINECONE_INDEX_HOST` | Optional data-plane index host |
| `PROFILE_SEMANTIC_SEARCH` | `disabled` initially; remove/set otherwise when intentionally enabling semantic calls |

The standalone process does not read Career Scout's `.env.local`, copy its credentials or infer its authenticated owner. The CLI prefix prevents accidental reuse of its ordinary owner identity. Reusing a Supabase project is possible after configuration, but the new owner must remain distinct if separate profile data is intended. No credentials or live data were configured as part of this extraction.

## Local Profile webpage

After `npm ci` and local `.env.local` configuration, run `./Start-Profile-Agent.ps1` on Windows or `npm run web` with Node.js on another system. The host binds to `127.0.0.1:5175` by default; `PROFILE_WEB_PORT` can change the port. It opens a browser on Windows and prints a local access link. Rerunning the Windows launcher reuses a running host through an ignored `.local/web-access-<port>.txt` link file. That link establishes an HTTP-only, SameSite cookie and redirects to the clean local URL. Do not share the access link, file or browser session. Press Ctrl+C in the original launcher terminal to stop the host.

The webpage exposes the Profile workflow only: upload or paste a resume, add optional JDs, explicitly analyze sources, approve or reject Fact proposals, compare approved facts with selected JDs, review Builder rows, download the current profile packet, and search/export/delete owner-scoped data. It never approves a claim automatically. Gemini analysis buttons are disabled when `GEMINI_API_KEY` is absent. The status display reports configured providers, not live provider health.

This web host is designed for one trusted local owner. It is not a multi-user hosted sign-in layer. It requires the configured `PROFILE_OWNER_ID`, a private local access link, a session cookie and same-origin POST requests; it never accepts an owner supplied in a browser action. The original Career Scout hosted site remains separate.

For a new database, apply these files in order using a project administrator's Supabase SQL tooling:

1. `supabase/migrations/202610280001_profile_memory.sql`
2. `supabase/migrations/202610290002_profile_conflict_response.sql`

The migrations create the Profile state/usage tables, guarded RPCs and a private document bucket. They are not run automatically by the CLI or `npm ci`. Existing installations should be inspected before migrations are applied. The standalone task has not modified Career Scout's database schema.

## Live workflow

1. Run `npm start -- status`. This reports configuration presence, not provider authentication or model health.
2. Run `npm start -- read` to load the configured owner's record and current revision. For a new owner this should be empty after the database is prepared.
3. Upload with `npm start -- upload "C:\private\resume.pdf" 0 resume`, substituting the actual latest revision. Or use a private JSON `paste` action. Intake performs the existing deterministic Section 1 parsing; it does not establish completed Gemini analysis.
4. Inspect the returned documents and proposals. Use explicit `analyze` for the saved resume document when full Fact model extraction is wanted. This calls Gemini and may consume quota.
5. Optional Builder path: inspect and explicitly decide professional facts, then upload/paste/import and select JDs. Run `buildProfiles` with `mode: "expansion"`. Current code requires at least one approved professional fact. No automatic approval is supplied by this CLI.
6. Run `npm start -- questionnaires`. Inspect the exact visible statements and their fingerprints. Submit `reviewBuilder` decisions only for what the user actually confirms. Somewhat saves a draft; approving revised wording is a separate action.
7. Run `npm start -- current` to obtain the source-backed current profile for Master. No separate final-save action or automatic job search occurs.

Action files must use the latest revision, IDs and fingerprints returned by the service. Examples in [API.md](API.md) are templates, not real user decisions. Keep action files, resumes and saved outputs under ignored `.local/` or outside the repository. CLI JSON output can contain private profile information.

## Operational behavior

Supabase is authoritative. Revision conflicts require a reload, not a forced overwrite. If an approval response is lost, retry its same submission ID and identical payload; the service checks replay and verifies storage. Changing a payload requires a new submission ID and fresh row basis.

The original API can schedule indexing after certain actions. This CLI does not install a background scheduler. Request `sync` explicitly after enabling and configuring semantic search. Database retrieval can operate with semantic search disabled.

Removing a document withdraws it and its dependent evidence from active use; original file cleanup is separate. `deleteProfile` requires the exact confirmation phrase and can remain pending if configured derived stores cannot be purged. These actions must be explicit.

## Troubleshooting

| Symptom | Meaning / next step |
| --- | --- |
| Missing trusted owner | Set a stable unique `profile-agent:` identity; the CLI does not authenticate remote users |
| Supabase not configured | Set the URL and server-only secret; do not paste them into commands or commits |
| Schema/RPC error | Check that the Profile migrations are installed in the selected project |
| Stale revision / profile version | Read current state, inspect changes and resubmit against the new basis |
| Builder asks for approved experience | Existing comparison prerequisite; inspect and explicitly approve valid professional facts |
| Gemini unavailable / quota exhausted | Preserve saved input; report the failure and retry deliberately when available |
| Could not confirm saved decision | Reload; retry the identical submission if appropriate. Do not assume the failed response means no write occurred |
| No extractable PDF text | Supply a complete text-based PDF, DOCX or TXT; OCR is not included |
| Comparison unresolved | Retain uncertainty; do not convert it into an invented approval question |
| Semantic retrieval unavailable | Database retrieval remains available; inspect optional configuration and index compatibility |

## Integration and deployment limits

The library accepts a trusted `owner` argument from server code. Do not accept it unvalidated from a browser body. The bundled HTTP host is loopback-only with a per-process access link and one configured owner; it is not suitable for internet hosting. Any future public/multi-user host needs authenticated owner resolution, request-size limits, same-origin/CSRF handling, private responses and protection for server credentials.

The original React UI, Python service, Scout discovery, matching, tailoring, Critic, applications and reminders are outside this standalone entry point. Use Career Scout for that surrounding application. Shared imported modules are preserved for compatibility; their presence does not mean those workflows are exposed or started here.
