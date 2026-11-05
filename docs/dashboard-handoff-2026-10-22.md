# Dashboard checks and public frontend handoff

22 October 2026. The user requested dashboard checks first and then authorized the public homepage migration. This is a local development handoff, not production release approval.

## How collaboration reaches WordPress

The locally installed custom plugin is `poblancer-workspace/poblancer-workspace.php`, labelled POBlancer Workspace version 0.6.3. It was developed during this project; this capability was not part of the original Freeio installation.

React sends authenticated commands through Next's server proxy to `/wp-json/poblancer/v1/support/action`. WordPress validates permissions, eligibility, revisions and agreement states. The plugin stores cases, offers, responses, agreements, alerts and audit history in the six `pob_support_*` tables under the site's actual prefix. The browser never connects to MySQL.

Admin setup links a case to a native `service_order` or hired `project_proposal`. The plugin reads its native earning reference and stored freelancer amount, and obtains currency from the linked WooCommerce order. It does not invent the price from today's commission settings. Assignment dates currently require confirmation; ClickUp dates are not automatically imported.

Negotiation and agreement allocation are automated workflow operations. They are not automatic split payments: native payout/completion does not consume these allocations. For example, a 30% support agreement records a share of the native net pool; it does not credit the supporter or debit the primary. A reconciled backend settlement implementation remains a separate scope because paying the supporter while Freeio pays the primary in full would overpay the order.

## Existing automation compatibility

Read-only SQL inspection found 33 saved snippets, 16 active. The active Make-related snippet 22, `POB Marketplace Freelance Order- ClickUp Automation`, subscribes to `woocommerce_order_status_completed`. WooCommerce emits that exact name through its dynamic destination-status action in `includes/class-wc-order.php`. Freeio also subscribes to this native event through `WP_Freeio_WooCommerce::order_paid`; its own processed marker remains intact.

Active signup snippet 28, `Freelancers sign up to admin`, subscribes to `user_register`, `set_user_role` and `pob_admin_email_retry_send`. WordPress core emits the first two; the snippet itself schedules the retry event. None was renamed, replaced or manually dispatched during this audit. Runtime retry delivery is untested and local cron is disabled.

Freeio contract completion is distinct from WooCommerce checkout order completion. The dashboard contract adapter delegates to `WP_Freeio_Service::process_change_service_order_status` or `WP_Freeio_Project::process_change_proposal_status`. Those native methods retain `wp-freeio-before-change-service-order-status` and `wp-freeio-before-change-proposal-status`. No extra WooCommerce-completed event was added to contract completion or collaboration. Such an event could duplicate an existing Make workflow or misrepresent a payment state.

## Checks completed in this increment

- All 38 existing Node tests passed once, including account isolation, native submission cookie forwarding, exact-origin mutation protection, nonce recovery, bounded request bodies and batching cancellation. No load benchmark was repeated.
- All 13 maintained workspace PHP files present in the installed plugin match their source copies byte for byte.
- The snippet inventory records code hashes and activation states without exporting code, webhook URLs or credentials. `python3 scripts/audit-hook-compatibility.py --verify` passed against the captured baseline. This establishes a regression baseline from now, not proof about code before this audit.
- The inventory uses only database reads and source inspection; it does not bootstrap WordPress, run snippets, invoke side-effecting GETs or send webhooks. Evidence: `test-results/hook-compatibility.json`.
- Existing fixture results remain recorded in `docs/release-gates.md`; they were not rerun merely to increase test counts.

## Remaining release gates, not hidden by this handoff

Actual Make/Slack/ClickUp/SMTP delivery, full signup/approval/provider journeys, payment sandbox callbacks/refunds and deployment cookie/security compatibility are not verified. Do not unblock copied production automations just to test. An operational restored-site/routing rehearsal and representative sustained capacity remain open. A short successful mixed run followed by a latency-limited run does not prove reliable 1,000-user capacity or a CPU-saving percentage.

These are retained deployment gates. They do not prevent implementing the explicitly authorized local public frontend. Dashboard behavior, backend records and native checkout remain preserved during that work. No payment-splitting functionality is silently added as part of the homepage migration.

## Next visible deliverable

Reproduce the current local homepage in Next.js: existing logo, original text, video, header/dropdowns, categories, featured records, search, links and footer. Use the saved inventory as a starting point and verify against the current local page. Preserve public permalinks and backend authority. Do not mark a static snapshot or mock listing as live API parity. Other public pages follow; production cutover requires a separately reviewed deployment.
