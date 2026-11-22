# Canadian CSA O86:24 framing component pilot — 22 November 2026

Authenticated `/api/v1/beam/check` discriminates CA/US and rejects mismatched standards and units. Existing US NDS2024 engine and legacy routes remain. No NDS formulas or defaults are used for CA. No 2019 edition substitution.

CA scope: single dry untreated visually graded sawn framing, actual width38mm and depths64/89/114/140/184/235/286mm, uniformly loaded simple span, continuous compression-edge restraint and support restraint; no notches, holes, composite action, glulam or SCL. Engineer supplies documented material values. Synthetic defaults are not a species/grade database. Restriction avoids extrapolating the documented size factors.

## Source register

- TPIC updated2024 public design document: https://tpic.ca/wp-content/uploads/2024/08/tpic_2024_updated.pdf . Retrieved22Nov2026. The currently served text explicitly references CSA O86:24 and NBC2025; do not infer its referenced edition solely from the2024 filename. Sections6.4.4 and6.5 supply duration, size, and component equations. KZb=KZv at listed depths:1.7,1.7,1.5,1.4,1.2,1.1,1.0. Table6.6.3.3: dry sawn creep multiplier2, explicitly declared sustained live fraction. No roof/truss KF, plate Kp or system KH enhancement is imported. KH=KS=KT=KL=KB=KZcp=1.
- CWC2025 manual official page (CSA O86:24): https://cwc.ca/publication/wood-design-manual/
- CWC original additional worked examples: https://cwc.ca/wp-content/uploads/2026/09/WDM_additional_design_examples.pdf . Example1 SPFNo2,38x235mm,fb11.8,KH1.4,KZ1.1: supplied KL.583 produces Mr3.33kNm,KL.851 produces4.87kNm; test tolerance .02kNm reflects published rounded KL. Tests validate explicit bending-factor arithmetic; they do not validate cantilever, load combination, unbraced stability or every code requirement. Public CA pilot only admits continuous bracing KL1 and uses KH1.

Mr=.9fb KD KH KS KT S KZb KL;Vr=.9fv KD KH KS KT (2A/3)KZv. Basic end bearing Qr=.8fcp KD KS KT Ab with KB=KZcp=Kp=1, explicitly excluding additional local near-support load checks. User-entered deflection limits are project inputs, not inferred jurisdictional minima. Dry total bending deflection=immediate nonsustained live +2×(dead+sustained live). Shear deformation, connections, fire and vibration remain outside scope.

Long term KD.65,short term1.15; standard1 except combined dead/live rule max(.65,1-.5log10(D/L)) when D>L; dead only.65. User must select the governing duration and load combination. Different loading patterns and patterns without a directly corresponding dead/live pair require separate engineering evaluation.

Both synthetic arithmetic and the external published targets are regression tested. Every response says whole member not checked, engineering approval false, even if component checks pass. Existing complete-engine gate remains unchanged. Anonymous calls to new route return401. UI is inside the existing approved-account gate; revocation or token change invalidates pending results.

Grade boundary: light-framing grades use KZb=KZv=1 per TPIC6.4.4.6.2; only explicitly declared eligible structural visual grades use the tabulated increases. Missing grade category defaults conservatively to light framing. MSR/MEL remain outside this pilot. Depth286mm additionally requires explicit confirmation of adequate bridging/blocking at <=2280mm (TPIC6.5.1.2); continuous compression-edge restraint alone does not assert this condition.
