# Put POBlancer in your private GitHub repository

1. Open the clean `POBlancer-GitHub-2026-10-31` folder supplied in outputs. It contains source code, backend adapters, public assets and documentation, without local credentials or the database.
2. In GitHub Desktop, choose **File > Add Local Repository**, select that folder, then choose **Create a repository here** if prompted.
3. Review the changes. Do not add `.env.local`, database backups, browser sessions, runtime logs or `node_modules`. Commit with a message such as `Save POBlancer local development checkpoint`.
4. Choose **Publish repository** and leave **Keep this code private** selected.
5. Clone that repository in your preferred editor to continue UI work. Keep the Next API routes and backend contracts intact. A static-only UI export will not run authentication or submissions.

No GitHub repository has been created or uploaded by this handoff. No credentials are required in this chat. If you want an assisted push later, supply the intended repository URL and use your normal GitHub sign-in.

To run locally, start the existing POBlancer site in LocalWP, copy `.env.example` to `.env.local`, configure the local origins as appropriate, run `npm ci`, `npm run build`, then `npm start`. The current local bridge and WordPress plugin must be installed. The frontend source is not a complete WordPress backup.

Read RELEASE_STATUS_2026-10-31.md before considering this ready for live migration. The listed release checks are still required.
