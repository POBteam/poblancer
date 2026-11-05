# Projects public page

The React `/projects` archive preserves the original local WordPress heading, description, background photograph, six listings, employer logos, formatted prices, seven filter groups, ordering and proposal destinations. Public source captured from `http://poblancer.local/projects/` on 26 October 2026. Shared navigation now opens this React archive.

The bounded server-side HTML adapter reads the existing public Freeio archive with approved query keys, a 15-second timeout and five-minute cache. No credentials or guest nonces are sent to the browser. Snapshot fallback is used when the local source is unavailable. WordPress remains authoritative; project details, saving and proposal submission still use original native pages. No transaction or hook names were changed.

Services retains the exact original YouTube video `6w_xxOkFmtQ`. The lazy modal iframe now explicitly sends a cross-origin referrer, with a direct YouTube fallback link. Opening the modal and actual playback of the original POB Academy video were verified in the browser.

Validation: production build passed; eight existing public-page tests and three new Projects/video adapter tests passed. Browser verified six original records and a live Shopify search returning the single matching project. Desktop banner compared against original. Full mobile visual parity and proposal transactions have not been verified in this change. No concurrency claim is made.
