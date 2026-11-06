# Career Scout Profile Agent

Runnable Profile Agent, Fact Agent and Profile Builder extracted from [Career Scout](https://github.com/ujjwalbhateja/Career_Scout). Profile turns a resume and optional job descriptions into a source-backed, versioned profile that Master can use. It owns storage and user decisions; its two analysis agents never approve claims themselves.

This repository runs as a **Node.js library and local command-line tool**. It does not include Career Scout's browser interface or the downstream job-search/application service. Shared modules required by the original implementation remain included to preserve behavior.

## Start here

| Document | Covers |
| --- | --- |
| [Profile Agent documentation](docs/PROFILE_AGENT.md) | Purpose, responsibilities, diagrams, both subagents, evidence, memory, tools and APIs |
| [Setup and operations](docs/SETUP.md) | Installation, configuration, database setup, running the agent, troubleshooting |
| [API and integration](docs/API.md) | Library methods, CLI commands, action contracts and Master handoff |
| [Validation](docs/VALIDATION.md) | Executed checks, preservation evidence and remaining limits |
| [Upstream manifest](UPSTREAM.json) | Source repository, exact source commit and hashes of unchanged files |

## Run without credentials

Install Node.js 22.13 or later, then:

```powershell
npm ci
npm run demo
npm test
npm run verify:upstream
```

The demo uses synthetic facts, a simulated user approval and in-memory storage. It demonstrates verified saving and the current-profile handoff; it does not call Gemini, Supabase or Pinecone. Live operation setup is documented separately.

## Agent structure

```mermaid
flowchart TD
    U["User: resume, optional JDs and decisions"] --> M["Master intake boundary"]
    M <--> P["Profile Agent: coordinator and current profile"]
    P <--> F["Fact Agent: source-linked factual proposals"]
    P <--> B["Profile Builder: compare requirements and ask about gaps"]
    P <--> R["Memory adapter: owner-scoped storage and retrieval"]
    F <--> G["Gemini analysis"]
    B <--> G
    R <--> S[("Supabase: authoritative records and original files")]
    R <--> V[("Pinecone: optional derived index")]
    R --> E["Gemini embeddings"]
    M --> X["Scoped professional context to Scout in Career Scout"]
```

Memory supports the two analysis agents through Profile. It is not a third agent that writes experience. The standalone package returns the handoff to its caller; it does not start Scout.

## Preservation and provenance

The 52 source, prompt, migration and regression-test files listed in `UPSTREAM.json` are copied unchanged from Career Scout commit `cedc267896578988c2c4607e5cd0877e45e28f39`. The standalone entry point, CLI, demo and documentation are new. Fact and Profile Builder prompts retain their original paths. Profile and Memory prompts are included as coordinator policy references; the entry point does not send them to a model or interpret them as executable routing.

No existing profile, resume, credentials or database export is included. The CLI requires a separate `profile-agent:` owner identity and does not load Career Scout's environment file. Do not configure a hosted public endpoint around this library without an authentication boundary.

There is no license grant added by this extraction. Public repository visibility alone does not grant a software license; upstream and dependency licensing must be respected.
