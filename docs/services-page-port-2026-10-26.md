# Services page and mobile navigation

Source: original local http://poblancer.local/services/, both archive pages captured 26 October 2026; Freeio post-type source confirms show_in_rest=false. Original archive template 8855 and browser DOM/CSS inspected. No WordPress code, settings, records, hook names or ecommerce operations changed.

## Implemented

React /services with shared compact header/footer, original branded banner, source copy and video, four-column card grid, featured labels, prices/reviews/authors, original sort options, category/date/response/delivery/budget/English/region/location/distance fields, and pagination. Original distance setting is miles. Client controls call /api/public/services; no theme scripts are loaded. The endpoint accepts bounded known Freeio query keys only, fetches a fixed public local archive destination without user cookies, parses structured data and discards scripts/nonces. Five-minute public source caching avoids theme execution for repeated queries/navigation. Precise location queries bypass shared caches and return private no-store responses. Initial static snapshot supports local offline builds, as on the homepage/About.

Known listing images copied as frontend static assets; unknown new image paths retain the original source URL. WordPress remains authoritative for filtering, sorting, visibility and formatting. No client-side commission/payment calculations added. Original category and individual service/freelancer destinations remain native WordPress; save icons explicitly link to the service page to use its native save action, rather than claiming a favorite was saved. Full authenticated favorite toggling in the public React grid is not part of this page port. The public read adapter is intentionally outside the authenticated workspace endpoints and cannot submit orders or change records.

Shared mobile menu now uses the brand #e1deff to #bbb6f4 gradient, navy text, white hover/focus text on navy, visible nested-menu indicators, bounded scrolling and keyboard/native details behavior. Homepage About and Services menu destinations resolve to React. Other public pages remain native pending their migrations.

## Verified

Eight focused public-content and query-security tests pass. Production build passes. Live React filter request for AI Services returns the single source result. Reset restores 12 of 18 records. Live page 2 returns the remaining six listings (13-18) without leaving React. Mobile 390px has no horizontal overflow. Menu gradient computed to the exact brand stops; hovered menu summary computes white; ordinary links compute navy. Default source display remains 12 records and two pages. Original banner geometry was measured at 343.5px high at a 1280px viewport; final spacing follows those dimensions.

No write/action endpoints invoked, GPS permission requested, orders submitted, Make/Slack/ClickUp notifications sent, or load testing performed. Browser screenshot file persistence remains unavailable (EPERM in previous attempts); preview link is the visual review artifact.

Final visual verification: production build passed and managed preview restarted. Source-matched banner height is 343.5px; background is centered, cover-sized and fixed on desktop, matching the original crop. Card width is 290px at 1280px viewport. Final preview retained at http://poblancer.local:3103/services.
