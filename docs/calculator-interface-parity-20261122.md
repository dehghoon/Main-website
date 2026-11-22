# Calculator interface update — 22 November 2026

## Requested behavior and implementation

- Wind/seismic use the Snow workspace proportions (1.2 : 0.8 inputs/results), 900px mobile switch, controls, report tables and input-help visual language. Desktop has workspace/report/guide; mobile has inputs/results/report/guide. Panels remain mounted across tabs.
- Concrete/wood use the W-Section desktop model/input/result layout (0.82 : 1.45 : 0.85) and mobile model/input/results/report navigation. Reports use its light document header, highlighted values, borders and print layout. The narrow desktop interval uses two columns to avoid squeezed inputs.
- Wood species and grade selectors expose the existing 19-record catalog in clearly styled controls with a live read-only reference-property summary. A public interactive catalog preview is available before account authorization. Calculation and backend entitlement checks remain protected. Changing species or grade preserves entered geometry and clears prior results.
- Wind/seismic original SVG sketches illustrate geometry, load signs and coordinate/soil/building relationships. They are educational schematics, not copies of code figures. Numbered wind surface zones must be matched to the adopted code's pressure diagram and notes; the sketch does not invent a zone-number mapping.
- Seismic location helper accepts signed decimal Canadian coordinates and a geotechnical site class, opens an explicitly NBC-2020 official query and records the reference. Applying a reference updates the corresponding site designation together. It does not fetch, certify or overwrite hazard ordinates. Xv/special soil conditions remain selectable in the official tool.
- Help explains XD versus coordinates, Sa/PGA units (g), PGV input (m/s, divide cm/s by 100), X450 separation, edition-specific data, code equation overview and parameter assignment.
- Results are invalidated on input changes; in-flight responses use revision checks so old results cannot overwrite changed inputs. Draft reports retain the input snapshot of the displayed run. Wind C&C now displays the returned CgCp coefficient as well as areas.
- Local Print / Save PDF is labeled Beta draft. Existing server-controlled seismic report-preview/formal-PDF controls remain intact.

## Source references

UI references read from dehghoon/Snow-Calculator web/src/{styles,workspace}.css and dehghoon/steel-verification web/app/{globals,workspace-tabs,tool-tabs,brand-shell,report}.css on main. Their geometry and visual patterns are adapted to each calculator without importing their calculation logic.

Engineering guide references: existing wind engine low_rise.py and general_static.py pressure equations and workbook lookup scope; NBC 2020 Division B Sections 4.1.7 and 4.1.8; https://publications.gc.ca/site/eng/9.897526/publication.html ; https://www.earthquakescanada.nrcan.gc.ca/hazard-alea/interpolat/nbc-cnb-en.php?code=nbc2020 ; https://cbhcc-cchcc.ca/eng/seminars/earthquake-design/earthquake-design.html . The shared official hazard tool may default to a newer edition: users must confirm NBC 2020.

## Validation

Local TypeScript and production builds for all three frontends pass. Existing account/session/material-catalog and SEO tests pass. Isolated React/jsdom interaction checks with mocked authorization and calculation responses pass for:

1. Public species/grade property changes.
2. USA catalog changes preserving geometry, read-only fields, stale-result invalidation and report snapshot.
3. Canadian grade changes and component result rendering.
4. Concrete result invalidation and mounted forms across mobile tabs.
5. Wind result display, report input snapshot, stale-result invalidation and mobile guide tab.
6. Seismic coordinate/site reference consistency, floor-force rendering, report snapshot and stale-result invalidation.

These are UI tests, not engine benchmarks or a real signed-in account test. A real Chromium visual run could not launch because the execution environment denied its socket operation. Therefore desktop/mobile pixel parity, actual device gestures, popup login and printed pagination remain unverified. No engineering formula changes or new code approvals are asserted. Existing CSA-2024 flexure and seismic engineering-review restrictions remain unchanged.
