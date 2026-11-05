# Dashboard React coverage
## Implementation increment
Local preview: http://poblancer.local:3103/workspace
All recognized dashboard routes now dispatch React components. Workspace no longer imports LegacyScreen. Original browser modules remain preserved, but only the on-demand Leaflet map helper is reused by the editor. Registration continues to render the native Freeio form contract inside React as previously documented.

| Area | Routes | Current checks |
| --- | --- | --- |
| Overview | overview | Existing statistics and page views verified earlier; both role overviews opened during role switching |
| Services/projects | listings | Freelancer real listing, search and cancel removal verified earlier; employer listing page verified |
| Submission and plans | service-editor, job-editor, project-editor | Freelancer quota plus three plans; full service form; employer job (29 controls) and project (26 controls) forms rendered |
| Add-ons | addons | Empty/list view, new form fields and cancellation; no save or trash executed |
| Messages | messages/:id | Existing conversation, search and removal cancellation verified earlier; both roles render |
| Meetings | meetings | Both roles render; scheduling and Zoom delivery untested |
| Employment | jobs, applicants, project-proposals | Jobs/applicants empty states rendered as employer; populated proposal/hiring actions untested |
| Orders | bought-services, service-orders/:id | Employer bought-services empty state; freelancer 12 real order records |
| Contract history | contract/:kind/:id | Existing service contract 11399 displays agreed details and attachment composer; project contract and status/message mutations untested |
| Saved records | favorites | Five entity tabs; freelancer filter changed successfully |
| Proposals/applications/alerts | proposals, applied, alerts | Freelancer pages render; editing/removal mutations untested |
| Finance | statements, payouts | Four earnings cards; withdrawal form; PayPal and bank tabs with six bank fields; no financial writes executed |
| Verification | verify | Existing five input/document fields rendered; uploads and revocation untested |
| Profiles | profile | Freelancer 23 controls/five repeatable sections; employer 18 controls |
| Sensitive account tools | change-password, delete-profile | Fields and required deletion confirmation rendered; no submissions |
| Linked roles | switch-role | Freelancer to employer and back succeeded; returned to freelancer |
| Collaboration | support | Real empty state and read-only populated primary demo; all demo action buttons disabled; no support writes |
| WhatsApp | Existing backend eligibility HTML | Preserved at workspace level |

## Verification limits
Production compilation, TypeScript and six transport tests pass. Browser checks above used the actual 566px viewport, with no document-wide overflow observed on the visited screens. This is not a full desktop/mobile matrix or screenshot sign-off.

The UI implementation is broader than the executed regression coverage. Existing backend methods, ownership checks, optimistic revisions, idempotency, checkout redirects, payment logic and webhook integrations were reused, not reimplemented. Successful saves, upload ownership, competing collaboration actions, financial operations, external delivery, expiry, two unrelated accounts, and retry recovery require isolated Phase 4 fixtures. Do not mark Phase 4/5 complete based on these checks.

Screen modules are split with next/dynamic and loaded on navigation. Support notices retain the original visibility-aware 60-second refresh; no extra per-screen polling was added. Backend GET side effects are not removed. No concurrency or CPU-reduction claim is established.

Public homepage migration remains Phase 6, after dashboard acceptance, and must reproduce the current design, content, video, navigation and URLs.


## 21 October integration update
A 28-check disposable-fixture suite now verifies native authentication/expiry, API security, addon CRUD/ownership, both role profile saves and stale edits, education/video persistence, multipart uploads/media ownership, and SQL-bounded location queries through the Next proxy. All fixtures and upload files were cleaned up. See ../test-results/phase4-local.json.
The two flat taxonomy pickers were corrected to hierarchical=false after a reproducible profile memory failure. The 60-option contract, selected options and search are retained.
Financial operations, external SMTP/webhook delivery and collaboration race tests remain outside this completed subset.

## Current integration evidence
Later suites now cover fixture financial records, competing support/profile writes, quota races and withdrawal deduplication/balance races. See phase4-marketplace-results.md and release-gates.md. A real React service form saved an unpublished preview with package, FAQ, description and video; direct persistence passed and the exact test record was moved to recoverable Trash. It was not published.

Support polling is now single-flight, visibility/edit/demo aware, initially spread across 45–60 seconds, with a 15-second request abort and 60 seconds between completed refreshes. Audited overview/support reads use the exact-local signed batch transport; their native alert/transient behavior remains intact. Form submissions retain the native path. No full production capacity or overall CPU-reduction claim follows from these changes.
