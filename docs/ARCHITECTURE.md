# Architecture Guide

## System Overview

HFT is a distributed, modular trading system built on modern web technologies with a focus on performance, security, and scalability.

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Client Layer                           │
│  ┌──────────────────┐              ┌───────────────┐   │
│  │ Web Frontend     │              │ Katana CLI    │   │
│  │ (React/Vite)    │              │ (Node.js)     │   │
│  └──────────────────┘              └───────────────┘   │
└────────────┬─────────────────────────────────┬──────────┘
             │                                 │
    HTTP/WebSocket                    REST API
             │                                 │
┌────────────▼─────────────────────────────────▼──────────┐
│               API Gateway / Backend                       │
│  (Express.js Server on port 3000)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                 │   │
│  │ ├─ Authentication (JWT)                         │   │
│  │ ├─ Rate Limiting                                │   │
│  │ ├─ CORS & Security Headers (Helmet)            │   │
│  │ ├─ Request Logging                              │   │
│  │ └─ Error Handling                               │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Route Handlers                                   │   │
│  │ ├─ Trading Routes                               │   │
│  │ ├─ Auth Routes                                  │   │
│  │ ├─ Portfolio Routes                             │   │
│  │ ├─ System Routes                                │   │
│  │ ├─ Advanced Features Routes                      │   │
│  │ └─ Health & Metrics Routes                      │   │
│  └──────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────┬───────────┘
             │                                │
        ┌────▼────────┐          ┌────────────▼────┐
        │   Services  │          │  Integrations  │
        └────┬────────┘          └────────────┬────┘
             │                                │
     ┌───────┴────────┬──────────────────────┬───────┐
     │                │                      │       │
     ▼                ▼                      ▼       ▼
┌──────────┐    ┌──────────┐           ┌─────────┐ ┌────────┐
│ Trading  │    │Portfolio │           │ Solana  │ │ Jupiter│
│Service   │    │Service   │           │ RPC     │ │ DEX    │
└──────────┘    └──────────┘           └─────────┘ └────────┘

     ┌──────────────────────────────────────────────┐
     │          Data Layer                          │
     │  ┌────────────────┐     ┌──────────────────┐ │
     │  │  PostgreSQL    │     │  Redis Cache     │ │
     │  │  (Persistent)  │     │  (Session/Cache) │ │
     │  └────────────────┘     └──────────────────┘ │
     └──────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────┐
     │     Observability & Monitoring               │
     │  ┌──────────────┐   ┌───────────────────┐   │
     │  │ Prometheus   │   │ Grafana Dashboards│   │
     │  │ (Metrics)    │   │ (Visualization)   │   │
     │  └──────────────┘   └───────────────────┘   │
     │  ┌──────────────┐                            │
     │  │ Winston Logs │                            │
     │  │ (Structured) │                            │
     │  └──────────────┘                            │
     └──────────────────────────────────────────────┘
```

---

## 📁 Backend Directory Structure

```
backend/
├── index.js                    # Express app entry point
├── ecosystem.config.js         # PM2 configuration
├── jest.config.js              # Jest test configuration
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
│
├── middleware/                 # Express middleware
│   ├── auth.js                 # JWT authentication
│   └── monitoring.middleware.js # Prometheus & logging
│
├── routes/                     # API endpoint handlers
│   ├── tradingRoutes.js
│   ├── user.routes.js
│   ├── wallet.routes.js
│   ├── advanced-features.routes.js
│   ├── arbitrageRoutes.js
│   ├── smartMoneyRoutes.js
│   ├── sniperRoutes.js
│   ├── jito-bundle-routes.js
│   └── systemRoutes.js
│
├── services/                   # Business logic
│   ├── trading.service.js      # Core trading logic
│   ├── advanced-orders.service.js
│   ├── auto-trade.service.js
│   ├── backtesting.service.js
│   ├── portfolio.service.js
│   ├── analytics.service.js
│   ├── cache.service.js
│   ├── correlation.service.js
│   ├── cloning-derivatives.service.js
│   ├── cross-chain.service.js
│   ├── backup.service.js
│   ├── risk-management.service.js
│   └── [15+ other specialized services]
│
├── models/                     # Database models (ORM/Queries)
│   ├── user.model.js
│   ├── trade.model.js
│   ├── wallet.model.js
│   ├── advanced-order.model.js
│   ├── portfolio.model.js
│   ├── sentiment.model.js
│   ├── risk-heatmap.model.js
│   └── [other domain models]
│
├── repositories/               # Data access layer
│   └── wallet.repository.js
│
├── integrations/               # External API integrations
│   ├── solana.service.js
│   ├── jupiter.service.js      # DEX integration
│   ├── helius.service.js       # Oracle/indexing
│   └── jito.service.js         # Bundle protocol
│
├── db/                         # Database management
│   ├── connection.js           # Database connection pool
│   ├── migrate.js              # Migration runner
│   └── migrations/             # SQL migration files
│
├── utils/                      # Utility functions
│   ├── validators.js
│   ├── errorHandlers.js
│   ├── logger.js               # Winston logger setup
│   ├── encryption.js
│   └── formatters.js
│
├── ws/                         # WebSocket handlers
│   ├── priceUpdates.js
│   ├── tradeUpdates.js
│   └── notifications.js
│
├── tests/                      # Test suite
│   ├── trading.test.js
│   ├── auth.test.js
│   └── integration/
│
└── logs/                       # Application logs
    ├── error.log
    ├── combined.log
    └── [other logs]
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users & Authentication
users
├─ id (PK)
├─ email (UNIQUE)
├─ username (UNIQUE)
├─ password_hash
├─ created_at
└─ updated_at

