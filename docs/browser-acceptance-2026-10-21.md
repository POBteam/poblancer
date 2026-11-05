# Local rendered dashboard acceptance

Observed through the in-app browser on 21 October 2026 at `http://poblancer.local:3103/workspace`. Signed-in existing freelancer account; no profile, payout, message, listing or support mutation was submitted. No production page was used. Findings below are observations, not full acceptance or capacity proof.

Viewport width was 566 CSS pixels. On the measured views the document scroll width also equalled 566 pixels. This is one narrow viewport, not a substitute for phone/tablet/desktop coverage.

| View | Verified rendered behavior | Not established here |
| --- | --- | --- |
| Existing service contract | Agreed package, price, delivery, revisions, features and message/attachment controls render in React | No message or delivery submitted |
| Mobile menu | Opens with all freelancer navigation links pointing to the new workspace hash routes; closes after selecting a route | Keyboard focus trapping and screen-reader workflow not yet tested |
| Submit service plans | Owned quota, independent plan, POB freelancer plan and paid market plan appear. Three cards have matching client/scroll widths (528 pixels); page has no horizontal overflow | No quota or checkout executed |
| Submit service fields | Continue using quota opens fields in-place. Title, category, delivery/response time, language, price/package repeater, description, location/map, video URL, featured image/gallery, add-ons, portfolio uploads and FAQs are present | No real-account preview saved in this inspection |
| Messages | Contact search, read/unread filter, existing conversation link and pagination render without alerts or page overflow | Existing conversation was not opened to avoid marking it seen |
| Profile | Existing data renders with location leaf selection, brand, freelancer type, media/CV, video, education, experience, awards, skills, FAQ and portfolio link. No measured input/select/textarea/panel extends beyond the viewport | No real profile saved |
| Payouts | History, enabled payout method options and settings form render without errors or page overflow | No method changed or money requested |
| Service add-ons | Existing add-on titles, amounts, edit/remove controls and paging render without page overflow | No edit/removal submitted |
| Project support | Real empty assignment/offer states and eligibility-specific community/WhatsApp section render | No assignment created |
| Support example | Explicit demo banner, role selector, 70% checkpoint, elapsed-time disclaimer, deadline, backend-derived example earnings, reserved share, active agreement, progress, support offer, interest/decline counts and counteroffer render. No measured form/panel overflow. Returned to real records afterward | Example is not evidence of payment splitting or external delivery |

The original WhatsApp invitation remains present. Public links continue to point to the existing local public site, as public frontend migration has not begun.

Remaining visual acceptance includes employer account routes, more viewport sizes, keyboard/focus behavior, signup/login responsive checks, actual disposable-account form/error workflows and refresh/back-navigation acceptance. Existing API tests remain separate evidence. No claim of 1,000 simultaneous active users follows from this inspection.

## Mobile keyboard navigation follow-up
The drawer now has a visible Close navigation button. Opening at the observed narrow viewport focuses that button and locks background scrolling. Verified with actual browser key presses: Shift+Tab from the first control wraps to the final logout link without activating it, Tab wraps back to Close navigation, and Escape closes the drawer, restores body overflow and focuses Toggle navigation. A breakpoint change handler closes the mobile drawer when moving to desktop layout. Production build and TypeScript pass. No WordPress record or logout action was submitted. Screen-reader and wider-device acceptance remain separate.

## Employer browser inspection and mobile account card, 22 October
A read-only native lookup confirmed the current freelancer already had a linked employer account. Using the existing React confirmation flow, switched to that account, inspected its menu, overview, project submission, job submission and bought-services view, then switched back and verified Freelancer workspace and its original account grouping. No new account was created. No listing, payment, message, profile or verification form was submitted. Session cookies changed through the native role switch and were restored to the original freelancer identity.

Project fields include type/location, duration, experience, language/level, pricing, attachments and skills. Job fields include type/category/tags, deadline, qualification/experience, location/map, salary, apply type/external URL/email, images and video. These pages and the empty bought-services view rendered at 566 CSS pixels without page overflow or visible errors. Populated employer proposal/application browser acceptance is still open; HTTP fixture tests provide separate evidence.

Found that the max-width:950px rule hid the entire existing account-summary card. Changed that rule to retain its flex layout in the single-column overview. After rebuilding and reloading, verified the employer profile/edit/public links appear; after switching back, verified freelancer available balance, group, payouts and profile links appear. Card display:flex, page scroll width equals viewport width (566). Production build/TypeScript passed. No financial computation or data changed. Screenshot-file saving through the browser tool was denied; no saved screenshot is claimed.
