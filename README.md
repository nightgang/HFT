# HFT Solana Trading System

<div align="center">

**High-Frequency Trading System for Solana Blockchain**

![Status](https://img.shields.io/badge/status-active-brightgreen)
![JavaScript](https://img.shields.io/badge/javascript-88.6%25-yellow)
![TypeScript](https://img.shields.io/badge/typescript-supported-blue)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## 📋 Overview

HFT is an institutional-grade, high-frequency trading system designed for the Solana blockchain. It combines real-time market monitoring, automated trade execution, advanced risk management, and professional-grade trading tools into a single integrated platform.

### Key Features

- **🚀 Auto-Trading Engine**: Execute trades automatically based on market conditions
- **💎 Smart Order Types**: Advanced orders with stop-loss, take-profit (3-tier), trailing stops, and breakeven protection
- **📊 Real-Time Monitoring**: Live price updates, portfolio tracking, and risk dashboard
- **🎯 Katana Terminal**: Professional command-line trading interface for advanced users
- **🔐 Enterprise Security**: JWT authentication, encryption, rate limiting, and audit logs
- **📈 Risk Management**: Position limits, correlation analysis, and predictive alerts
- **⚙️ AI Integration**: Machine learning-based market analysis and signal generation (optional)
- **📊 Observability**: Prometheus metrics, Grafana dashboards, structured logging
- **🐳 Production Ready**: Docker, Kubernetes, and PM2 deployment options
- **🔗 Multi-Chain**: Cross-chain trading and arbitrage capabilities

---

## 🏗️ Project Structure

```
HFT/
├── backend/                 # Node.js backend service
│   ├── index.js            # Main entry point
│   ├── routes/             # API endpoints
│   ├── services/           # Business logic
│   ├── models/             # Database models
│   ├── middleware/         # Auth, monitoring, error handling
│   ├── integrations/       # Solana, Jupiter, Helius
│   ├── db/                 # Database migrations
│   └── tests/              # Jest test suite
├── frontend/               # React/Vite frontend app
│   ├── src/
│   ├── components/         # React components
│   ├── pages/              # Route pages
│   └── styles/             # Tailwind CSS
├── cli/                    # Katana Terminal CLI
│   └── katana-terminal.js  # Interactive trading terminal
├── ai-service/             # Python AI/ML service (optional)
├── db/                     # Database schema and migrations
├── k8s/                    # Kubernetes deployment manifests
├── monitoring/             # Prometheus & Grafana config
└── docker-compose.yml      # Local development environment
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+
- **npm**: v9+
- **Docker**: v20+ (for containerized setup)
- **Git**: Latest version

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nightgang/HFT.git
   cd HFT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Solana RPC endpoint and other secrets
   ```

4. **Start services with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Run migrations**
   ```bash
   npm run migrate
   ```

6. **Start development environment**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend server: http://localhost:3000
   - Frontend app: http://localhost:5173
   - Database: localhost:5432
   - Redis: localhost:6379
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001

### Verify Installation

```bash
# Check backend health
curl http://localhost:3000/api/health

# Check frontend is running
curl http://localhost:5173

# Verify database connection
npm run migrate:status
```

---

## 📚 Architecture Overview

The system uses a **modular, microservices-ready architecture**:

```
┌─────────────────┐         ┌──────────────────┐
│    Frontend     │◄────────►│  Backend API     │
│   (React/Vite) │ (WebSockets & REST) │
└─────────────────┘         └──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │PostgreSQL│    │  Redis   │    │ Solana   │
              │Database  │    │  Cache   │    │   RPC    │
              └──────────┘    └──────────┘    └──────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    ┌────────┐ ┌────────┐ ┌──────────┐
    │ Jupiter│ │ Helius │ │Jito Bundles
    │  DEX   │ │ Oracle │ └──────────┘
    └────────┘ └────────┘

┌─────────────────────────────────────┐
│   Monitoring & Observability        │
│  (Prometheus, Grafana, Winston Log) │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Optional AI Service (Python)      │
│  (Market Analysis & Signal Gen)     │
└─────────────────────────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design.

---

## 🔧 Development

### Available Commands

```bash
# Development
npm run dev              # Run frontend & backend concurrently
npm run dev:backend    # Backend only (http://localhost:3000)
npm run dev:frontend   # Frontend only (http://localhost:5173)

# Testing
npm run test           # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Code Quality
npm run lint           # ESLint check
npm run format         # Prettier auto-format
npm run typecheck      # TypeScript validation
npm run audit          # npm security audit

# Database
npm run migrate        # Run pending migrations
npm run migrate:status # Check migration status

# Production
npm run pm2:start      # Start with PM2
npm run pm2:stop       # Stop PM2 processes
npm run backup         # Database backup

# Trading CLI
npm run katana         # Launch Katana trading terminal
```

### Backend Development

The backend is structured as follows:

- **Routes** (`backend/routes/`): API endpoints for trading, auth, portfolio
- **Services** (`backend/services/`): Core business logic and integrations
- **Models** (`backend/models/`): Database models (SQLite/PostgreSQL)
- **Middleware** (`backend/middleware/`): Auth, logging, error handling
- **Utils** (`backend/utils/`): Helpers and utility functions

Key backend features:
- JWT authentication
- WebSocket support for real-time updates
- Prometheus metrics collection
- Error handling and logging with Winston
- Rate limiting with express-rate-limit

### Frontend Development

Built with React, Vite, and Tailwind CSS:

- Real-time trading dashboard
- Portfolio overview and analytics
- Trade execution interface
- Settings and configuration panel
- Responsive design for desktop and tablet

---

## 🔗 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Main Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/register` - New user registration

#### Trading
- `POST /trades/execute` - Execute a trade
- `GET /trades/history` - Get trade history
- `GET /trades/:id` - Get trade details

#### Portfolio
- `GET /portfolio` - Get portfolio overview
- `GET /portfolio/balance` - Get current balance

#### Advanced Features
- `GET /advanced-orders` - List advanced orders
- `POST /advanced-orders` - Create advanced order
- `DELETE /advanced-orders/:id` - Cancel order

#### System
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

Full API documentation available at: `http://localhost:3000/api-docs` (Swagger UI)

---

## 📊 Monitoring

### Prometheus Metrics

Access at: `http://localhost:9090`

Key metrics:
- Trade execution time
- Success/failure rates
- Order book depth
- Portfolio value over time
- System resource usage

### Grafana Dashboards

Access at: `http://localhost:3001` (admin/admin)

Pre-built dashboards:
- Trading Performance Dashboard
- System Health Dashboard
- Resource Usage Dashboard

### Logging

Logs are written to:
- Console (development)
- `backend/logs/` directory (file)
- Structured JSON format for aggregation

---

## 🔐 Security

### Key Security Features

- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **Rate Limiting**: Prevent brute force and DDoS
- ✅ **CORS Protection**: Configurable cross-origin headers
- ✅ **CSRF Protection**: Token-based CSRF defense
- ✅ **Helmet**: HTTP headers security
- ✅ **Encryption**: AES encryption for sensitive data
- ✅ **Audit Logging**: All transactions logged
- ✅ **Secret Management**: Environment-based secrets

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=hft_user
DB_PASSWORD=secure_password
DB_NAME=hft_trading

# Redis
REDIS_URL=redis://localhost:6379

# Solana
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
SOLANA_WS_ENDPOINT=wss://api.mainnet-beta.solana.com

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# Encryption
MASTER_ENCRYPTION_KEY=your_encryption_key

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info

# AI Service (optional)
AI_SERVICE_URL=http://ai-service:5000
ENABLE_AI_SERVICE=false
```

See `.env.example` for all required variables.

---

## 📚 Trading Guide

For detailed information on the Katana Terminal and trading strategies, see [TRADING_GUIDE.md](TRADING_GUIDE.md).

### Quick Trading Example

```javascript
// Execute a swap trade
POST /api/trades/execute
{
  "action": "BUY",
  "token": "SOL",
  "amount": 1.0,
  "maxSlippage": 1.0,
  "stopLoss": 0.95,
  "takeProfit": 1.10
}
```

---

## 🐳 Deployment

### Docker Compose (Local Development)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Kubernetes (Production)

```bash
# Create namespace
kubectl create namespace hft

# Apply manifests
kubectl apply -f k8s/

# View deployment
kubectl get pods -n hft
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### PM2 (Production Process Manager)

```bash
npm run pm2:start   # Start all processes
npm run pm2:status  # View status
npm run pm2:stop    # Stop processes
npm run pm2:restart # Restart
```

---

## 🧪 Testing

### Run Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Types

- **Unit Tests**: Individual function/service testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full workflow testing
- **Load Tests**: Performance under load

### Test Coverage Target: >80%

---

## 🤖 AI Service (Optional)

The optional AI service provides:
- Market sentiment analysis
- Price prediction signals
- Anomaly detection
- Risk scoring

To enable:

1. Start AI service:
   ```bash
   cd ai-service
   docker build -f Dockerfile -t hft-ai .
   docker run -p 5000:5000 hft-ai
   ```

2. Enable in `.env`:
   ```bash
   ENABLE_AI_SERVICE=true
   AI_SERVICE_URL=http://localhost:5000
   ```

---

## 📈 Performance Metrics

Expected performance:
- **API Response Time**: <100ms (p95)
- **Trade Execution**: <200ms
- **WebSocket Latency**: <50ms
- **Database Queries**: <10ms (p95)
- **Cache Hit Rate**: >90%

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Check Node version
node --version  # Should be v18+

# Clear npm cache
npm cache clean --force
npm install
```

### Database connection error

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check credentials
psql -U hft_user -d hft_trading -h localhost

# Run migrations
npm run migrate
```

### Redis connection issues

```bash
# Verify Redis is running
redis-cli ping  # Should return PONG

# Check Redis connection
redis-cli
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes and commit: `git commit -m 'Add amazing feature'`
3. Push to the branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

### Code Standards

- Follow ESLint rules: `npm run lint`
- Format code with Prettier: `npm run format`
- Write tests for new features
- Maintain >80% code coverage
- Use TypeScript where possible

---

## 📄 License

MIT License - see LICENSE file for details

---

## 📞 Support

- **Documentation**: See docs/ folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Security**: security@example.com

---

## 🎯 Roadmap

- [ ] v1.1: Advanced backtesting engine
- [ ] v1.2: Mobile app (React Native)
- [ ] v1.3: Multi-chain support expansion
- [ ] v1.4: AI-powered strategy generation
- [ ] v2.0: Institutional grade features

---

## 📖 Additional Resources

- [Architecture Guide](ARCHITECTURE.md)
- [Trading Guide](TRADING_GUIDE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](http://localhost:3000/api-docs)
- [Solana Documentation](https://docs.solana.com)
- [Jupiter Protocol](https://docs.jup.ag)

---

**Built with ❤️ for high-frequency traders**

Last Updated: 2026-05-13
