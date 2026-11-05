# POBlancer release status, 31 October 2026

Status: local development source handoff. Not approved for live replacement.

## Verified evidence

- Latest full Node suite: 72 tests passed.
- Latest support native suite: 54 checks passed using disposable records, including the combined schedule/offer/invitation transaction and rollback on invalid invitees.
- Portfolio native suite: 18 individual PASS results. Its TOTAL counter incorrectly prints zero; do not quote that total as evidence.
- Production build and TypeScript passed during this work; the final package is source, not compiled output.
- Signed-in browser: freelancer search returned Bayopob and POB Tutorial, and selecting Bayopob displayed the invitation tag without sending an invitation.
- Support flow now exposes job selection, dates, separate supporter target date, client communication, scope, share and recipient in one form. Support target date is recorded in the agreed scope; it does not replace the client's deadline or independently run deadline automation.
- Map diagnosis: Freeio's Leaflet bundle had a corrupted `hasOwnListing` identifier. The local frontend copy restores `hasOwnProperty`. Original theme files were not modified. Local assets preserve the bundled library and its license text.
- Browser map verification: map opens, eight map tiles loaded, Lagos search returned results, confirmation populated 6.455057 / 3.394179. A temporary service retained those coordinates after reload.
- Temporary service 37895 saved two provider video links, normalized YouTube Shorts, saved a reordered sequence, retained both after refresh, and rendered its gallery on the public React service page. Clicking the YouTube gallery tile created the iframe in a dialog. This establishes player creation, not uninterrupted media playback.
- Temporary service was returned to preview rather than left publicly listed. No existing service record was edited for this check.
- Desktop seller page: header-to-hero gap measured zero and horizontal overflow measured zero after removing the hero margin.

## Incomplete acceptance checks

- Full mobile/tablet map interaction, marker dragging, tile/search outage simulation, all upload-format cases, and fresh image upload persistence remain unverified.
- Existing portfolio editing has separate save controls and appears after the main service form. A new service must be saved before portfolio links can be attached. This does not yet satisfy a seamless unsaved-service Media field workflow.
- The Instagram test link was a format-valid sample, not verified playable content. Instagram embeds depend on the post and provider restrictions. A labelled external fallback is included.
- Public service page currently shows the seller's existing location; public display of the service's precise saved coordinates needs review before enabling it. Never publish more precise location than intended.
- Before-and-after screenshot files were not successfully delivered in this pass. The user's supplied before images and browser measurements are not substitutes for a full screenshot acceptance set.
- Live contact/feedback delivery, registration/provider/CAPTCHA acceptance, message notifications, review/application/proposal delivery, complete checkout and payment confirmation, and Make/Slack/ClickUp side effects require controlled end-to-end acceptance.
- Homepage article links and native login/recovery fallback routes still use the original frontend. Not every link is migrated.
- Workload auto-reply/waiting-list code is implemented but lacks full multi-account end-to-end acceptance. It handles new conversations; delayed replies in existing conversations are not implemented.
- Hosted authentication is not configured. The bundled MU bridge is intentionally local-only. Production browser sessions and origins cannot be assumed to work merely by changing environment variables.
- Reliable 1,000-user concurrency, a particular CPU reduction, Cloudflare compatibility, and production SEO activation are not established. Prior varying local measurements are preserved in capacity-local-results.md.

## Location search deployment restriction

The local search route reuses the original Nominatim provider with explicit searches, a small cache and an in-process rate limit. It is deliberately disabled outside the local hostname. Nominatim limits aggregate application traffic to one request/second; a hosted deployment requires a configured suitable provider and a shared limiter. This local process limiter is not a multi-instance production solution. See https://operations.osmfoundation.org/policies/nominatim/.

## GitHub and hosting

Use the clean source folder packaged beside this report for a private development repository. GitHub is version control, not proof that hosting/authentication/payment work. See GITHUB_STEPS.md and MIGRATION_PACKAGE_README.md. Keep secrets and the full WordPress backup outside Git.

Deploy backend plugin changes and the frontend separately in isolated HTTPS staging first. Retain all required Freeio/WooCommerce plugins, theme dependencies, media and existing automation snippets. Never replace the current live database with an older local backup. Deploy reviewed code to the current data after acceptance, with a fresh backup and rollback plan.
