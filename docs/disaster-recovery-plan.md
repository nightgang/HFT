# Disaster Recovery Plan

## Purpose
This document describes recovery actions for the Solana HFT system after outages or data loss.

## Recovery Objectives
- Recovery Time Objective (RTO): 2 hours
- Recovery Point Objective (RPO): 24 hours

## Backup Strategy
- Database dumps are created daily at 02:00 UTC.
- Backups are stored in `backups/` and cleaned up after 7 days by default.
- Key material backups should be encrypted and stored in cold storage.

## Recovery Process
1. Verify the latest backup file exists in `backups/`.
2. Restore the PostgreSQL database with `pg_restore`.
3. Reapply migrations using `npm --prefix backend run migrate`.
4. Validate application health on `/health` and metrics on `/metrics`.
5. Confirm wallet key integrity and audit log availability.

## Key Recovery
- Use the encrypted private key store in the database.
- Validate key backups against the latest `MASTER_ENCRYPTION_KEY` hash.
- Rotate keys if any integrity checks fail.

## Communication
- Notify stakeholders when recovery begins.
- Track incident progress in a shared status channel.
- Document root cause and remediation steps after recovery.
