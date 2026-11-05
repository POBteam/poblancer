# Homepage fidelity correction

23 October 2026. Scope: match the original local homepage before starting another public page. User screenshots identify the Next preview and original WordPress design. No WordPress content, settings, snippets, hook names, orders or payment code changed.

## Source evidence and changes

The original DOM/computed styles and Elementor animation settings were inspected at 1280×720. The original homepage uses DM Sans, not the dashboard's Poppins. A 36,980-byte Latin variable WOFF2 of the same family is now self-hosted for the public homepage only, with weights 400–700. Font source: Google Fonts DM Sans CSS2, Latin resource `rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2`. Existing dashboard typography is unchanged.

- **Hero:** original measured height 856px; corrected preview 856px at the same viewport, with a minimum of the full viewport height. The header is overlaid rather than adding height to the section. A ResizeObserver sizes the 16:9 video to cover the actual hero, removing embedded-video letterboxing. Original heading size 39px and navy overlay `#010b62` at .79 are retained; hero paragraphs remain white.
- **Navigation:** original menu begins at x=427.15/y=89.70; corrected preview x=426.66/y=89.70. The menu is positioned in the original central area instead of being right-justified. The original search affordance, login and solid signup styling replace the extra desktop Dashboard link. Dashboard access remains in the mobile menu and its existing route.
- **Categories:** original divider x=60/y=120.65; the corrected control matches those coordinates. The original `flaticon-menu` glyph is used with the original 30px divider inset and 10px icon/text separation; the substitute grid character and added dropdown chevron are removed.
- **Service cards:** original desktop width 290px, image height approximately 216.77px and four columns. Corrected width is 290px, with the original image ratio, typography, two-line title, author/price arrangement and approximately 468px height for rated cards (original rated cards approximately 469.30px). Fixed HTML image heights had made the first port too tall; CSS now overrides those intrinsic heights. Card heights can vary for records without ratings, as on the original.
- **Carousel:** original configuration specifies four desktop cards, one-card movement and autoplay=false. Corrected Next-button check moved 320px, exactly one 290px card plus the 30px gap. Original-style visible edge arrows remain; the service rail has no entrance slide animation. No autoplay or polling was added.
- **Colours and spacing:** the service band uses the original `#e1deff`; seller, group, FAQ and blog sections return to their original white backgrounds. The trust block returns to `#f7f7f7`, dark text and navy button. Footer uses original `#010b62`. Category cards use the original icon font, 30px padding and approximately 269.75px height. Original branded image sources remain.
- **Final image:** original 482px-high image extends 70px above a 412px section and meets the footer. The Next section has zero padding, bottom-aligned image, original dimensions and no gap. After the entrance animation completed, measured image-to-footer gap=0px and section-to-footer gap=0px. Mobile hides this image as the original does.

## Animation implementation

The original settings specify slide-up entrances and scale entrances, with hero delays 0/200/400/600ms, process-step delay 300ms, group-image delay 300ms, testimonial delays 600/700ms, and final-image delay 500ms. A small client component uses one IntersectionObserver and Web Animations, preserving the original 3rem slide and scale(.8)/50px definitions and one-second duration. Each observed entrance runs once when seen. Target counters animate on entry over two seconds. Reduced-motion preferences are honoured; no WordPress calls or scroll listeners are added, and content remains available without JavaScript.

Actual browser evidence: initial viewport revealed four hero elements with 18 entrances still pending. Scrolling to the seller/process/group region increased the revealed count to nine, leaving 13 pending. This demonstrates viewport-triggered progression rather than launching the entire page at load. The service band is explicitly excluded from entrance animation.

## Validation and limits

Production build and TypeScript passed after the implementation and video/text/card corrections. Preview was restarted. Browser checks at 1280px and an existing 439×776 narrow viewport found no document-wide horizontal overflow. Narrow hero height was 776px, matching its viewport, and its final decorative image was hidden. A final width-specificity refinement is included in the final build below.