-- Wallets & Assets
wallets
├─ id (PK)
├─ user_id (FK)
├─ address
├─ balance_sol
├─ balance_usdc
└─ last_updated

-- Trading
trades
├─ id (PK)
├─ user_id (FK)
├─ wallet_id (FK)
├─ token_in
├─ token_out
├─ amount_in
├─ amount_out
├─ tx_hash
├─ status (PENDING|SUCCESS|FAILED)
├─ slippage
├─ fee
├─ executed_at
└─ created_at

-- Advanced Orders
advanced_orders
├─ id (PK)
├─ user_id (FK)
├─ trade_id (FK)
├─ order_type (STOP_LOSS|TAKE_PROFIT|TRAILING_STOP)
├─ trigger_price
├─ quantity
├─ status (ACTIVE|EXECUTED|CANCELLED)
└─ created_at

-- Portfolio
portfolio
├─ id (PK)
├─ user_id (FK)
├─ total_value_usd
├─ total_value_sol
├─ change_24h_percent
└─ last_updated

-- Trading History
trade_history_aggregation
├─ id (PK)
├─ user_id (FK)
├─ daily_volume
├─ win_rate
├─ avg_profit_loss
├─ date
└─ updated_at
```

### Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_timestamp ON trades(executed_at DESC);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_advanced_orders_status ON advanced_orders(status);
CREATE INDEX idx_portfolio_user_id ON portfolio(user_id);
```

---

## 🔄 Service Layer Architecture

### Trading Service Flow

```
┌─────────────────────────────────────────┐
│ Client Initiates Trade                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Validate Request                        │
│ • Check balance                         │
│ • Verify token existence                │
│ • Check risk limits                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Check Liquidity                         │
│ • Query Jupiter DEX                     │
│ • Estimate slippage                     │
│ • Get best route                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Build Transaction                       │
│ • Construct Solana tx                   │
│ • Add fees (Jito bundle optional)       │
│ • Sign with keypair                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Execute Trade                           │
│ • Send to Solana RPC                    │
│ • Wait for confirmation                 │
│ • Monitor transaction                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Record Trade                            │
│ • Store in database                     │
│ • Update portfolio                      │
│ • Cache results                         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Broadcast Updates                       │
│ • WebSocket notifications               │
│ • Update client UI                      │
│ • Emit metrics                          │
└─────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────┐
│ User Login with credentials      │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Hash password & compare          │
│ (bcryptjs)                       │
└──────────────┬───────────────────┘
               │
               ▼ (Match)
┌──────────────────────────────────┐
│ Generate JWT Token               │
│ • User ID                        │
│ • Permissions                    │
│ • Expiry (24h default)           │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Return token to client           │
│ • Stored in localStorage/cookie  │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Client sends JWT with requests   │
│ • Authorization: Bearer <token>  │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Middleware verifies JWT          │
│ • Check signature                │
│ • Check expiry                   │
│ • Extract user info              │
└──────────────┬───────────────────┘
               │ (Valid)
               ▼
┌──────────────────────────────────┐
│ Allow request to proceed         │
└──────────────────────────────────┘
```

---

## 📡 WebSocket Architecture

### Real-Time Update Channels

```javascript
// Price updates (multiple subscriptions)
ws://localhost:3000/ws/prices/{token}
├─ Real-time token prices
├─ Update frequency: 100ms
└─ Includes bid/ask spread

// Trade notifications
ws://localhost:3000/ws/trades/{user_id}
├─ Personal trade executions
├─ Status updates
└─ Fills & partial fills

// Portfolio updates
ws://localhost:3000/ws/portfolio/{user_id}
├─ Balance changes
├─ Position updates
└─ P&L calculations

// System notifications
ws://localhost:3000/ws/system
├─ Maintenance alerts
├─ Market halts
└─ Service announcements
```

---

## 💾 Caching Strategy

### Redis Cache Layers

