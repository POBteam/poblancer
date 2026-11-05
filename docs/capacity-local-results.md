# Initial authenticated local capacity result
21 October 2026

## Scope
Ten distinct disposable native WordPress sessions: five freelancer and five employer accounts, each with its own profile and listing. Read requests went through the Next proxy to listings, profiles and messages. Each response was checked against its fixture owner or expected empty conversation list. No support scans, writes, payments, messages or external notifications ran under load.

The local PHP pool is configured with two static workers. It was not changed. These are short bounded batches, not a sustained user workload, browser rendering benchmark or production-size database population test.

| In-flight requests | Requests | Requests/second | Sample p95 ms | Errors |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 10 | 1.97 | 661.5 | 0 |
| 2 | 20 | 4.01 | 538.5 | 0 |
| 5 | 20 | 4.04 | 1468.8 | 0 |
| 10 | 20 | 4.06 | 2461.6 | 0 |

All 70 requests returned HTTP 200 and matched their expected account scope. Cleanup removed the ten users, profiles/listings and native sessions. Report: ../test-results/capacity-local.json.

## Interpretation
Throughput flattened near four requests/second while queueing latency rose with more in-flight requests. This is consistent with the two-worker pool being a constraint under this specific workload. Worker busy time, CPU attribution, memory pressure, database locks and production behavior were not instrumented, so this does not prove the pool is the sole bottleneck.

Twenty samples at the largest stage provide only a preliminary percentile. Ten sessions with at most ten simultaneous requests do not validate 1,000 authenticated users or 90-percent CPU savings. A larger isolated staging environment and realistic populated accounts, read/write mix and soak duration remain necessary.

## Next work
1. Profile backend bootstrap and endpoint costs before selecting changes; preserve native hooks, ownership checks and backend financial calculations.
2. Review support-notice polling (up to 16.7 requests/second for 1,000 visible eligible users at the current 60-second interval), because that alone exceeds this small local read baseline.
3. Verify session/nonce/cookie isolation and final CDN no-store handling under the deployment runtime. Do not solve queueing by publicly caching private records.
4. Define host resources and latency/error SLOs, then repeat bounded stages on isolated staging. Do not increase LocalWP workers or launch an aggressive load on the shared Mac by inference.
5. Retain the external-delivery, registration/provider, payment callback and rollback gates from Phase 4/5.

## Read transport follow-up, 21 October 2026

Local-only read bootstrap omits verified presentation-only plugins for an exact route allowlist. Signed server-side read batches validate each native cookie, nonce and endpoint permission separately. Writes, form schemas, registration and payment handlers retain the native full stack. No public cache or authorization cache was introduced. Both adapters are restricted to this exact local installation and are not a production deployment solution.

The same ten-session listings/profile/messages workload improved at ten in-flight requests from 4.06 to 13.08 requests/second, with p95 falling from 2461.6 to 894.4ms. This measures response latency and throughput, not CPU savings. Source reports: capacity-local-baseline.json and capacity-local-after-read-batch.json.

A separate navigation-only workload across 100 sessions made 500 reads (listings/page views/messages), all HTTP 200 with account-scope assertions passing. Its 100-in-flight stage returned 107.64 reads/second and p95 1137ms over 200 requests. The 500 reads used 32 native bootstrap batches. This excludes editors, polling and writes.

A fixed-arrival run created 1,000 distinct disposable native sessions and scheduled one navigation read per session at 50 arrivals/second, with at most 100 in flight. All 1,000 reads passed status and fixture-scope assertions. Observed throughput was 48.56 reads/second, p95 988.5ms, maximum 1304.9ms over 20.59 seconds. Cleanup passed. This represents one action per user over about 20 seconds, not 1,000 simultaneous submissions, browser rendering, login bursts or a sustained full-dashboard workload. Report: capacity-navigation-fixed-rate.json.

Native-versus-batch tests passed 103 assertions across ten fixture users, including private payout settings, ownership, invalid signatures, nonce validation and revoked sessions. Node transport tests passed 13 checks. Future plugins that depend on per-user bootstrap state require staging parity before enabling batching outside this local pilot.

Collaboration scaling checks passed 47 assertions: owned cases are filtered before the 200-case limit, and bounded 500-case deadline scans rotate to reach later assignments. No earnings, payout or deadline policy changed.

Remaining capacity gates: support polling and scans, initial authentication/workspace bootstrap, schema-heavy editors, concurrent writes/races, realistic populated accounts, sustained resource instrumentation, Cloudflare runtime parity and staging load. The 1,000-user overall target and 90-percent CPU reduction remain unproven.

## Browser and polling follow-up
The actual React service form saved a disposable unpublished preview (14166), including package/revisions/features, FAQ, description and introduction video. Direct WordPress persistence checks passed; the exact preview was moved to recoverable Trash without publication. This is one browser save path, not complete device or workflow acceptance. Screenshot file export was denied by the browser runtime, so no saved screenshot artifact is claimed.

