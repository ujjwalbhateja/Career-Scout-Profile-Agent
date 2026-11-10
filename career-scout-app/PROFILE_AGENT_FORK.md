# Profile Agent fork context

Source: `C:\Users\ujjwa\job_search` at commit `dd95addd8811f960a7235d70f747193bfd94aa23` (Career Scout). Imported as a source archive into this directory on 2026-11-09. Its Git history remains in the original Career Scout repository.

## Scope

- Keep the Career Scout profile steps for resume intake, fact and employment review, optional JD role questionnaires, memory, privacy controls, and application preparation.
- Keep the original **Career Scout** webpage name and visual identity.
- Keep Master, Profile, Fact, Profile Builder, Memory, Matcher, Tailor, Critic and Application Storage. Existing prompt files remain in their original locations; Master and Profile prompts were changed only to remove Scout dispatch instructions.
- Remove the Scout Python agent, discovery API, job search UI, active coordinator routes, and discovery adapter. A user-supplied job is required for application preparation.
- Keep the original Career Scout progress file as imported history. The live progress view filters Scout-owned historical items; it does not change their source evidence or claim new completion.
- Use local web port 5176, Python port 8788 and mock user `profile_agent_local_seedy`. The original Career Scout mock user is `local_seedy`; this protects existing Career Scout profile progress in the shared Supabase project.

## Repairs brought into the fork

- JD link intake retains content inside ASP.NET `<form>` wrappers and recognizes `jobdesc` section IDs. The Hirebridge posting at `https://recruit.hirebridge.com/v3/Jobs/JobDetails.aspx?cid=8487&jid=354586` returned HTTP 200 but previously parsed only the title. It now yields a full description and source segments.
- The experience review shows a specific reason when employment duration cannot be calculated from source-backed dates. It does not guess missing or ambiguous dates.
- Two-digit employment years now have a role-specific confirmation form in Facts. The signed-in user enters full years matching the résumé suffix; Profile saves and reads back that explicit confirmation. Duration calculation uses it only while the original role/date source still matches. The résumé and original fact approvals are unchanged. The displayed result identifies user-confirmed years and does not claim independent verification.
- The user clarified that recent `Month YY` dates use 20xx years: for example, `Jun 24` is June 2024. The duration display now calculates these directly from the source text without prompting. Future or older ambiguous suffixes still use the confirmation form. Source dates and approvals remain unchanged.

## Current boundaries

The inherited Tailor flow still prepares a tailored resume for an application package. It is retained because this fork was requested as Career Scout with only Scout removed. It is separate from the Career Buddy design in which InterviewBuddy uses the uploaded resume unchanged.

The public fork is hosted at `https://career-scout.ujjwalbhateja.chatgpt.site`; visitors sign in with ChatGPT and their profile data is owner scoped. Hosted publishing and anonymous sign-in routing were verified. A signed-in teacher resume-to-application run remains unobserved.
