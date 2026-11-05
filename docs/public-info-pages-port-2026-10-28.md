# Public information pages, 28 October 2026

## Scope
React routes: /become-seller, /contact, /terms, /privacy-policy, /faq and /refund_returns-2. Existing seller copy, tabs, categories, images, counters, FAQ, contact details and policy text are reused from the local source. The source seller team section is hidden at desktop, tablet and mobile sizes; the React page preserves that visibility instead of displaying template staff.

## Footer and navigation
The shared footer now routes all internal links to React. Project, job and service category links use IDs verified against the original filter choices. Support/legal links open the new React pages. Social destinations remain their original external URLs. Header Contact and Become A Seller links are local React routes. Recognized internal links in parsed page content also resolve to React.

## Contact integration
React posts the original three field names (form-control, your-email, your-message) to the same-origin /api/contact adapter. The server reads the current public contact form metadata and forwards to the fixed existing Contact Form 7 form 1726 feedback endpoint. Existing plugin validation, mail handling and submission hooks remain authoritative. No SMTP details or privileged credentials reach the browser. The adapter validates origin, size and fields, includes a honeypot, bounds request reading, and has a process-local submission guard. Production still requires edge-level abuse controls. No automatic retry is performed.

## Verification
- Production compile, type checking and generation of all six information routes passed.
- Eight focused content/contact/detail regression checks passed.
- Policy body tests verify every original word survives migration after whitespace normalization.
- Contact tests reject cross-origin and invalid input and mock the upstream calls to verify the exact handler and field names. No email was sent; real mail delivery remains untested.
- Browser checked seller tab switching, hidden team visibility, footer destinations, contact desktop layout and responsive form fields.
- Browser checked contact, seller and privacy at 390 by 844 without horizontal overflow. Viewport override reset afterward.
- All 18 footer category links and six support/legal links use React paths; external social links preserved. Source Business project filtering returned three records.

## Safety and remaining scope
No WordPress files, settings, database, SMTP records, payment, collaboration, earnings or webhook hook names were modified. No production deployment or load test was performed. Existing backend mutation handoffs on marketplace detail pages remain as documented in their earlier ports. Contact delivery must still be confirmed with a user-approved real submission before production release.

## Review corrections
The FAQ wrapper previously shared the info-faq class with its inner section, applying the accordion width cap to the whole page. The wrapper now uses an info-page prefix. Browser verified header/page widths match the viewport and the accordion remains centred at 950px maximum. Service listing bodies now use 22px horizontal padding (18px on mobile), including category-filtered results. Both agreement PDFs were copied byte-for-byte from the original local uploads into public/downloads. Terms links map to those bundled files for all recognized source domains. Both preview downloads returned HTTP 200/application-pdf and matched their source bytes; checksums are recorded in agreement-downloads-2026-10-28.json. No backend settings or document contents changed.
