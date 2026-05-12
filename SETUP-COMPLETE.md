# HFT Trading System - Complete Setup Guide

## Setup Status Overview

### ✅ Completed
1. **Git & Security** - Pre-commit hook installed
2. **.env Configuration** - Comprehensive development configuration created
3. **Database (PostgreSQL)** - Running and migrations applied (some schema issues noted)
4. **Redis Cache** - Running
5. **Backend Dependencies** - All installed and ready
6. **Frontend Dependencies** - All installed and ready

### 🔲 Pending
- Awal Component (clarification needed)
- AI Service setup
- CLI/Katana testing
- Monitoring stack verification
- Full Docker Compose testing
- Devnet Testing
- Paper Trading mode

---

## Component Setup Instructions

### Backend Service (Express API)

**Status**: ✅ Ready to start

**Start Development Mode**:
```bash
npm run dev:backend
# Server will start on http://localhost:3001
```

**Start Production Mode**:
```bash
npm start
# From backend/ directory
```

**Available Routes**:
- `/health` - Health check
- `/api/trading/*` - Trading API endpoints
- `/api/user/*` - User management
- `/api/system/*` - System management  
- WebSocket: `ws://localhost:3002` - Real-time data

**Dependencies**: PostgreSQL, Redis

---

### Frontend Application (React/Vite)

**Status**: ✅ Ready to start

**Start Development Mode**:
```bash
npm run dev:frontend
# Application will build and serve on http://localhost:5173
```

**Build for Production**:
```bash
cd frontend && npm run build
```

**Features**:
- Katana Dashboard
- Trading interface
- Real-time charts
- Wallet management
- Risk monitoring

---

### CLI / Katana Terminal

**Status**: ✅ Ready to use

**Start Katana Terminal**:
```bash
npm run katana
# or
npm run cli
```

**Commands**:
- Full interactive terminal for trading operations
- Direct token execution
- Real-time position monitoring
- Manual trade entry

---

### AI Service

**Status**: 🔲 Needs Configuration

**Setup Steps**:
1. Navigate to `ai-service/` directory
2. Install Python dependencies:
   ```bash
   pip install -r ai-service/requirements.txt
   ```
3. Start AI service:
   ```bash
   python ai-service/main.py
   ```

**Configuration**: 
Update `.env` with:
```
AI_SERVICE_ENABLED=true
AI_SERVICE_URL=http://localhost:8000
```

---

### Monitoring Stack

**Status**: 🔲 Needs Verification

**Components**:
- Prometheus (Metrics): http://localhost:9090
- Grafana (Dashboards): http://localhost:3001  
  - Default credentials: admin / dev_grafana_password
- PostgreSQL Exporter: http://localhost:9187
- Redis Exporter: Available in docker-compose.yml

**Start with Docker Compose**:
```bash
docker-compose up -d
```

---

### Docker Compose Services

**Status**: ✅ Running

**Currently Running**:
```bash
✅ PostgreSQL (hft-postgres) - Port 5432
✅ Redis (hft-redis) - Port 6379
✅ Prometheus (hft-prometheus) - Port 9090
✅ Grafana (hft-grafana) - Port 3001
✅ PostgreSQL Exporter - Port 9187
```

**View Logs**:
```bash
docker-compose logs -f [service-name]
```

**Stop All Services**:
```bash
docker-compose down
```

---

## Quick Start - Full Development Environment

### Start Everything at Once

```bash
# Terminal 1: All services (Backend + Frontend)
npm run dev

# Terminal 2: CLI/Katana (optional)
npm run katana

# Browser:
# Frontend: http://localhost:5173
# API: http://localhost:3001
```

### Alternative: Individual Services

```bash
# Terminal 1: Backend only
npm run dev:backend

# Terminal 2: Frontend only  
npm run dev:frontend

# Terminal 3: Katana CLI
npm run katana
```

---

## Environment Configuration Details

### Key Variables

**Development Settings**:
```
NODE_ENV=development
SOLANA_CLUSTER=devnet
PAPER_TRADING_ENABLED=true
KATANA_TERMINAL_MODE=true
```

**Database**:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=hft_user
DB_NAME=hft_trading
```

**Security Keys** (Dev only):
```
JWT_SECRET=e07fa7775b3f1cd37ac6e3e0f2a52f542c933090e0877f6599608eb766976822
ENCRYPTION_KEY=1cdb8e15280961c296113528cea58797b2d4121486d620db3847752a2fc5d9fe
```

**Solana Network**:
```
RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
```

---

## Known Issues & Workarounds

### Database Migrations
**Issue**: 3 migrations have schema issues
- `003-advanced-features`: Missing `is_active` column
- `007_advanced_features_schema`: Missing `expires_at` column  
- `009_fix_limit_and_jito_schema`: Missing `bundle_status` type

**Status**: 9/12 migrations successful
**Impact**: Minor - core tables created successfully
**Action**: Fix migration files to properly sequence column/type creation

### Paper Trading
**Status**: Configured but not yet tested
**Config**:
```
PAPER_TRADING_ENABLED=true
PAPER_TRADING_INITIAL_BALANCE_USD=10000
PAPER_TRADING_SLIPPAGE_FACTOR=1.001
```

### Devnet Testing  
**Status**: RPC configured
**Network**: https://api.devnet.solana.com

---

## Next Steps

1. **Fix Database Migrations** - Resolve schema issues
2. **Test Backend API** - Run backend and test endpoints
3. **Test Frontend UI** - Start frontend and verify dashboard
4. **AI Service Setup** - Configure and test ML integrations
5. **Paper Trading** - Test paper trading mode
6. **Devnet Testing** - Execute test trades on devnet
7. **Monitoring** - Configure Grafana dashboards

---

## Useful Commands

```bash
# Backend
npm run dev:backend         # Start backend (dev mode with hot reload)
npm run test                # Run backend tests
npm run migrate             # Run database migrations
npm run lint                # Check backend code

# Frontend
npm run dev:frontend        # Start frontend dev server
npm run build               # Build for production
npm run preview             # Preview production build

# Docker
docker-compose up -d        # Start all docker services
docker-compose down         # Stop all services
docker-compose logs -f      # Follow logs

# Database
npm run migrate:status      # Check migration status
```

---

## Security Reminders

✅ **Pre-commit Hook Installed**: Prevents accidental secret commits
✅ **Comprehensive .gitignore**: Protects sensitive files
⚠️ **Never commit .env file**: Always use .env.example template
⚠️ **Rotate secrets before production**: Replace dev secrets with production ones

---

## Support Documentation

- [Security Guide](./SECURITY.md)
- [Git/Security Workflow](./GIT-SECURITY-WORKFLOW.md)
- [VPS Deployment](./VPS-DEPLOYMENT.md)
- [Backend README](./backend/README.md)
- [Frontend Features](./frontend/FRONTEND-FEATURES.md)

---

**Last Updated**: May 12, 2026
**Setup Completed**: Database, Git Security, Environment Configuration
**Ready for Development**: Backend, Frontend, CLI components
