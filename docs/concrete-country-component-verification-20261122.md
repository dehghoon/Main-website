# Country component pilot — 22 November 2026

The new authenticated `/api/v1/beam/check` selects an explicit country and code. No default-country or edition fallback. Canonical input units are mm, MPa and kN/m. ACI in-lb equations use exact inch/lbf conversions, not rounded SI equation coefficients.

| Selected profile | Available numerical components | Outstanding scope |
| --- | --- | --- |
| ACI 318-19 in-lb | Singly reinforced positive flexure, tension-control criterion, minimum longitudinal reinforcement without exemption, shear, minimum transverse steel, conservative stirrup spacing, diagonal limit, clear bottom-bar spacing; immediate bending deflection | Anchorage, exposure cover, crack control, long-term deflection and project deflection limits, local bearing, seismic, full detailing |
| CSA A23.3:19 | Yielding-steel equilibrium with automatic block factors and resistance factors, c/d ductility comparison, simplified shear with minimum stirrups and spacing | Minimum longitudinal reinforcement, longitudinal spacing clauses, crack/serviceability/detailing and whole-member approval |
| CSA A23.3:24 | Simplified shear only, fy-dependent beta; theta=35°; minimum stirrups and spacing | Flexure explicitly returns null: exact beta1/ductility source verification unresolved. No 2019 flexure substitution. |

Normal-density, non-prestressed rectangular simple-span UDL, one bottom layer, no axial force/torsion/reversal/seismic design. Span must exceed 4d. Nominal bar areas are catalog values, not circular approximations. Full support reaction is used conservatively. CSA requires at least minimum transverse reinforcement. USA reinforcement limited to Grade60; concrete2500–8000psi. Canada2019 fy≤400MPa;2024 fy≤500MPa. Results always `engineering_approval=false`, `whole_member_status=not-checked`.

## Primary equation source and numerical comparisons

- ACI318-19 in-lb actual standard, clauses21.2,22.2,22.5,9.6,9.7,24.2,25.2: https://www.ocf.berkeley.edu/~chiep/wp-content/uploads/2024/01/CE-123-ACI-318-19.pdf
- Original ACI318-19 worked example: https://calcnote.foundrycorelabs.com/methodology/beam-design-example . b12in,h24in,d21.625in,3#8,2#3@8in,fc4000psi,fy60000psi;φMn212.0kipft,φVn51.38kip;δD.142in,δL.100in. Regression tolerances respectively .1kipft,.02kip,.002in,.002in to account for printed rounding.
- Original Jabacus2019 observed default: https://jabacus.com/engineering/concrete2019/concrete_mr.php . b300,d400,As200mm²,fc25,fy400;Mr26.62kNm, tolerance .005. This is an arithmetic comparison, not complete CSA validation.
- Original 2024 shear worked example: https://blog.struct.work/stirrup-spacing-and-the-beta-factor-beam-shear-design-to-csa-a23-3/ . bw500,dv662,fc30,Av200,fyt400,pitch250mm;Vc212.1165kN,Vs257.1580kN,Vr469.2746kN. Source d735 is printed with rounded dv662; fixture derives cover for exact dv662 and documents this distinction.
- CSA2019 ductility source comparison: Strucwise CSA A23.3-19 Updates https://static1.squarespace.com/static/638a440130e2755883ad1aa7/t/66db5070c8a41b0f0db414f1/1725649014747/Strucwise%2B-%2BCSA%2BA23.3-19%2BUpdates.pdf
- Manufacturer's CSA2024 theoretical notes corroborate alpha1,epscu,phi; they do not establish our missing beta1 clause: https://www.ideastatica.com/support-center/theoretical-background/theoretical-background-for-idea-statica-detail

The public complete-engine evaluate gates remain unchanged. Matching examples does not constitute independent engineering certification. Invalid catalog/code pairs, nonfinite/boolean dimensions, deep-beam scope and omitted acknowledgments are rejected. The route is denied before validation for anonymous callers. Legacy explicit-parameter research endpoint remains for compatibility and continues to report unverified status.