```
┌─────────────────────────────────────┐
│ Cache Layer (Redis)                 │
├─────────────────────────────────────┤
│                                     │
│ Session Cache (TTL: 1 day)         │
│ ├─ JWT tokens                      │
│ ├─ User sessions                   │
│ └─ Refresh tokens                  │
│                                     │
│ Data Cache (TTL: 5-60 minutes)     │
│ ├─ Token prices                    │
│ ├─ Portfolio summaries             │
│ ├─ Trade history snippets          │
│ └─ User preferences                │
│                                     │
│ Rate Limit Cache (TTL: 1 minute)  │
│ ├─ API call counters               │
│ ├─ IP-based limits                 │
│ └─ User-based limits               │
│                                     │
│ Queue Cache (TTL: varies)          │
│ ├─ Pending trades                  │
│ ├─ Failed notifications            │
│ └─ Retry queue                     │
│                                     │
└─────────────────────────────────────┘
```

### Cache Invalidation Strategy

- **Time-based**: TTL expiration
- **Event-based**: On trade execution, portfolio changes
- **Manual**: Admin cache clear operations

---

## 📊 Monitoring & Observability

### Prometheus Metrics Collected

```
hft_trade_execution_duration_seconds
  └─ histogram with labels: token_pair, status

hft_active_trades_total
  └─ gauge: current open positions

hft_trade_success_rate
  └─ counter: successful vs failed trades

hft_portfolio_value_usd
  └─ gauge per user

hft_cache_hit_ratio
  └─ counter: cache hits vs misses

hft_database_query_duration_seconds
  └─ histogram: query performance

hft_websocket_connections
  └─ gauge: active WebSocket connections

hft_api_request_duration_seconds
  └─ histogram with labels: endpoint, method, status
```

### Structured Logging

Winston logger configured with:
- **Console transport** (development)
- **File transport** (production)
- **JSON format** (for aggregation)
- **Log levels**: error, warn, info, debug, verbose

Log structure:
```json
{
  "timestamp": "2026-05-13T10:30:45.123Z",
  "level": "info",
  "service": "trading-service",
  "userId": "user-123",
  "action": "trade_executed",
  "token": "SOL",
  "amount": 1.5,
  "duration_ms": 245,
  "status": "success"
}
```

---

## 🔌 Integration Points

### Solana Integration

- **Web3.js Library**: For blockchain interaction
- **Keypair Management**: Secure key storage and signing
- **Transaction Building**: Custom tx construction
- **RPC Endpoints**: Configurable node connections

### Jupiter DEX Integration

- **Quote API**: For price quotes and routes
- **Swap API**: For token swaps
- **Limit Orders**: Advanced order types
- **Route Optimization**: Best path finding

### Helius Indexing

- **Token Metadata**: Token details and metadata
- **Event Parsing**: On-chain event monitoring
- **Balance Tracking**: Real-time balance updates

### Jito Bundle Protocol

- **Bundle Construction**: Atomic transaction bundles
- **MEV Optimization**: Tippage strategies
- **Searcher API**: Private pool access

---

## 🚀 Deployment Architecture

### Development (Docker Compose)

```
┌────────────────────────────────────┐
│ docker-compose.yml                 │
├────────────────────────────────────┤
│ ├─ Backend Container               │
│ ├─ Frontend Container              │
│ ├─ PostgreSQL Container            │
│ ├─ Redis Container                 │
│ ├─ Prometheus Container            │
│ └─ Grafana Container               │
└────────────────────────────────────┘
```

### Staging/Production (Kubernetes)

```
┌─────────────────────────────────────┐
│ Kubernetes Cluster                  │
├─────────────────────────────────────┤
│                                     │
│ Namespace: hft                      │
│ ├─ Backend Deployment (3 replicas) │
│ ├─ Frontend Deployment             │
│ ├─ ConfigMap (config)              │
│ ├─ Secrets (credentials)           │
│ ├─ Service (LoadBalancer)          │
│ ├─ Ingress (routing)               │
│ └─ PersistentVolumes               │
│                                     │
│ External Services:                  │
│ ├─ PostgreSQL (RDS/managed)        │
│ ├─ Redis (ElastiCache)             │
│ └─ Solana RPC (external)           │
│                                     │
└─────────────────────────────────────┘
```

### PM2 Production Manager

```
ecosystem.config.js
├─ Backend instances (cluster mode)
├─ API server
├─ WebSocket server
├─ Worker processes (async jobs)
├─ Cron jobs (cleanups, backups)
└─ Log management
```

---

## 🔄 Data Flow Examples

### Trading Execution Flow

