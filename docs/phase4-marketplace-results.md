# Marketplace and collaboration integration results
21 October 2026

## Verified local suites
| Suite | Passed checks | Evidence |
| --- | ---: | --- |
| Previous session/profile/upload suite | 28 | ../test-results/phase4-local.json |
| Service plans and quotas | 15 | ../test-results/plans-proxy.json |
| Collaboration and earnings allocations | 42 | ../test-results/support-proxy.json |
| Employer marketplace/contracts/withdrawal records | 28 | ../test-results/marketplace-proxy.json |

These are 113 assertions across the four suites, not 113 complete browser journeys. The three new suites executed 85 checks. Mutations used the Next proxy with native disposable-user session cookies and nonces. Some read-side assertions inspect stored records or call existing PHP readers directly. The source WordPress business logic was not replaced.

Service coverage includes preview, quota exhaustion, publication approval status, repeated submission and expired-service relisting. The original submission-hook delivery count is not instrumented across PHP HTTP processes; no exactly-once external notification claim is made.

Support coverage includes both eligible POB freelancer classes; exclusion of independent freelancers; existing WhatsApp eligibility; admin-confirmed dates; 60/70/100-percent signals; duplicate-alert suppression; declines/offer revision; counteroffer selection; explicit acceptance; changed earnings basis; 100-percent allocation limit; privacy; delivery; disputes; audit records. Earnings allocations remain records, and do not automatically split payouts. Deadline signal tests use controlled times; simultaneous competing requests were not stress-tested.

Marketplace coverage includes hiring cart/checkout preparation, correct employer/price, meetings and ownership, application approval, job/project preview and quota consumption, native contract history/completion and linked fixture earnings, payout settings, a disposable withdrawal request and retry deduplication. A checkout URL or cart is not a successful payment.

## Safety and cleanup
A new private SQL safety snapshot preceded these suites (278,054,162 bytes; 215 tables; completion marker and SHA-256 manifest). No schema installation or migration ran. Local external HTTP, email and gateway isolation remained active. No gateway transfer or external message was sent.

Fixture users, posts, support rows, cron checks, native sessions and test WooCommerce sessions were removed. Each suite reports successful cleanup. An independent read-only check found zero users with the fixture prefixes. Existing order currency was read for a disposable support assignment; the real order itself was not edited.

## Remaining acceptance gates
- Successful native registration, approval and social/CAPTCHA flows with automation exactly-once evidence.
- Real SMTP, Slack, ClickUp, Make and Zoom delivery under a deliberate staging test.
- Payment-provider sandbox callbacks, cancellation/refund/reconciliation and recovery.
- Parallel agreement selections, concurrent withdrawals and interrupted/retried requests.
- Full browser happy-path submission tests and desktop/mobile screenshot acceptance.
- Backup restore rehearsal, Cloudflare runtime/cookie/cache/SEO verification and controlled load tests.

This is substantial Phase 4 coverage, not production sign-off.

## Concurrent-operation follow-up
The 32-check concurrent-mutations suite now verifies same-revision profile/progress writes, competing support selections, the 100-percent cap after refresh, duplicate agreement confirmation and original payout preservation. It also compares independent native workspace/support responses with an interleaved five-actor batch, excluding only clock/generated timestamps.

The 19-check plans-concurrent suite includes the earlier plan coverage plus two services competing for one remaining quota slot and parallel retries of the winning service. Exactly one slot was consumed.

The 32-check marketplace-concurrent suite repeats the native marketplace baseline and adds concurrent same-key withdrawal deduplication and different-key requests competing for the same remaining fixture balance. Only one competing amount succeeded. No real funds moved. All fixture cleanup passed.

Support-scale now passes 51 checks including the exact 60-percent boundary, quiet assignments, early offer-review/dispute exceptions, ownership before the case limit and rotating bounded scans. The quiet-case prefilter changes work performed, not notification thresholds or earnings calculations.

These supersede the earlier statement that parallel agreement/withdrawal requests were entirely untested. Longer races, interrupted delivery and actual provider reconciliation remain open. These are overlapping assertion suites, not independent complete browser journeys.

## Native notification and edit parity follow-up
The temporary fixture-only MU recorder counted callbacks across the actual HTTP processes, using locked append records containing hook names and disposable identifiers only. It did not replace handlers or permit external delivery. Its per-fixture moderation filter exercised both published-edit policies without writing WordPress settings. The recorder/filter was removed after validation; source remains under tests/fixtures for deliberate reuse.

- **plans-hooks.json, 25 checks:** preview and rejected quota emit no completion event; a successful quota submission emits the native package and done callbacks once; sequential/parallel retries do not redispatch; a genuine expired-service relist emits one new event.
- **native-cookie-flow.json, 24 checks:** each service/job/project preview returns its real notice cookie; the publication request carries it to the native callback, clears it afterward and reaches exactly one blocked configured mail attempt. Retrying does not redispatch. The failing pre-fix report records one completion callback but no marker/mail attempt. The fix admits only the three exact marker cookie names and new/update values.
- **listing-edit-parity.json, 46 checks:** service/job/project edits use Freeio's existing edit classes. Tests cover unrelated same-role users, invalid nonce, original dates, unchanged quota count, edit callbacks and both publish/pending_approve outcomes. Configured service/project update notices reached the blocked mail boundary; the existing disabled job update notice stayed disabled. The previous submit-class adapter omitted these edit-specific hooks and moderation behavior.
- **messages-proxy.json, 28 checks:** participant-scoped lists/threads, explicit read state, native replies, sequential/parallel retry deduplication and callback counts, throttling, oversized input, paginated history and recoverable Trash. WordPress untrashes the fixture to Draft; explicit native republishing restores visibility. The UI confirmation now explains that administrative recovery step.

All fixture cleanup reports passed. The editor displays the authoritative publication/review status. No original SMTP/webhook configuration, financial calculation or public-site page was changed. These tests verify dispatch boundaries, not SMTP, Make, Slack or ClickUp delivery.

## Saved selector values
Read-only browser inspection of the real service confirmed a location mismatch: a scalar select stringified an array of location ancestors and showed Select. The schema now supplies selected_value using the deepest stored term while retaining the complete value array; the browser now shows Lagos. A separate defensive guard displays missing legacy scalar options verbatim instead of replacing the model value. The package delivery values were checked directly: 5 Days, 12hrs and 12hrs are the actual stored choices and were left unchanged, even where descriptive text mentions other durations. Four targeted selector tests passed; the complete Node suite now passes 18 checks. No real service was saved.


## Draft resumption, 2026-10-21

Fixed the native form adapter selection for unsubmitted draft services, jobs and projects. Drafts now use Freeio submission forms; published and moderated edits retain the native edit forms. Drafts and previews missing a package expose package selection; selected previews reopen at their fields. No business calculations moved to React.

Verified by tests/draft-resume.php: 42 assertions over three listing types and draft/preview starting states. Same-record save, selected quota persistence, zero quota use at preview, native approval on submission, one quota use and retry without additional use all passed. Disposable users and posts cleaned up. External delivery and payments were not executed. Node tests: 18 passed.

User clarified that development and functional validation remain local. Hosting inspection was read-only and is not evidence of the optimized local implementation. No staging creation or live changes were made.

Production build and TypeScript checks passed after keeping the source backup outside TypeScript file extensions. Local preview restart requested through its managed control file.
