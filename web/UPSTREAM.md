# Profile webpage source and scope

Career Scout source repository: `ujjwalbhateja/Career_Scout`, commit `dd95addd8811f960a7235d70f747193bfd94aa23`.

The following CSS files were copied byte-for-byte from the Career Scout Profile webpage:

| This repository | Career Scout source | SHA-256 |
| --- | --- | --- |
| `career-workspace.css` | `app/workspace.css` | `734D27C6E61EFB014A723524DDCAECF8D9194DD5C74FB2D2FC49D08239179D1B` |
| `career-profile.css` | `app/profile/profile.css` | `1D644C4A1605DC8FAD086FC4B92BE33A0B99F3F16B8DFEFAE53ED3D72DE569C4` |

`index.html`, `app.js`, `style.css`, `src/web-server.mjs` and the launcher are new Profile-only adaptations. The original Career Scout React page also imports Scout, applications, progress and hosted authentication. Those dependencies are intentionally absent from this standalone Profile Agent. The local webpage instead calls the extracted Profile library and is limited to a single trusted local owner. `UPSTREAM.json` continues to describe the earlier unchanged agent-code extraction; this web adaptation does not change that manifest or any agent prompt.
