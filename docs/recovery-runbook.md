# Recovery validation
21 October 2026

## Completed SQL rehearsal
The private marketplace-2026-10-21 SQL snapshot passed its saved SHA-256 and byte-length checks. The harness reviewed cross-database/global statements before importing. Four native Automator log views use SQL SECURITY INVOKER; they were retained and validated, not discarded.

The existing Local MySQL client streamed the unchanged SQL file into a unique new pob_restore_test_ database. No WordPress configuration was repointed and PHP never booted WordPress against the restored records. The import yielded 215 base tables plus four views; all 219 passed CHECK TABLE, and core user/post/option records existed. The 215-table manifest counts base tables, not the additional views.

The disposable database and temporary private MySQL option file were removed in cleanup. The working site database, other LocalWP sites and original snapshot were unchanged. Evidence: ../test-results/restore-rehearsal.json. The harness is tests/restore-rehearsal.php and is restricted to the exact local site with outbound isolation enabled.

This proves this SQL snapshot can be imported and its objects validated on the current local database runtime. It does not prove exact business reconciliation, plugin upgrade compatibility, public restoration, complete media availability or a production rollback.

## Full recovery gate still open
1. Preserve a matching complete file set: WordPress configuration, MU plugins, workspace adapters, active plugins, themes and uploads, plus private deployment configuration stored outside public assets. The SQL snapshot alone contains none of those binaries/media files.
2. Restore into a separately isolated WordPress environment with mail, HTTP automations, payment gateways, indexing and cron behavior controlled before PHP starts. A copied production SMTP or webhook configuration must not run accidentally.
3. Verify original media, video references, all page types, both role workflows, private access, financial record consistency and automation configuration. Use sandbox identities/providers for delivery tests.
4. Rehearse presentation/routing rollback independently from database restoration. Keep newly created orders, messages, users and collaboration agreements authoritative. Switch traffic back to the preserved frontend instead of overwriting new business records with an old snapshot.
5. Test final host/runtime paths, cookies, callbacks and cache bypass before production cutover. Current exact-local paths and file-based batch secrets are not a production deployment package.

## Complete private file bundle and fresh SQL rehearsal, 22 October 2026

A new recovery set is stored in ../backups/recovery-2026-10-22 with private directory/file permissions. It contains a fresh transactional database.sql, database-manifest.json, wordpress.zip, frontend.zip and per-file manifests. WordPress configuration, MU plugins, plugins, themes and all uploads are included. Frontend source/configuration and dependency lockfile are included; generated builds, node_modules, caches, test-results and recursive backups are excluded. Configuration secrets stay inside this private local bundle; nothing was uploaded.

The WordPress archive contains 67,881 regular files (2,472,867,997 uncompressed bytes). The frontend contains 137 source/config files. Both were extracted into offline-files beneath the private bundle, and every regular-file size/hash matched its manifest. No symlinks were present. Restored PHP was never started and no Local site or configuration was repointed. The archive script rejects unsafe paths and outside-root links and fails if a source file changes during its read. This is a captured file set, not an atomic database/files freeze.

The matching fresh 278,348,526-byte SQL export was SHA-verified, imported into a unique disposable database and checked: 215 base tables plus four views, all 219 CHECK TABLE results OK, core users/posts/options present. The disposable database and credential option file were removed. Combined evidence: ../test-results/recovery-combined.json and private verified-recovery.json. The working database and other Local sites were unchanged.

Operational recovery still needs a separately configured isolated runtime and workflow/financial reconciliation before any restored PHP starts. Exact-local guards and hardcoded paths must be reviewed for that new location; never assume copying them to another path automatically blocks production mail/webhooks. Provider delivery, new deployment cookies and routing rollback remain untested. Presentation rollback must preserve new marketplace records; the SQL export is not a reason to overwrite them.