```
Frontend
   │
   │ POST /api/trades/execute
   │ { token: "SOL", amount: 1.0, ... }
   │
   ├─ Authentication Middleware ✓
   │
   ├─ Validation Service
   │  ├─ Check user balance
   │  ├─ Check risk limits
   │  └─ Verify token
   │
   ├─ Trading Service
   │  ├─ Query Jupiter for quote
   │  ├─ Build transaction
   │  ├─ Execute on Solana
   │  └─ Wait for confirmation
   │
   ├─ Database Update
   │  ├─ Record trade
   │  ├─ Update portfolio
   │  └─ Update wallet balance
   │
   ├─ Cache Update
   │  ├─ Invalidate portfolio cache
   │  ├─ Update balance cache
   │  └─ Queue WebSocket update
   │
   ├─ Monitoring
   │  ├─ Record metrics
   │  ├─ Log transaction
   │  └─ Send alert (if applicable)
   │
   └─ Response
      │ HTTP 200 OK
      │ { tradeId, status, hash, ... }
      │
      └─ WebSocket Broadcast
         │ Real-time updates to connected clients
         │
         └─ Frontend UI Update
```

---

## 📈 Scalability Considerations

### Horizontal Scaling

- **Stateless Backend**: All instances can serve any request
- **Load Balancer**: Distribute traffic across instances
- **Session Storage**: Uses Redis (not in-memory)
- **Database Connection Pool**: pg-pool for efficient connections

### Vertical Scaling

- **Node.js Cluster Mode**: PM2 handles multi-core utilization
- **Memory Optimization**: Caching reduces DB hits
- **Async Operations**: Non-blocking I/O for throughput

### Performance Optimization

- **Database Indexes**: Strategic indexing on frequently queried columns
- **Query Optimization**: Minimal SELECT, JOIN optimization
- **Batch Operations**: Bulk inserts for trade history
- **CDN**: Frontend assets served from CDN

---

## 🔒 Security Architecture

### Defense Layers

```
┌─────────────────────────────────────┐
│ Layer 1: Network                    │
│ ├─ Firewall rules                   │
│ ├─ VPC isolation                    │
│ └─ DDoS protection                  │
├─────────────────────────────────────┤
│ Layer 2: API Gateway                │
│ ├─ Rate limiting                    │
│ ├─ CORS validation                  │
│ └─ CSRF protection                  │
├─────────────────────────────────────┤
│ Layer 3: Authentication             │
│ ├─ JWT verification                 │
│ ├─ Password hashing                 │
│ └─ Session validation               │
├─────────────────────────────────────┤
│ Layer 4: Authorization              │
│ ├─ Role-based access                │
│ ├─ Resource ownership check         │
│ └─ Permission validation            │
├─────────────────────────────────────┤
│ Layer 5: Application                │
│ ├─ Input validation                 │
│ ├─ SQL injection prevention         │
│ ├─ XSS protection                   │
│ └─ Error handling                   │
├─────────────────────────────────────┤
│ Layer 6: Data                       │
│ ├─ Encryption at rest               │
│ ├─ Encryption in transit (TLS)     │
│ └─ Secure key management            │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Architecture

### Test Pyramid

```
           ▲
          /|\
         / | \
        /  |  \      E2E Tests
       /   |   \     (10%)
      ┌────┴────┐
      |          |
      |   ╱──╲   |    Integration Tests
      |  ╱    ╲  |    (20%)
      │ ╱      ╲ │
     ┌┴─────────┴┐
     │           │
     │     ╱──╲  │    Unit Tests
     │    ╱    ╲ │    (70%)
     │   ╱      ╲│
     └─────────┬─┘
         │     │
```

Test Types:
- **Unit**: Service functions, utilities, models
- **Integration**: API endpoints, database interactions
- **E2E**: Full user workflows, trading scenarios
- **Performance**: Load testing, stress testing
- **Security**: Penetration testing, vulnerability scanning

---

## 📝 Deployment Checklist

Before production deployment:

1. **Code**
   - [ ] All tests passing
   - [ ] Code coverage >80%
   - [ ] ESLint/Prettier applied
   - [ ] Security audit completed

2. **Infrastructure**
   - [ ] Database backups configured
   - [ ] Redis replication enabled
   - [ ] Monitoring alerts active
   - [ ] Log aggregation working

3. **Security**
   - [ ] All secrets in secure vault
   - [ ] SSL/TLS certificates valid
   - [ ] CORS configured correctly
   - [ ] Rate limiting active

4. **Performance**
   - [ ] Load test passed
   - [ ] Cache hit rate >90%
   - [ ] API response time <100ms p95
   - [ ] Database queries optimized

5. **Operations**
   - [ ] Runbooks prepared
   - [ ] On-call rotation set
   - [ ] Incident response plan
   - [ ] Backup/restore tested

---

**Architecture Last Updated**: 2026-05-13

See also:
- [README.md](README.md) - Project overview
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [TRADING_GUIDE.md](TRADING_GUIDE.md) - Trading features
