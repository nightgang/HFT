# HFT - Solana Trading System

High-frequency Solana trading platform with a Node/Express backend, React/Vite frontend, PostgreSQL, Redis, and a Katana CLI trading engine.

## Features

- REST API backend with advanced trade and wallet management
- React/Vite frontend with real-time dashboards
- PostgreSQL schema and migration support
- Redis caching and session support
- Solana integration for trading and execution
- Katana terminal for CLI trading control
- Risk protection, alerts, and audit logging

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis
- Docker / Docker Compose (optional)

## Setup

```bash
git clone https://github.com/nightgang/HFT.git
cd HFT
npm install
```

## Environment

Copy the template and fill in the required values:

```bash
cp .env.example .env
```

Edit `.env` and update database credentials, secrets, and Solana endpoints.

## Run Locally

### Start all services

```bash
npm run dev
```

### Start backend only

```bash
npm run dev:backend
```

### Start frontend only

```bash
npm run dev:frontend
```

### Run backend migrations

```bash
cd backend && npm run migrate
```

## Production

### Start backend

```bash
cd backend && npm start
```

### Start frontend

```bash
cd frontend && npm run build
```

## Docker

If you want to run the stack with Docker Compose:

```bash
docker-compose up -d
```

## Project Structure

- `backend/` - Express API and trading engine
- `frontend/` - React/Vite user interface
- `cli/` - Katana terminal CLI
- `db/` - Root database schema and migration scaffolding
- `docker-compose.yml` - Docker compose setup
- `k8s/` - Kubernetes deployment manifests

## Important Environment Variables

- `PORT` - Backend port (default `3001`)
- `WS_PORT` - Backend WebSocket port (default `3002`)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` - Authentication secret
- `ENCRYPTION_KEY` / `MASTER_ENCRYPTION_KEY` - Encryption keys for sensitive data
- `RPC_URL` - Solana RPC endpoint
- `JUPITER_API_URL` - Jupiter quote API endpoint
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Email delivery

## Katana Mode

Katana Mode is the platform's ultra-fast trading engine for Solana.

### Environment variables

```env
KATANA_ENABLED=true
KATANA_TERMINAL_MODE=false
KATANA_MAX_CONCURRENT_TRADES=5
KATANA_MIN_LIQUIDITY_SOL=5
KATANA_MAX_SLIPPAGE=0.3
KATANA_AUTO_BUY_ENABLED=true
KATANA_JITO_ENABLED=false
KATANA_JITO_TIP=10000
KATANA_WS_PORT=3003
```

### CLI usage

```bash
npm run katana
```

Available commands:

- `start`
- `stop`
- `status`
- `buy <amount>`
- `sell <amount>`
- `positions`
- `help`

## Migrations

The root `db/` folder contains the schema and migration bootstrap.

To run backend migrations:

```bash
cd backend && npm run migrate
```

## Notes

- Do not commit `.env` or real secrets.
- Keep database backups and dumps out of version control.
- Use the `.env.example` file as the canonical template.

## Support

If you need help, open an issue in the repository.
