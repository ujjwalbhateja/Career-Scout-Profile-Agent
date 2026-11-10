# Career Scout application fork

This is the Career Scout application copied into the separate Profile Agent repository. The webpage retains the **Career Scout** name and layout. Its active Scout agent and job discovery flow were removed; the remaining profile, memory, application and review features are described in [PROFILE_AGENT_FORK.md](PROFILE_AGENT_FORK.md).

The local site runs at `http://127.0.0.1:5176/`. That address is only reachable on the computer running it. The repository's [root README](../README.md) has Windows setup and launcher instructions. Do not share the local address as a public website.

Local validation: 631 Node tests, 49 Python tests and TypeScript type checking passed on November 9, 2026. The original Career Scout tracker remains in `data/scout-progress.json` as historical context; the live board omits Scout-owned items.
# Public Career Scout site

The separate teacher-facing deployment is at https://career-scout.ujjwalbhateja.chatgpt.site. Each visitor signs in with ChatGPT, then uses their own private Profile, optional JD analysis and application workflow. The hosted Worker runs Matcher, Tailor and Critic with the checked-in agent prompts; application packages are private to the signed-in account. The local launcher continues to use the Python application pipeline when it is configured.

