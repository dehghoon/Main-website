# Concrete and wood member pilots

Shared 3D geometry supports drag/touch rotation, wheel/pinch/button zoom,
keyboard control, reset, end-on section view, and translucent concrete with
one bottom reinforcement layer. It updates with the same form dimensions.
It does not invent top bars, hooks, development or detailing approval.

Wood API: NDS2024 component checks with explicit continuous bracing input.
External reference cases are documented in dehghoon/WoodDessign at
`docs/verification/WEB_BENCHMARKS.md`; source examples are NDS2018.

Concrete API: https://linkoteq-concrete-api.vercel.app/api/v1/section/flexure
Explicit-parameter arithmetic pilot. It never reports code-edition approval.
2019 Jabacus sample and2014 SkyCiv comparison are documented in
`dehghoon/linkoteq-concrete-beam/docs/verification/`.
Complete CSA profiles, particularly2024, remain unverified. Parameters are
cleared when changing edition. The UI's display length is not an analysis span.

Access uses existing server-authorized owner/internal/Beta policies with a
separate `concrete_beam` key; no database grant or role was created. All
calculator content and controls render only after canonical authorization.
The new public landing copy retains unverified status and SEO metadata.

Visual QA limitation: the cloud browser cannot connect to this workspace's
loopback preview. The temporary isolated viewer QA route was removed and
is not committed or deployed. Build/type checks passed; drag/pinch visual
behavior and a real signed-in employee session were not browser-verified.
