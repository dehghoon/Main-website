# Limited Beta: custom domains, account reconnect and wood records

Product owner authorized domain registration and the previously requested application fixes on22Nov2026, while deferring full code/engineering acceptance. This is a limited evaluation Beta, not complete member approval or a GPT5 security verdict. No engineering engine formula, backend access policy, plan enrollment or previously blocked calculation mode is unlocked.

## Domain assignments / Namecheap CNAME

| Host under linkoteq.com | Vercel project | Recommended CNAME value |
| --- | --- | --- |
| seismic | linkoteq-seismic-preview | 30113f32ae0a5250.vercel-dns-017.com |
| wind | wind-calculator (unnumbered) | b86c25224750b8ea.vercel-dns-017.com |
| wood | main-website | ccba350ba428a5a7.vercel-dns-017.com |
| beamconcrete | main-website | ccba350ba428a5a7.vercel-dns-017.com |

Domains were added to the selected Structara team. Ownership verification is distinct from DNS configuration. Namecheap is the authoritative external DNS provider; no nameserver or apex/mail record was changed. DNS/TLS readiness must be checked after the owner adds these records. Wood/concrete hostnames redirect to the existing www.linkoteq.com calculator routes to keep their current first-party account session. Their independent calculation APIs remain unchanged. Existing working main-site routes and vercel.app tool addresses are retained; navigation continues using the existing aliases until custom DNS is ready.

## Account transport

Wind/seismic retain the existing allowlisted header connection and add an explicit user-opened top-level account connection window at www.linkoteq.com/account/tool-session. The popup's login return stays within that callback, rather than falling back to the blog dashboard. Client login can also return to the validated callback without granting access. The account authority checks the exact server entitlement before returning a session.

The caller checks exact authority origin, source Window, selected tool, a freshly generated256-bit nonce and session expiry. The authority accepts only enumerated old/new tool origins. Only the existing access token is sent via target-origin postMessage; no refresh token, URL bearer token or persistent tool-side token storage is introduced. Tokens remain in tool memory and API authorization is checked for every protected operation. Expiry and local tool sign-out clear that memory. Popups may require browser permission; the UI reports blocked windows. Periodic server verification remains. Full identity/role-browser matrix, cross-device/global logout semantics and independent GPT5 security acceptance remain unverified; do not claim a certified SSO architecture or new audience-bound token issuer.

Header Sign In actions on wind/seismic route into the same account connection. Exact old/new origins are added to the session bridge, CSP, entitlement CORS and tool-surface theme map. Snow/W-Section behavior is preserved. Host redirects keep wood/concrete out of separate www-session storage partitions.

## Factual wood reference records

Canadian records:8 selections, four species groups × Select Structural / No.1-No.2, taken from NLGA2025 para851, printedp276/PDFp280. Only fb,fv,fcp,E are transcribed. E is explicitly converted GPa→MPa. Current Hem-Fir(N) values reflect the2025 revision; the old11.0MPa bending value is not silently retained.

US records:11 selections, Hem-Fir(N), Red Alder, Douglas Fir-Larch(N), SPF. Hem-Fir(N)/Red Alder use AWC's NDS2024 Supplement addenda (March2025 / February2024); Douglas Fir-Larch(N)/SPF use the explicit U.S.-market NLGA2025 para902 table, printedp293/PDFp297. Canadian and U.S. market values are separate records, not unit-converted copies. This is an initial subset, not an exhaustive species/product catalog.

Sources:
- https://nlga.org/wp-content/uploads/2025/11/NLGA-ENG-Grading-Rules-2025-small.pdf
- https://awc.org/wp-content/uploads/2025/03/2024-NDSSuppAddendum3.27.25.pdf
- https://cwc.ca/publication/reassessment-of-design-values-for-hem-fir-n-dimension-lumber-canadian-market/

Selection fills reference properties and provenance. The protected website proxy resolves the record again server-side and ignores supplied replacement values for a selected record. Applicable user-declared property adjustments remain explicit, as in the existing engine contract; the new catalog is not a new adjustment-factor engine. Catalog US scope is dry untreated normal-temperature edgewise dimension lumber, actual thickness1.5–3.5in and depth≤11.25in; no increased size/repetitive-member factor is assumed automatically. Other sizes require documented manual material input. CA remains the existing38mm framing/depth/bracing pilot. Custom/manual inputs remain visibly distinct and retain their original source requirements. Record/category changes invalidate old results and reference controls are read-only in catalog mode.

## Verification and outstanding gates

New tests cover tool/origin/state/window/expiry validation, callback destination validation, country separation, exact material reference fixtures, GPa conversion, updated Hem-Fir properties, tampered catalog data and unsupported geometry. Existing access-policy tests, TypeScript, SEO and production builds remain release checks. No successful real-account mobile/desktop login roundtrip is claimed without a browser fixture. No new full-engine certification is claimed. CSA2024 concrete flexure and NBCC2020 engineering release holds remain as previously documented. Core model writeback and official PDF remain outside this Beta change.

## Retest / rollback

After deployment and DNS readiness: open each custom URL; verify wood/concrete canonical redirects; on wind/seismic use Connect or header Sign In, sign in through the top-level connection, verify the calculator opens without returning to blog; verify no-grant/expired/revoked users stay blocked; run one permitted reference case; switch wood country/species/grade and verify reference values/units/source and clearing of previous results; test Android Chrome and desktop rotate/zoom. No secret-bearing traces should be published.

Rollback the affected frontend deployments to their preceding recorded commits if account connection fails. The original tool URLs, API endpoints and server entitlement checks remain available. DNS changes do not require deleting existing www/apex/mail records. Keep engine changes outside this application rollback.
