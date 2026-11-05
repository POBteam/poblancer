# POBlancer development handoff

Updated 30 October 2026. Local development checkpoint, not a production release.

## Architecture to preserve

Next.js renders the public website, authentication interface and workspace. The same-origin server API forwards narrowly allowed operations to WordPress. WordPress, Freeio and WooCommerce remain authoritative. Do not introduce a second marketplace database or reproduce commission calculations in React. Preserve native action/filter names, account roles, registration fields, collaboration agreements and earnings allocation records. Automatic payout splitting is not implemented.

The source WordPress plugin is packaged in `backend/poblancer-workspace/`. The local authentication MU plugin is in `backend/010-poblancer-next-bridge.php`. The main workspace source outside this repository remains `../poblancer-workspace`; run `node scripts/sync-backend-package.mjs` after updating it. Do not commit the WordPress installation or database backup.

## Latest changes

- Employer and freelancer profile Message/Contact Me, Save, Report and Review controls use in-page React dialogs and authenticated native backend adapters.
- Project proposals use the native Freeio proposal handler. Authors, fees, notifications and records are not supplied by React. Closed/own/unpublished targets are rejected before delegation.
- Job application UI supports the native internal/email handlers, own saved CVs and CV upload. External applications deliberately retain the employer's configured external destination. CAPTCHA-enabled application/report states currently require further UI integration and do not bypass verification.
- Service package selection and a React digital-order checkout are implemented against native Freeio hiring, WooCommerce review and checkout handlers. The currently enabled bank-transfer gateway is supported. Other gateways and shipping orders are not supported by this new checkout yet.
- Old archive aliases and taxonomy links route to React with author/category/location filters retained. Intentional social links, uploaded files, employer external applications and administrator tools are separate from old frontend handoffs.
- Additional service/profile video portfolios support uploaded MP4/WebM and provider links. Provider-controlled branding/links cannot be guaranteed absent. Up to 12 ordered portrait/landscape clips are stored in dedicated WordPress post metadata, with ownership and revision checks.
- Seller tabs render one active panel, switch role-specific videos, use role-specific signup buttons and omit the repeated freelancer phrase. The requested global skip link was removed.
- Public listing metadata now derives its title/description from WordPress content. All previews remain noindex; production SEO activation, redirects and sitemap checks remain a release gate.

## Synchronization and resource use

Relevant WordPress post/meta/term/comment updates queue a signed cache invalidation at request shutdown. `/api/revalidate` accepts only short-lived HMAC-signed approved tags. Secrets remain in server configuration and a non-autoloaded WordPress option, never in browser code. The local connection has been configured and a signed update was accepted by the running React preview.

The next page request can then fetch fresh WordPress content. Existing open browser tabs do not receive live push updates. The five-minute cache schedule remains a fallback; saved snapshots can still be shown when WordPress is unavailable. Snapshot fallback freshness must be made visible to administrators before release.

Public cached reads avoid PHP on every page visit. Authenticated reads and submissions still need trusted backend processing. No new production-capacity claim is made. Preserve the previous measured local capacity results and test a representative isolated environment before claiming 1,000 concurrent authenticated users.

## Verified versus unverified

Build and TypeScript checks passed. Navigation, policy preservation, contact/feedback forwarding and signature validation tests passed. The native disposable-fixture guard suite passed 14 checks without sending proposals, messages or payments; portfolio checks also passed. Browser checks confirmed the in-page contact composer and the Hiring tab content, employer video and employer registration URL.

Actual new application/message/review delivery, service purchase, order placement, bank-transfer confirmation, asynchronous Make/Slack/ClickUp delivery and additional payment gateways have not been exercised end to end in this pass. Do not label them fully verified on the strength of compilation or guard tests. Use isolated fixtures with outbound delivery controlled before financial acceptance testing.

Remaining handoffs include CAPTCHA/social sign-in, some login/registration recovery links and the pilot dashboard fallback. Migrate these without removing security verification or silently routing a button to an unrelated page. Audit dashboard response HTML and dynamic notifications as well as static public links.

## Git and hosted preview

A private development checkpoint can be prepared from this Next.js directory after reviewing the commit contents. Exclude `.env.local`, credentials, database backups, runtime logs, saved browser sessions, `node_modules`, build outputs and private test artifacts. The ignore file covers known generated directories; it does not replace a review of the proposed commit.

An imported frontend needs a runtime supporting Next.js server routes and secure cookies. A hosted preview cannot reach `poblancer.local` on this computer. Configure an isolated HTTPS WordPress staging origin and approved frontend origin, with a separate signing secret and tested cookie/domain settings. The current MU bridge deliberately allows only the local site and must not be deployed as if it were production-ready.

Do not replace the live database with the old local backup: new live users, orders and messages would be lost. A release should deploy versioned code/assets, approved configuration and any narrowly scoped data migration, with a current backup and rollback plan that preserves new records.
