# POBlancer source checkpoint

Start with [GitHub steps](docs/GITHUB_STEPS.md) and [release status](docs/RELEASE_STATUS_2026-10-31.md). This is a private local-development checkpoint, not an approved live migration.

# POBlancer Next.js local pilot

Separate canonical Next.js 16.4.2 / React 19.3.1 frontend. WordPress, Freeio, WooCommerce and the existing workspace plugin remain authoritative. This is an incremental migration, not a completed production cutover.

## Run locally

Start the POBlancer site in LocalWP first. From this folder:

```sh
npm ci --cache .npm-cache --ignore-scripts
npm run build
npm start
```

Open **http://poblancer.local:3101/workspace** or **http://poblancer.local:3101/login**. Use this hostname, rather than 127.0.0.1, so native WordPress cookies and checkout share the same hostname. No hosts-file changes are required beyond the existing LocalWP domain. The server binds to loopback only.

The optional .env.example documents configuration. Do not put secrets into NEXT_PUBLIC variables. The bridge intentionally accepts only the exact local origins and cannot run on production.

## Architecture

- Next statically serves login, registration entry, dashboard shell, CSS, fonts and copied browser modules.
- React renders login, navigation, statistics, overview, private-session lifecycle and alert host.
- Transitional DOM islands reuse completed JavaScript view modules for services, plans, profiles, messages, meetings, collections, finance, contracts and project support. These modules are not claimed to be fully ported React components.
- Same-origin /api/wp forwards only explicit workspace endpoints and WordPress media upload. It carries the requesting user's cookies and nonce, not privileged credentials.
- A separate local-only MU plugin supplies session/nonce bootstrap and wp_signon transport. It is stored in backend/ and copied to this site's mu-plugins directory. Existing workspace PHP files are unchanged.
- Registration now runs inside the Next interface using the exact server-generated native Freeio/CMB fields and native registration callback. CAPTCHA or provider flows needing their original scripts retain an explicit native handoff. Successful real account creation and external delivery remain staging checks.
- Checkout, public pages, administration and existing integrations remain native WordPress.
- No automatic earnings settlement was added. Original payment and commission rules remain unchanged.

The copied management.js changes only its successful role-switch destination to /workspace. The remaining view modules are copied from the source baseline. globals.css preserves the original CSS, with local font handling and narrow local-layout additions. Original CSS/fonts remain available in public/legacy.

## Tests and limitations

```sh
npm test
npm run typecheck
npm run build
```

Six tests cover dashboard-link mapping, endpoint allowlisting, origin restrictions, cookie filtering and return-path restrictions. Browser checks verified real freelancer login/logout, role switching, real statistics and selected freelancer/employer screens. GETs were used only after saving the local database baseline; workspace/support reads may write alerts/transients as documented.

No marketplace record, payment, withdrawal, support agreement or registration was submitted during these checks. Browser login/role switching does change authentication sessions. External delivery remains disabled by the original local isolation plugin.

Still required: successful-account/provider staging checks, pure React field/view ports of transitional screens, cross-account authorization regression, expired-session/nonce renewal, retry/financial staging tests, mobile viewport checks, a backup restore rehearsal, public-site migration, Cloudflare adapter validation and capacity measurements. This pilot does not prove support for 1,000 users or a particular CPU saving.

## Baseline and rollback

outputs/migration-baseline in the parent project contains a database dump, checksums, the workspace plugin and pre-bridge MU plugins. The database dump has its completion marker and 215 CREATE TABLE statements; a restore rehearsal has not yet been performed. It is not a full new uploads/themes archive; retain the downloaded original backup.

To roll back the presentation, stop this Next server and use http://poblancer.local/pob-workspace/. Remove only 010-poblancer-next-bridge.php from this site's MU plugins if disabling the bridge. Do not overwrite the database with the snapshot after new user records have been created. Do not touch other LocalWP sites.

See the project-level migration roadmap and outputs/migration-progress.md for gates and remaining work. No production deployment is configured.


## Latest registration preview
Use http://poblancer.local:3103/register?role=freelancer for this increment. The team image appears only on freelancer signup; existing welcome copy and registration field definitions are retained.
The original http://poblancer.local/pob-register/?role=freelancer has the same compact team panel.

The development preview hit this Mac's file-watcher limit. Use the production preview instead:

    npm run build
    python3 scripts/local-preview.py

It serves only this project on loopback port 3103. A private .preview-control file accepts restart or stop to manage that launcher's own child, without controlling other projects. Build output uses .next-production; development output is separate.
Do not start a second copy if port 3103 is already in use.

The registration-parity.py integration check compares both native forms, rejects invalid CMB nonces and invalid registration data without creating accounts, and checks foreign-origin rejection. It requires the local WordPress site and this preview.
Freeio can return valid JSON with text/html headers; the transport normalizes that exact native callback after validating its response structure, and never forwards actual HTML errors as success.

Registration fields currently reuse native HTML inside a React-managed interface; individual fields are not yet a completely independent React schema renderer. Real account creation, email/Make/Slack/ClickUp delivery and a fresh mobile viewport sweep remain untested. Local isolation remains enabled.


### 20 October 2026 follow-up
The latest preview on port 3103 uses the exact user-supplied POB Academy banner on freelancer signup, fully contained at its original 3:1 proportions. Overview Page Views and My Services/My Projects now render as React components using existing backend endpoints. The remaining dashboard modules continue as transitional DOM islands. Employer listing visual checks and production load testing remain pending. The public homepage migration must preserve its original visual design and content.

Messages now renders in React against the existing messages endpoint, including filters, pagination, reply and trash-confirmation UI. Browser checks cover read/display/search/cancel flows at 566px; sending and deletion were deliberately not executed.

### Complete dashboard screen port
All recognized dashboard screens now render React components without mounting LegacyScreen. Screen bundles load on demand. See docs/dashboard-react-coverage.md for the route matrix and tested/untested boundaries. Source backend logic and payment/automation behavior remain unchanged.
