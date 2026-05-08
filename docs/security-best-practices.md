# Security Best Practices

## 1. Secrets Management
- Use environment variables and a secrets manager for production secrets.
- Never store private keys or credentials in plaintext in repository history.
- Rotate secrets and encryption keys regularly.
- Store `MASTER_ENCRYPTION_KEY` and `WEBHOOK_SIGNATURE_SECRET` in secure vaults.

## 2. Authentication and Authorization
- Use JWT tokens for API access with strong signing secrets and expirations.
- Protect all sensitive routes with bearer authentication.
- Audit authentication events and failed login attempts.
- Harden default credentials and use hashed passwords.

## 3. Input Validation
- Validate all external input with Zod schemas.
- Use strict patterns for wallet addresses, trade payloads, and export requests.
- Reject invalid requests early with descriptive error messages.

## 4. API Security
- Enable CORS with a whitelist of allowed origins.
- Enforce rate limiting for normal and sensitive endpoints.
- Use CSRF tokens for browser-driven state-changing operations.
- Verify webhook payload signatures with HMAC-SHA256.

## 5. Data Protection
- Encrypt private keys at rest with libsodium.
- Back up database dumps and audit logs to secure storage.
- Use separate wallets for different trading strategies and enforce spending limits.
- Enable audit logging for key access, wallet operations, and webhook events.
- Store backups in encrypted offsite storage and validate backup integrity regularly.

## 5.1 Dependency and CI Security
- Use automated dependency scanning with Dependabot weekly updates.
- Run `npm audit` as part of CI to detect vulnerabilities early.
- Lock dependency versions with package-lock files and review dependency changes before merging.
- Review unused packages and remove unnecessary blockchain or RPC client libraries.

## 6. Monitoring and Recovery
- Expose health checks at `/health` and metrics at `/metrics`.
- Review alerting and incident reporting procedures regularly.
- Maintain disaster recovery plans and practice restore drills.
