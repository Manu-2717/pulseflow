# PulseFlow operations

## Availability

`.github/workflows/availability.yml` checks the public home page and sitemap roughly every 15 minutes. The hourly run also checks `/api/health`, which performs a database query and returns 503 with `Retry-After` if unhealthy. Each failed check retries twice before the workflow fails. GitHub Actions schedules are best effort and can be delayed; they are not an availability SLA. Public repository schedules can be disabled by GitHub after 60 days without repository activity. Review the Actions page and GitHub notification settings periodically.

Run a full check on demand:

```sh
CHECK_DATABASE=true node scripts/check-availability.mjs
```

## Error reporting

Server request errors emit `pulseflow.server_error` events through Next.js instrumentation. Browser runtime errors and error boundaries emit `pulseflow.client_error` events to the same hosting logs. Open the Vercel project → Logs and filter for these event names or the Error level. Events contain a route pattern or broad area and optional framework error digest. The custom reporter does not collect request headers, account identifiers, task text, exception messages, stack traces, URLs, or query strings. Its public endpoint rejects cross-origin submissions, restricts payload size, and caps reports per server instance. Client reports are deduplicated for 30 seconds.

This uses the existing Vercel account. Log retention depends on the hosting plan; the Hobby plan currently retains runtime logs for one hour. This is operational error logging, without session replay or advertising analytics.

## Encrypted backups

`scripts/backup-database.mjs` streams a PostgreSQL custom-format dump directly through `age` encryption. Plaintext is never saved to a file. Only a public encryption recipient is committed in `ops/backup-recipient.txt`. The private recovery identity is kept outside Git in the local ignored `outputs/recovery/` directory, with restrictive file permissions. Save a separate secure copy of that identity before relying on production backups; an encrypted backup cannot be restored without it.

The daily GitHub workflow is gated by repository variable `DATABASE_BACKUPS_ENABLED=true`. Before enabling it:

1. Configure a PostgreSQL connection as repository secret `BACKUP_DATABASE_URL`, ideally using a dedicated read-only database role with SELECT permission on all application tables and sequences. Do not put it in source code or workflow logs.
2. Confirm the `postgres:18` client image can dump the production server version. PostgreSQL dump clients must not be older than the source server.
3. Manually run **Encrypted database backup**. Check that only `.dump.age` and checksum files appear in the artifact.
4. Download the encrypted artifact and restore it into a separate empty recovery database.
5. Set the enable variable only after that production drill succeeds.

Artifacts are retained for seven days. The repository is public, so treat encrypted artifacts as publicly retrievable. The private identity must never be uploaded to GitHub. Download important recovery points into your own secure storage if longer retention is needed. The workflow is prepared but remains gated until the database secret is configured in the browser.

Local export (requires matching `pg_dump` and `age` on PATH):

```sh
node --env-file=.env scripts/backup-database.mjs
```

Recovery into a new empty database (never the live database):

```sh
RESTORE_DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/pulseflow_restore_drill?sslmode=require' \
  node scripts/restore-database.mjs BACKUP.dump.age /secure/location/pulseflow-backup.agekey
```

The restore tool refuses database names outside `pulseflow_restore_*`, refuses nonempty databases, and runs restoration in a single transaction. Check restored users, projects, project membership, tasks, threads, and comments before deciding to switch the app to a recovered database. A production recovery requires a deliberate connection-string change and redeployment; this script never replaces production automatically.

Local drill completed on 28 October 2026: encrypted export restored successfully into an isolated database; row counts matched for six core tables; a nonempty restore target and tampered ciphertext were rejected. The temporary recovery database was removed after verification. This validates the tooling, not production recovery or Neon's account-level restore settings.

## Search engines

Google Search Console property: `https://pulseflow-theta.vercel.app/`. Its public HTML verification token is in root metadata. Complete verification in the signed-in Search Console tab, then submit `https://pulseflow-theta.vercel.app/sitemap.xml`. Bing Webmaster requires its own verification token or an explicitly authorized Search Console import. `BING_SITE_VERIFICATION` supports a Bing meta token without another source change. Search-engine verification and submission remain pending the browser handoff.

## Recovery checks

- Keep Neon instant-restore retention enabled within the free plan allowance. Verify the actual account setting before relying on it.
- Test a fresh encrypted production backup in an isolated database after significant schema changes.
- Check backup workflow failures, artifact freshness, recovery-key availability, and GitHub notification delivery.
- Never upload `.env`, unencrypted database dumps, recovery identities, or account tokens to the public repository.
