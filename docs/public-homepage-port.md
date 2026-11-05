# Public homepage port

22 October 2026. Local Phase 6 implementation authorized after the dashboard handoff. Preview: http://poblancer.local:3103/. The original WordPress homepage and the React workspace at `/workspace` remain available.

## Implemented

The Next.js root route now renders React components instead of redirecting to the workspace. It reads the existing anonymous WordPress REST resource `/wp-json/wp/v2/pages/9935?_fields=id,content,modified`. No new WordPress endpoint, plugin setting, snippet, order event or database record is needed for this increment.

The public content adapter extracts the original hero text/search contract, eight category cards, six unique service cards, seller introduction, four process steps, four freelancer classifications, trust section, four labelled target counters, ten FAQs, six testimonials, four blog posts and final call to action. Service prices, authors, featured flags, images and destination URLs come from the rendered public WordPress resource. No mock marketplace data or separately calculated prices are used.

Menus/footer are reproduced from the inspected current site. The white header logo, original fallback photograph, YouTube video and branded imagery are reused. The original theme's 12,888-byte Flaticon WOFF2 file is reused locally for category/process icons. New CSS is scoped to `.public-home`; dashboard styles and routes remain intact. Header dropdowns and FAQs use native accessible details controls. Rails use CSS scrolling and small React previous/next controls. Video is delayed, pausable and respects reduced-motion/data-saving preferences.

Next prerenders the public route and revalidates at 300 seconds. A preview response returned `x-nextjs-cache: HIT` with `s-maxage=300`. Session cookies and privileged credentials are never included in the public fetch or cache. WordPress may still execute Elementor rendering during regeneration; the first port reduces repeated visitor rendering, not all backend execution. A later dedicated structured public adapter can remove that regeneration dependency if measurements justify it.

The adapter discards scripts/styles and returns structured text/links. React escapes text; original markup is not injected with dangerouslySetInnerHTML. Missing/incomplete required content fails regeneration rather than silently replacing a complete page with an incomplete one. Three focused parser/link/size checks passed. Local noindex remains enabled; production canonical and SEO configuration are still a release task.

## Verified and outstanding

The first production build/TypeScript check passed with `/` marked static and a five-minute revalidation interval. Browser inspection at 1280 pixels found six service cards, ten FAQs, no document overflow, no broken loaded images and no WordPress script assets. Subsequent appearance/control refinements require the final build and preview check recorded below.

This is the first React homepage port, not final pixel-parity or all-public-page acceptance. Remaining differences include full original mega-menu structure, personalized signed-in public header, original service-favorite action, inline rich-text/link formatting, testimonial thumbnail navigation and complete animation/device comparisons. No placeholder favorite button is presented as a functioning mutation.

Search preserves `filter-title`/`filter-category` and currently submits to the original `/service-layout-1/`. Archive, category, individual service/freelancer, information and blog links deliberately retain their original local WordPress destinations until those pages are ported. Login/signup/workspace links use Next routes. Existing invalid demo links (localhost/freeio and an empty AI category href) are routed to the real local services archive in this view only; WordPress content is unchanged. Original external blog/social links remain external.

The target counters display their original configured end values (250k, 250B, 980M, 700M), with their target labels retained. They are aspirations in the original content, not measured marketplace statistics.

Actual provider delivery/payments, production security/cookie/cache behavior, Cloudflare compatibility and reliable 1,000-user capacity remain open in `release-gates.md`. This public port does not close those gates or introduce automatic shared payment settlement.

## Final preview check for this increment

The final production compilation and TypeScript check passed after the white-logo, original icon-font and rail-control refinements. The managed preview was restarted. The actual service Next button moved the rail from its initial position to approximately 1,175 pixels at a 1,220-pixel rail width; the document remained 1,280 pixels wide at the 1,280-pixel viewport. The homepage preview tab was retained for review. Screenshot display worked, but the browser tool could not save its image file due to a filesystem permission error; no saved screenshot artifact is claimed. Tablet/mobile visual acceptance and the remaining parity items above are still open.