Visual screenshots were inspected in the browser, including the final image/footer join. Browser screenshot saving remains unavailable from the browser tool; no saved screenshot file is claimed. This correction targets the six reported visual areas; it is not an assertion that every pixel, nested mega-menu, inline rich-text control or device is fully signed off. The original public-page and provider/release gates remain documented separately. No load benchmark or external automation/payment test was repeated for these presentation changes.

The final production build and TypeScript check passed, including the narrow-width wrapper refinement. The public homepage remains statically prerendered with five-minute revalidation. The managed local preview was restarted with this final build.

## Second visual review: hover states, FAQ, testimonials and missing image

The user requested another original-site comparison and supplied the POB Academy banner. Inspection found that banner in nested Elementor container `b4c625e`, image widget `67dd2f7`, below the testimonial thumbnails. The content adapter now extracts it from the same public WordPress REST response; a missing banner fails the required-content check instead of silently omitting it. It is displayed in its original order before the blog. The original seated-woman group image now follows the original 150px image extension/inset and natural aspect ratio within a clipped section; the final arms-crossed image retains its bottom-aligned footer join.

Original menu hover was inspected with the real Browse Jobs control: text `#fafafa`, transparent background, `#bbb6f4` underline of 3px. The original submenu stylesheet specifies lavender `#e1deff` with navy text and navy/white hover. Those exact states are now used. A small pointer-enter/leave component restores desktop hover opening while retaining native details keyboard controls and Escape handling.

The original FAQ has a 925px widget with 10px internal padding, yielding a 905px accordion at 1280px. The Next FAQ now measures exactly 905px and is centred at x=640, matching the viewport centre. Original `#f8f8fc` question backgrounds, `#e1deff` answer backgrounds, `#e4e2f5` borders, 40px desktop insets and 20px title text are restored, with the original smaller mobile styling. Native named details keep only one answer open. A browser click on question two verified open index `[1]` and the expected background colours.

The previous scrolling quote rail is replaced by a centred quote/name/job and the original-style five-thumbnail selector. All six testimonials remain reachable through the rotating thumbnail selection. A real click selected Robert Fox, and the quote centre measured 640px at a 1280px viewport with computed text alignment `center`. No additional WordPress request is needed to change testimonial selection.

The user's requested equal-height improvement is applied without inventing missing review data. All six desktop cards measured 467.96875px high; all six at the existing 439px narrow viewport measured 500.109375px high. There was no document-wide horizontal overflow at either size. The banner loaded successfully and measured 1220px wide at 1280px, matching its original inset. Build/TypeScript passed and the managed preview was restarted. An automatic approval-review usage failure interrupted an editing step; that step was verified unexecuted and completed after the user asked to continue. No WordPress records, settings, automation snippets, hook names or finance logic were changed.

This version is left for homepage review before starting another public page, as requested. The existing deployment and full visual-parity limits remain; these measurements do not claim every pixel on every device is signed off.


## Follow-up: original logo, spacing, carousel and footer

Replaced the 300px logo thumbnail with the original 531 x 187 PNG. Matched the freelancer-types panel to #e1deff and stretched it alongside the original image. Restored the 50px gap before the trust panel, wider responsive container, source typography sizing and outlined pill button. Restored Facebook, Twitter and Instagram icons with accessible link names and existing destinations.

Trending service cards advance every seven seconds using a client timer, with no API calls. Automatic motion pauses offscreen, in hidden documents, on pointer/focus interaction, through the pause control, and under reduced-motion preferences. Manual arrows remain.

Verification: production build and TypeScript passed. Desktop DOM confirms original 531px logo, lavender panel, 50px gap, 1170px trust panel at 1280px, 50px button radius and three social SVGs. Automatic card movement observed from scrollLeft 0 to 320. Narrow 439px viewport has no horizontal page overflow. Native browser screenshot inspected; screenshot filesystem persistence remains unavailable in this environment. WordPress settings, database and hooks were not changed.