Support notices now schedule their next refresh after the prior request finishes, abort a request after 15 seconds, skip hidden/editing/demo views and spread the initial refresh across 45–60 seconds. Subsequent refreshes wait 60 seconds after completion. This prevents overlapping requests and reduces synchronized bursts; it does not establish aggregate support-polling capacity. The temporary local PHP profiler was archived privately and removed from the installation.

## Populated overview/support reads
Workspace and support were added to the audited native batch allowlist after five-actor native-response parity checks, including private assignments and permission failures. They retain their GET alert/transient side effects. No form or payment command is batched.

With 1,000 distinct native sessions and 500 owned assignments/earnings records, 3,000 listings/workspace/support requests completed at 48.96/second over 61.28 seconds. p95 was 1723.7ms, maximum 2853.8ms; all status/fixture-scope assertions passed and cleanup passed. Each session performed three reads; this was not browser rendering, a long soak or full financial/registration traffic. Report: capacity-populated-dashboard.json. It predates the quiet-case scan prefilter.

## Mixed reads and saves: target not achieved
The mix is 5% native session bootstrap (not password login), 5% profile schemas, 5% add-on creation, 20% support, 20% overview, 20% listings and 25% messages. There are 1,000 fixture sessions and 500 assignments in the database; only 400 distinct actors were actually served before the final ramp stopped. Empty messages and short fixture content remain simplifications. Saved add-ons were checked for native ownership before cleanup. No messages, external notifications or payments were sent.

Latency includes time waiting for admission by the generator, not only request duration. At most 50 requests were in flight. Arrivals stopped at an error/ownership failure or a latency over five seconds, and pending work drained before fixture cleanup. The stage p95 guard was four seconds; neither is a signed-off product SLO.

| Scheduled arrivals/second | Requests completed/planned | Observed requests/second | p95 ms | Guard |
| ---: | ---: | ---: | ---: | --- |
| 10 | 200/200 | 9.86 | 1435.7 | Completed |
| 25 | 400/400 | 22.95 | 1872.4 | Completed |
| 50 | 259/1000 | 25.54 | 5214.7 | Stopped |

All returned responses passed status/scope checks; 43 add-ons were created and removed. This is not a 1,000-user mixed-workload pass. The proposed 500ms-read/one-second-write SLOs are also unmet. Report: capacity-mixed-dashboard.json.

Before the quiet-case optimization, the same mix stopped in its first stage (200 requests, 7.71/second, p95 6726.7ms). Report: capacity-mixed-dashboard-before-scan-prefilter.json. Mac load was shared and not controlled, so the difference is not a CPU-attribution result.

## Scan optimization evidence
Native bounded scans still consider the same case window and rotate their cursor. They now fetch open-offer/dispute hints in bulk and avoid loading the user/order when a quiet case is before its first time checkpoint. This cannot change an earnings amount or the deadline thresholds. The 51-check regression covers the exact 60% boundary, early offer-review and dispute exceptions, alert deduplication, and the previous full support workflow.

A warm CLI comparison using the saved pre-change class and the same 500 quiet assignments measured 1503 queries/93.24ms before and four queries/1.14ms after. This is a scoped quiet-scan comparison, not whole-site CPU reduction. Report: support-scan-benchmark.json; all fixtures cleaned up.

Six separately instrumented unloaded HTTP samples found the add-on write handler took 46.74–59.74ms, while total instrumented PHP time was 1535.2–1984.97ms. This indicates startup dominated those samples. SAVEQUERIES/profiling adds overhead, and the shared host varied; these are not production baselines. The profiler was removed after collection. Report: backend-write-profile.json.

The remaining work is backend/startup and staging capacity validation rather than changing financial rules or calling a simpler read mix a success. Current signatures, paths, secret-file access and process-local batching are deliberately local; production runtime/security/caching/forwarded-client identity need separate validation.

## Separate loopback runtime, 22 October 2026

A separate PHP CLI-server runtime on 127.0.0.1:8001 and Next API test process on 127.0.0.1:3104 exercised the same installed WordPress handlers/database and exact-local isolation. Native mail/HTTP blocking was health-checked. PHP_CLI_SERVER_WORKERS was configured as 4; startup logs show five server PIDs, including the parent, with 256M memory_limit. This differs from Local nginx/FPM and cannot be treated as a production or pure worker-count comparison. The normal Local PHP pool/settings were unchanged. The API generator retained the existing trusted frontend Origin on port 3103; port 3104 is a test transport, not a separately accepted browser login origin.

An exact loopback batching origin is allowed only with server-only POB_ISOLATED_BENCHMARK=1; normal behavior and privileged credential isolation remain. A small smoke completed 20 mixed requests. Its immediate shutdown check raced PHP child exit; a subsequent independent check confirmed both ports closed, and the runner now waits for shutdown. Initial permission-denied logging was corrected through narrowly scoped access to the existing WooCommerce log directory before the full ramps. The final full run recorded zero permission errors.

