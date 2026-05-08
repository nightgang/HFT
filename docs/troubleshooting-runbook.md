# Troubleshooting Runbook

## 1. Service Startup Failure
- Check application logs for missing environment variables.
- Ensure `DATABASE_URL`, `RPC_URL`, `JUPITER_API_URL`, and `HELIUS_API_KEY` are set.
- Confirm the PostgreSQL database is reachable and migrations have executed.
- Verify that Redis is available if caching or backtesting uses cache.

## 2. Authentication Errors
- Confirm JWT secret is configured with `JWT_SECRET`.
- Verify the request includes a valid `Authorization: Bearer <token>` header.
- For webhook calls, ensure the `X-API-Key` and `X-Webhook-Signature` headers are present.

## 3. CSRF Token Issues
- Fetch a valid token from `/csrf-token` before submitting state-changing requests.
- Include the token in `X-CSRF-Token` or `_csrf` field for POST requests.
- Check that cookies are enabled for CSRF-protected API endpoints.

## 4. Backup and Recovery
- Confirm backup files are written to the `backups/` directory.
- Inspect `BACKUP_RETENTION_DAYS` to ensure old backups are retained appropriately.
- Restore from a dump with `pg_restore` when needed.
- Validate recovery metadata and encrypted key backup integrity before putting restored data live.

## 5. Dependency and CI Failures
- If CI fails, check `.github/workflows/nodejs-ci.yml` for lint, test, and audit failures.
- Resolve `npm audit` issues by updating or replacing vulnerable dependencies.
- Ensure `dependabot.yml` does not open duplicate update PRs and accepts only trusted dependency changes.
- Review package-lock diff carefully before merging dependency refresh PRs.

## 6. Performance Problems
- Monitor Prometheus metrics exposed at `/metrics`.
- Review database query latency and use indexes for heavy trade and wallet queries.
- Inspect API rate limit logs if requests are blocked excessively.

## 6. Database Migration Troubleshooting
- Use `npm --prefix backend run migrate` to apply migrations.
- If a migration fails, inspect `schema_migrations` for executed migration records.
- Check PostgreSQL logs for permission or syntax errors.
