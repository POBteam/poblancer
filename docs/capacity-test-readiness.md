# Capacity-test preparation
21 October 2026

## Target and baseline
Target: approximately 1,000 concurrently authenticated users, with WordPress authoritative. Capacity is not verified.

Five sequential unloaded local samples returned HTTP 200:
- Login HTML: 1.4–34.9 ms, 6,786 bytes. This measures initial HTML only, not hydration, assets, login or dashboard completion.
- Anonymous session bootstrap through Next: 432.7–1,953.2 ms. Private/no-store was present. This is not authenticated-load latency and the small sample cannot establish a percentile.
Evidence: ../test-results/initial-timing-smoke.json.

The gap is consistent with WordPress bootstrap being a remaining cost, but no CPU attribution or savings percentage was measured. The flat taxonomy query was fixed separately; financial and ownership logic remains unchanged.

## Proposed workload for isolated staging
Use distinct disposable sessions/accounts, realistic populated lists and separate role cohorts. Do not simulate 1,000 users with one account and its per-user locks.

Start at 10 sessions, then 25/50/100/250/500/1,000 only while the previous stage remains healthy. Include a sustained run and teardown verification. Use an explicit think time (initial proposal: one action per 20 seconds), not 1,000 simultaneous writes. At two backend requests per action that example is approximately 100 requests/second, plus up to 16.7 support refreshes/second if all 1,000 eligible users remain visible. These are workload assumptions, not demonstrated throughput.

Initial mix to review: overview/read activity 25%, messages 25%, listings/search 20%, editor/profile 15%, collaboration 15%. Most actions are reads. Fixture-only writes should include draft saves and messages, with lower-frequency submissions and contract actions; do not generate real withdrawals or provider payments.

## Measurements and abort conditions
Record request latency/error rate by endpoint, queue depth, PHP worker saturation, CPU, RSS, database connections/locks/slow queries and frontend asset size. Treat browser navigation timings separately from API timings. Use test-only correlation identifiers; do not log cookies, nonces, SMTP secrets or private message content.

Stop a stage on data-integrity failure, cross-user leakage, growing queues, sustained resource saturation or persistent server errors. Agree on latency/error SLOs and host resource limits before treating a stage as a pass. No aggressive load has been launched on this Mac, which also hosts other projects.

## Optimization and release gates
Retain screen-level code splitting and avoid full WordPress page rendering during navigation. Keep private responses no-store; verify final Cloudflare handling explicitly. Do not introduce shared user-data caches or bypass WordPress checks to improve scores. Reduce repeated backend bootstrap only with a reviewed contract and invalidation/session design.

Keep provider delivery, backup restore, runtime compatibility, private response isolation and release rollback as gates. The original WordPress frontend remains fallback. Phase 6 public-site migration preserves the existing design, video, content, navigation and SEO URLs after dashboard acceptance.
