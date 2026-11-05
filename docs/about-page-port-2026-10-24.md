# About page React migration

## Source and scope

Original page: http://poblancer.local/about-v2/ (WordPress page 9946). Original public REST response captured on 24 October 2026, page-specific Elementor CSS read in place, and original browser DOM inspected. No WordPress settings, records, snippets, hooks, orders, authentication or earnings logic changed.

The Next.js route keeps /about-v2/. Homepage About navigation now points to this route. PublicHeader and PublicFooter were extracted from the reviewed homepage markup and reused. About uses its compact header variant. Other unported public destinations continue to use native WordPress.

## Preserved content

Team POB Academy banner; original introductory image, copy and three benefits; four labelled target counters (not claimed as live totals); three quality features and their original image; talent callout and three statistics; four complete client testimonials with their service descriptions, people and portraits; three process cards and original background; all ten FAQ entries; footer links and social icons. Existing externally branded freelancer CTA destinations are mapped to the equivalent local WordPress freelancer directory.

## Lightweight delivery

Public content is parsed into structured data and escaped by React. WordPress scripts and inline styles are not executed. The page is prerendered with five-minute shared revalidation. Only menu interaction, testimonial selection and the shared entrance/counter observer require client code. Original page images (8 files, 608755 bytes in total) and the exact original logo are served as static frontend assets. Below-fold images are lazy loaded. No new third-party UI dependencies.

A checked-in public source snapshot is available for local backend outages; server logs report when it is used. A successful public REST response remains authoritative on refresh. Asset mapping uses known original paths, so a newly selected WordPress image falls back to its source URL. The compact About header has no visible category menu; its shared header receives the verified public category snapshot without making a second homepage API request. Snapshots must be refreshed or removed as part of production content-publishing integration; this is a local migration preview, not a production release.

## Validation

Five focused adapter/security tests pass, including complete sections/counter values/testimonials/FAQ, partial-response rejection, executable-link rejection, and script/style exclusion. Original browser measurements verified: 164px header, 1170px banner wrapper at 1280px viewport, 610px introductory image, 120px introductory text inset, full-width paired sections and lavender-to-#bbb6f4 gradient.

Build and rendered-preview verification are recorded in the completion note below. Full production SEO, public cutover and authenticated concurrency remain outside this page migration.

## Preview checks

Rendered About preview at http://poblancer.local:3103/about-v2/ verified in the browser. At 1280px, banner image width is 1140px and header height is 164px. At 390px, document width remains 390px, mobile navigation is available, and all ten FAQ entries remain present. Selecting Robert Fox changes the full testimonial and loads its portrait. Opening FAQ 2 closes FAQ 1. No WordPress theme scripts are loaded in the React page. Static assets viewed in the browser load successfully. Original WordPress API requests from the build process timed out, so live content refresh remains unverified in this session; the verified public snapshot supplies the preview. Build workers limited to two to reduce local build memory pressure.

### Local offline build

The final local build uses POB_LOCAL_BUILD_SNAPSHOT=1 so page generation reads the captured public home/About responses rather than waiting on a stalled LocalWP API. The normal preview process does not set that flag; five-minute revalidation still uses the public WordPress source. This is an explicit build input, not a replacement backend. Both snapshots are server-side inputs; no privileged credentials or private records are included.

Final completion: production build passed with both / and /about-v2 prerendered and five-minute revalidation. Managed preview restarted. Final browser reload verifies the 300px original logo, 164px About header, loaded banner, correct page title and no horizontal overflow. Preview retained for review. Browser screenshot captured, but saving its bytes to a project file returned EPERM, so no screenshot file is claimed.