The first 1,000-session ramp on this runtime passed 10/s and 25/s but stopped at 50/s after one addon-write 429 from the four-body frontend guard. Successful responses remained account-scoped. Evidence is isolated-runtime-before-admission.json and capacity-mixed-isolated-before-admission.json. The copied generator had a stale workers=2 metadata label in those reports; actual runtime process inventory belongs to the outer runtime report. The generator metadata is corrected for the later run.

The guard now shares process-wide admission across API routes and distinguishes up to 64 small JSON submissions (each actually limited to 256 KiB) from four large/unknown bodies (20 MiB each). Claimed small length cannot bypass the enforced stream limit. Body deadlines, cancellation and no automatic mutation replay remain. This bounds application buffers rather than treating every tiny save as a maximum-size upload; runtime/chunk overhead is additional.

After that change, the same three-stage ramp completed:

| Scheduled requests/s | Completed requests | Observed requests/s | p95 scheduled latency | Errors |
| --- | --- | --- | --- | --- |
| 10 | 200 | 9.85 | 618.1 ms | 0 |
| 25 | 400 | 24.44 | 597.5 ms | 0 |
| 50 | 1,000 | 46.59 | 1,877.5 ms | 0 |

All 1,000 distinct actors were actually served. All account scopes were correct; generated accounts, posts, assignments and sessions were cleaned up; both temporary ports closed. The 50/s stage lasted 21.47 seconds with at most 50 requests in flight. Profile p95 was 1,941.3 ms, addon-save p95 2,537.7 ms, session p95 1,722.8 ms and batched read groups approximately 1,812–1,918 ms. Therefore the proposed 500 ms read/1 s write SLOs still fail. Harness guard completion is not performance acceptance.

Across 1,600 requests, 1,360 eligible reads used 251 signed batches; adding 240 direct session/profile/save requests gives 491 estimated PHP requests instead of 1,600 unbatched requests. This is a request-count comparison inside this workload, not a measured CPU-saving percentage or a full user-journey comparison. Browser rendering, password login, provider delivery, real payments, full message/support/contract mutations under sustained load and production runtime are not covered. A thousand sessions scheduling individual API calls is not proof of 1,000 simultaneously rendering full workflows.

Evidence: isolated-runtime.json, capacity-mixed-isolated.json, isolated-capacity-summary.json. Unit suite: 34 passed; production build/TypeScript passed. No live site was accessed or changed.

## Private timing diagnosis and repeatability limit, 22 October

Added fixed-size timing summaries behind the existing signed metrics interface: per-read Node queue wait, per-batch backend round trip, and native WordPress bootstrap/handler/query/peak-memory measures. Individual browser responses contain only their native result; timing values come from the HMAC-protected batch envelope. No account IDs, credentials, paths or raw data enter these aggregates. Thirty-six Node tests and build/TypeScript pass. The native batch suite reran all 103 checks, including response parity, account isolation and immediate revocation; cleanup passed.

A diagnostic run on the same five-observed-process loopback setup completed 200 requests at 10/s and 400 at 25/s with no errors, but stopped the 50/s stage after 558 requests on latency (p95 4,744.9 ms, maximum 5,451.2 ms). All returned account scopes were correct. Only 558 distinct actors were served, despite 1,000 sessions being created. This weaker result must be retained alongside the prior successful 1,000-request stage; the shared Mac/runtime is not demonstrated to meet the target reliably. The diagnostic run does not establish that instrumentation itself caused the variation.

| Scheduled rate | Mean Node queue per dispatched read | Mean backend round trip per batch | Mean WordPress bootstrap per batch | Mean native handler per batch |
| --- | --- | --- | --- | --- |
| 10/s | 130.91 ms | 362.42 ms | 340.85 ms | 9.94 ms |
| 25/s | 118.79 ms | 377.20 ms | 348.81 ms | 13.01 ms |
| 50/s, stopped | 331.31 ms | 802.13 ms | 386.82 ms | 43.08 ms |

Per-read and per-batch averages have different weighting and must not be blindly added. At the stopped stage, about 372.23 ms of mean batch round trip was outside the measured PHP bootstrap/handler portions. That remainder includes origin admission/waiting, serialization, transport and unmeasured work; it is not a CPU measurement. Generator admission delay also grew: individual samples spent up to about 3.75 seconds waiting before the bounded generator could start them. This is why scheduled latency is retained rather than reporting only successful HTTP duration.

These findings argue against blindly shortening the batch window: handlers are already small relative to repeated bootstrap, and more unbatched requests can increase backend work. Next performance experiments need controlled isolation/queue sizing or representative backend capacity, while preserving all native auth and business hooks. No permission result or private response cache was added. Tests, fixtures, temporary runtime directories and both ports cleaned up. Reports: isolated-runtime.json, capacity-mixed-isolated.json, isolated-timing-analysis.json. The prior non-instrumented result is preserved in *-after-admission.json; the earlier summary refers to that prior run, not this diagnostic result.
