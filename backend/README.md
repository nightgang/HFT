# Backend Service

## Overview

The backend service powers the HFT trading platform with:
- Express API and WebSocket server
- JWT authentication and API key support
- PostgreSQL persistence
- Redis-based realtime state and event bus
- Prometheus metrics and health endpoints
- Audit logging and rate limiting
- Optional AI service integration

## Architecture

The backend is organized into:
- `app.js` — Express application, middleware, security, and route registration
- `server.js` — startup, database migration runner, and service initialization
- `routes/` — REST and API route handlers
- `middleware/` — auth, monitoring, error handling
- `models/` — database models and repository operations
- `services/` — business logic, trade engines, resilience, and integrations
- `db/` — connection helper and migration runner
- `ws/` — WebSocket server and realtime broadcast support

## API Versioning

Routes are available with both legacy and versioned prefixes:
- `/api/...`
- `/api/v1/...`

Example:
- `/api/trading` → `/api/v1/trading`
- `/api/users/login` → `/api/v1/users/login`

## Local Development

1. Copy environment variables:
```bash
cp .env.example .env
```
2. Configure the required secrets:
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `DB_PASSWORD`
- `DB_USER`
- `DB_NAME`

3. Start backend in dev mode:
```bash
cd backend
npm install
npm run dev
```

## Production

The backend is designed to run inside Docker or Kubernetes. The repository includes:
- `Dockerfile`
- `docker-compose.yml` service definitions in the root repo
- `k8s/` manifests for deployment
- `backend/ecosystem.config.js` for PM2

## Health & Monitoring

Exposed endpoints:
- `/health` — application-level health
- `/healthz/live` — liveness probe
- `/healthz/ready` — readiness probe
- `/metrics` — Prometheus metrics

## Notes

- API request rate limiting is enabled via `express-rate-limit`
- CSRF protection is applied selectively for browser token endpoints
- WebSocket authentication uses JWT tokens passed via the `token` query parameter
- API keys are stored as hashed values in the database
