# POBlancer source handoff, 30 October 2026

This is a private development checkpoint, not approval to replace the live website.

## Current audit evidence

- 72 automated frontend, adapter, filtering, authentication transport and cache-signature tests passed in this audit. These include saved-content parity, not live submission delivery.
- The latest support run passed 49 native disposable-fixture checks; four deadline/allocation checks passed. Financial records were not changed.
- Browser checks at 390px covered home, About, Services, Projects, Jobs, Employers, Freelancers, Become a Seller, Contact, FAQ, Terms, Privacy, Returns, Login and both registration roles. All 16 had no document-width overflow and no broken loaded images. This does not certify every interaction or every breakpoint.
- That browser pass exposed native category links in header/service/job cards. These were changed to the shared React link mapper.
- Homepage article links, original-login fallback and password recovery still hand off to the original frontend. Blog article pages are not migrated. Do not claim every link stays in React yet.
- New enquiry capacity replies and waiting-list controls are implemented but have not passed end-to-end multi-account delivery tests. Delayed replies in existing conversations are not implemented.
- Admin portfolio editing is included, but native admin save/React refresh needs acceptance testing. Do not advertise this as fully verified.

## Backend authority and updates

WordPress, Freeio and WooCommerce own users, jobs, proposals, orders and earnings. The Next server forwards approved requests with the current user's session. React never connects to MySQL or holds an administrator API key. Preserve native hooks and existing Make.com automation snippets.

WordPress content changes issue signed invalidations. Freshness occurs on subsequent reads; open tabs do not receive live push. Public cache fallback is five minutes. Saved content may be stale when WordPress is unavailable. Private data must never use shared public caching.

## Before production

1. Complete controlled end-to-end registration, messaging, contact, feedback, review, application, proposal and checkout tests with outgoing integrations isolated.
2. Verify native hooks and Make/Slack/ClickUp delivery in staging. Only bank transfer is currently supported by the new checkout; other gateways/shipping need integration.
3. Complete CAPTCHA/social login and password-recovery integration. Keep existing checks in place.
4. Finish blog routing, admin portfolio acceptance and capacity/waiting-list tests.
5. Configure production authentication: the included MU bridge is deliberately local-only. It cannot simply be uploaded unchanged.
6. Validate responsive detail/dashboard interactions as both roles and test account isolation.
7. Run a representative staged workload. Earlier local results varied and do not prove reliable 1,000-user capacity or 90% CPU savings. See capacity-local-results.md.
8. Confirm canonical URLs, redirects, sitemap, robots and removal of preview noindex only for the production frontend.

## GitHub Desktop instructions

Extract the source ZIP. Open GitHub Desktop, choose File > Add Local Repository and choose the extracted folder. If prompted, create a repository there. Review changes before the initial commit, commit, then Publish repository with **Keep this code private** selected. Never include .env.local, database dumps, WordPress backups, sessions or passwords.

This archive deliberately omits runtime/build directories, recovery scripts, private test outputs and a credential-bearing legacy browser test. It contains public WordPress content snapshots, which should remain in a private repository until reviewed. No GitHub upload has been performed.

To continue with an editor, clone that private repository. Preserve backend adapters, API contracts, native hook names and server-only secrets when changing UI. A UI tool must support the existing Next server routes; exporting static HTML alone will not run this application.

## Hosting plan

The frontend and backend are two deployments. Ordinary PHP-only file upload does not run this Next application. Use a supported Next.js server runtime and an HTTPS WordPress backend reachable by it. Cloudflare requires a compatible Next adapter and validation; it is not configured by this archive.

First create an isolated staging copy with outbound mail, real payments and webhooks controlled. Deploy the packaged workspace plugin to that staging WordPress installation, retaining Freeio, WooCommerce, uploads, custom snippets and all other required dependencies. Configure approved frontend/backend origins, server secrets and production-safe session handling. Configure signed revalidation separately. Never put secrets in NEXT_PUBLIC variables.

The archive is not a full WordPress backup and does not contain its themes, dependencies, uploads or database. Use your full backup to establish staging, then deploy only reviewed code/configuration changes to the current live database. Never overwrite today's live database with the older local copy: that loses later users, orders and messages.

After the release gates pass, take a fresh production backup, deploy versioned backend changes, deploy the frontend, configure domain routing and SEO redirects, and perform controlled smoke tests. Retain rollback code and preserve newly created records during rollback. Do not change DNS or replace the live site from this development checkpoint.

## Support workflow update

The real open-offer board now includes username/display-name search and targeted POB-team invitations. Invitations create dashboard notices, not assignments. Existing interest/counteroffer, primary selection and explicit supporter confirmation remain mandatory. Duplicate notices are suppressed. Seven additional native tests cover directory eligibility, private-email exclusion, invitation ownership, deduplication and no premature assignment. The editable practice screen is browser-only sample data and does not prove live notification delivery.
