# Profile API and integration

## Trusted library interface

```javascript
import {createProfileAgent} from './src/index.mjs';

// Resolve owner from trusted server authentication, or explicit local configuration.
const profile = createProfileAgent({env: process.env, owner: trustedOwnerId});
const record = await profile.read();
const packet = await profile.current();
```

The `owner` argument is mandatory. The wrapper filters environment keys, rejects owner fields in action payloads and loads prompts from fixed paths. This is a local/server API; it does not authenticate an arbitrary caller on its own.

| Method | Result / behavior |
| --- | --- |
| `status()` | Configuration flags and code-selected model names; no network check |
| `read()` | Latest `{revision, state, currentProfile, finalProfileStatus, providers, limits}`; legacy final-status metadata is not a new workflow gate |
| `current(version = 'current')` | Current eligible packet; pinned `current-…` fails on changed content |
| `questionnaires()` | `{revision, roles}` containing recorded capabilities, unresolved/skipped gaps, experience and skill review rows |
| `original(documentId)` | Owner-scoped download of an active uploaded original for the local webpage |
| `upload(file, {kind, title, selected, revision})` | File intake through the Master/Profile dispatch boundary; stored source and deterministic Section 1 parsing for resumes |
| `execute(body)` | Allowlisted Profile operation through the Master/Profile boundary; no client-controlled ownership |
| `readPrompt(name)` export | Fixed `fact`, `builder`, `profile` or `memory` policy file; no caller-supplied path |

The current packet contains `facts`, `roleProfiles` (empty for the current workflow), `searchProfile`, `snapshot` (a derived compatibility descriptor), `profileSummary.saveVerification`, `searchPreferences` and `searchHistory`. A `snapshot` field here does not mean a new snapshot was persisted. `source_validated` means source matching, not independent verification.

## Current Profile actions

Every `execute` action includes the current numeric `revision`. Builder replay recognizes an identical prior submission before rejecting an old revision; do not rely on this for changed payloads.

| Action | Additional fields / purpose |
| --- | --- |
| `paste` | `kind: resume\|jd`, `text`, optional `title`, `selected`; save source |
| `importJD` | `url`; retrieve a readable public JD safely |
| `selectJD` | `id`, `selected`; select optional JD context |
| `extractSection1` | `id` of resume; existing deterministic structured extraction |
| `analyze` | `id`; Fact model extraction for resume/answer, Builder extraction for a JD |
| `prepare` | Analyze pending resume/answer and selected JD documents; optional `search` preferences |
| `buildProfiles` | `mode: expansion`, optional `documentIds`; compare selected requirements and prepare review rows |
| `decideFacts` | `decisions: [{id, version, decision}]`; explicit per-version factual decisions |
| `reviewBuilder` | `submissionId`, `rows`; exact questionnaire decisions described below |
| `correctFact` | Existing domain correction contract in `lib/profile/domain.mjs`; creates a new version requiring its own decision |
| `resolveConflict` | `id`; explicit choice of retained factual record under existing domain rules |
| `answer` / `analyzeAnswer` | Compatibility questionnaire answer path; see `addAnswer` in `domain.mjs`; current role tables use `reviewBuilder` |
| `preferences` | `search` and/or `disclosure`; saves explicit preferences |
| `retrieve` | `query`, optional `kind`; authoritative database/optional semantic candidates |
| `sync` | Explicit derived-index work; requires configured/enabled semantic providers |
| `removeDocument` | `id`; withdraw source and invalidate dependent active use |
| `cleanup` | Complete queued original-file deletion |
| `export` | Profile JSON and original-file metadata; the inherited download paths refer to Career Scout's HTTP route, not a new CLI server |
| `deleteProfile` | `confirmation: "DELETE MY PROFILE"`; explicitly delete the configured owner's profile |

Retired generated-role approval and legacy `finalize`/`saveFinalProfile` are not exposed by this standalone wrapper. Their copied implementation remains available internally for compatibility tests; the recommended handoff is `current()`.

## Example action files

Save private action files under ignored `.local/`, then run:

```powershell
npm start -- action .local/action.json
```

Full resume analysis, using the ID and revision returned by intake:

```json
{"action":"analyze","revision":1,"id":"REPLACE_WITH_SAVED_RESUME_ID"}
```

Analyze selected optional roles and prepare questions:

```json
{"action":"buildProfiles","revision":4,"mode":"expansion"}
```

Explicit approval of one displayed Builder row:

```json
{
  "action":"reviewBuilder",
  "revision":5,
  "submissionId":"REPLACE_WITH_UNIQUE_SUBMISSION_ID",
  "rows":[{
    "rowId":"REPLACE_WITH_RETURNED_ROW_ID",
    "fingerprint":"COPY_THE_EXACT_RETURNED_FINGERPRINT",
    "decision":"approve"
  }]
}
```

Allowed Builder decisions are `approve`, `reject`, `somewhat` and `approve_revision`. `somewhat` requires the user's precise `text` and stores a draft. Refresh the questionnaires before submitting `approve_revision`, supplying the exact revised `text`, current `draftVersion` and fingerprint returned for that row. Do not invent a row ID, fingerprint, approval receipt or statement.

A successful `reviewBuilder` result includes `kind: builder_review_saved`, the submission ID, decisions/fact references, `storageVerified: true` and a current-profile summary. If read-back fails, the operation reports failure to confirm; an earlier database write may already have succeeded, so replay the same submission deliberately instead of generating a duplicate approval.

## Local Profile webpage HTTP API

Run `npm run web` to expose these routes on the loopback-only local host. The host requires its per-process access link/session cookie; POST also requires the exact local Origin. Owner identity comes from `PROFILE_OWNER_ID` in server configuration.

| Route | Behavior |
| --- | --- |
| `GET /api/profile` | Authenticated owner-scoped profile read |
| `GET /api/profile?status` | Configuration flags |
| `GET /api/profile?questionnaires` | Current visible Builder review rows and fingerprints |
| `GET /api/profile?current` | Current source-backed handoff packet |
| `GET /api/profile?download=<documentId>` | Authorized private original download |
| `POST /api/profile` JSON | Same-origin bounded action dispatch |
| `POST /api/profile` multipart | Same-origin bounded file upload |

The local API rejects supplied `owner`, `owner_id` or `namespace` fields through the library wrapper and marks responses private/no-store. Its session is for one trusted local user and must not be treated as hosted multi-user authentication. The original Career Scout hosted API remains separate.

## Provider boundaries

Gemini receives scoped source material and an active stage schema. Profile prompts do not grant network access or storage rights to model output. Supabase is contacted by the Profile memory adapter with server credentials. Pinecone results are checked against surviving authoritative records. Unknown or failed provider responses do not authorize fabricated facts, automatic approvals or a claim of successful saving.

The CLI returns JSON to stdout and errors to stderr with a nonzero exit code. Library operations preserve `ProfileError` status where raised by upstream code, including stale revision/version and unavailable-provider conditions. Do not expose raw profile outputs in public logs.
