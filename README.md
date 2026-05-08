# Institutional-Grade Solana Trading System

A complete end-to-end institutional-grade Solana trading system with real-time token detection, risk management, and automated execution capabilities.

## 🏗️ System Architecture

```
On-chain Events (Helius / Solana RPC Logs)
        ↓
        Event Ingestion Layer (Express + Zod validation)
                ↓
                Risk Engine (MANDATORY GATE)
                        ↓
                        Sniper / Trading Decision Engine
                                ↓
                        Smart Money Engine (wallet scoring)
                                        ↓
                        AI Prediction Engine (optional scoring boost)
                                                ↓
                        Execution Engine (Jupiter Swap ONLY)
                                                        ↓
                        Trade Confirmation Layer
                                                                ↓
                        WebSocket Event Bus
                                                                        ↓
                        Frontend Dashboard + CLI Terminal
```

## 🛠️ Tech Stack

### Backend
- **Node.js** (Express) - REST API server
- **WebSocket** (ws) - Real-time event broadcasting
- **Axios** - HTTP client for external APIs
- **dotenv** - Environment configuration
- **Zod** - Input validation (REQUIRED)
- **Winston** - Structured logging
- **@solana/web3.js** - Solana blockchain interaction

### Frontend
- **React** (Vite) - Modern web framework
- **TailwindCSS** - Utility-first CSS framework
- **reconnecting-websocket** - WebSocket client with auto-reconnect
- **React Hooks** - Real-time state management

### Blockchain Integration
- **Solana RPC** - Mainnet + devnet support
- **Jupiter Aggregator API v6** - DEX aggregation and swaps
- **Helius Webhooks** - Real-time event ingestion

### Optional AI Layer
- **Python FastAPI** - ML inference microservice
- **ML Models** - Signal scoring and prediction (placeholder ready)

## 🚀 Features

## 📦 Project Structure

```
HFT/
├── package.json
├── README.md
├── ai-service/
│   ├── main.py
│   ├── README.md
│   └── requirements.txt
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── integrations/
│   │   ├── helius.service.js
│   │   └── jupiter.service.js
│   ├── routes/
│   ├── services/
│   │   ├── eventPoller.js
│   │   ├── heliusWebhook.processor.js
│   │   └── engines/
│   │       ├── arbitrage.engine.js
│   │       ├── prediction.engine.js
│   │       ├── risk.engine.js
│   │       ├── smartmoney.engine.js
│   │       ├── sniper.engine.js
│   │       └── trading.engine.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── validator.js
│   └── ws/
│       └── websocket.server.js
├── cli/
│   ├── commands.js
│   └── terminal.js
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── LiveFeed.jsx
│       │   ├── TradePanel.jsx
│       │   ├── WalletConnector.jsx
│       │   └── WalletTracker.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Logs.jsx
│           ├── Portfolio.jsx
│           └── Sniper.jsx
└── .env
```
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Solana RPC endpoint
- Helius API key
- Jupiter API access

### 1. Environment Setup

Copy the `.env` file and configure:

```bash
RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your_helius_api_key
JUPITER_API_URL=https://quote-api.jup.ag/v6
AUTO_TRADE_ENABLED=false
DEFAULT_BUY_AMOUNT_SOL=0.1
MAX_SLIPPAGE_BPS=1500
RISK_MODE=strict
PORT=3001
WS_PORT=3002
```

### 2. Root Setup

```bash
npm install
npm run dev
```

### 3. Backend Setup (optional)

```bash
cd backend
npm install
npm run dev  # Development with nodemon
# or
npm start    # Production
```

### 5. AI Service Setup (Optional)

The system includes an optional Python FastAPI microservice for ML-powered predictions:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Enable in `.env`:
```bash
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_ENABLED=true
```

### 6. CLI Terminal (optional)

```bash
cd cli
node terminal.js
```
## 🐳 Docker Deployment

The system includes complete Docker containerization for production deployment.

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start with Docker

1. **Clone and configure environment:**
```bash
git clone <repository-url>
cd HFT
cp .env.example .env
# Edit .env with your configuration
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Check service health:**
```bash
docker-compose ps
```

### Services Available

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **AI Service**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **pgAdmin**: http://localhost:5050 (admin@example.com/admin)

### Development with Docker

For development with hot reload:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

### Production Deployment

1. **Update environment variables in `.env`:**
   - Change all default passwords
   - Set production database credentials
   - Configure proper JWT secrets
   - Set up monitoring webhooks

2. **Build and deploy:**
```bash
docker-compose up -d --build
```

3. **Scale services if needed:**
```bash
docker-compose up -d --scale backend=3
```

### Docker Commands

```bash
# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Update service
docker-compose up -d --build backend

# Clean up
docker-compose down -v
```
### 4. CLI Usage

```bash
cd cli
node terminal.js
```

## 🎯 Usage

### CLI Commands

```bash
# System Control
start-sniper          # Start token detection
stop-sniper           # Stop token detection
status                # Show system status
enable-auto-trade     # Enable automatic trading
disable-auto-trade    # Disable automatic trading

# Trading
buy <token_mint> [amount]    # Buy token
sell <token_mint> [amount]   # Sell token

# Wallet Management
create-wallet <name>         # Create internal wallet
connect-wallet <pubkey> [name] # Connect external wallet
set-wallet <pubkey>          # Set active wallet
list-wallets                 # List all wallets

# Monitoring
logs                        # Stream live logs
help                        # Show help
exit                        # Exit terminal
```

### Web Dashboard

1. **Dashboard**: Live token feed, trade panel, smart money tracker
2. **Sniper**: Control panel for automated trading
3. **Portfolio**: Wallet management and analysis
4. **Logs**: Real-time system monitoring

## 🔒 Security Features

### Risk Engine Validation
- ✅ Liquidity threshold checks
- ✅ Mint authority revocation
- ✅ Freeze authority revocation
- ✅ Token blacklist validation
- ✅ Wallet concentration analysis
- ✅ Suspicious pattern detection

### Execution Safety
- 🔄 Retry mechanism (max 2 retries)
- ⏱️ Timeout handling (30s)
- 📊 Structured logging
- 🚫 Fallback failure handling
- ⚡ WebSocket event broadcasting

### Wallet Security
- 🔐 Internal wallet generation
- 🔑 External wallet support
- 🛡️ Encrypted key storage (configurable)
- ✅ CLI-first provisioning

## 📊 API Endpoints

### System Control
- `POST /sniper/start` - Start sniper
- `POST /sniper/stop` - Stop sniper
- `GET /sniper/status` - Get status
- `POST /sniper/enable-auto-trade` - Enable auto trade
- `POST /sniper/disable-auto-trade` - Disable auto trade

### Trading
- `POST /trade/buy` - Execute buy order
- `POST /trade/sell` - Execute sell order

### Wallet Management
- `POST /wallet/create` - Create wallet
- `POST /wallet/connect` - Connect external wallet
- `POST /wallet/set-active` - Set active wallet
- `GET /wallets` - List wallets and active wallet
- `GET /wallet/active` - Get currently active wallet

### Analysis
- `GET /smart-money/:wallet` - Analyze wallet
- `GET /smart-money/signal/:token` - Get smart signal
- `GET /arbitrage/check/:token` - Check arbitrage

### Testing
- `POST /token/detect` - Simulate token detection

## 🔧 Configuration

### Risk Parameters
```javascript
minLiquidity: 1000,        // Minimum SOL liquidity
maxWalletConcentration: 0.5, // Max 50% in one wallet
blacklist: [],             // Token blacklist
```

### Trading Parameters
```javascript
DEFAULT_BUY_AMOUNT_SOL: 0.1,
MAX_SLIPPAGE_BPS: 1500,     // 15% max slippage
AUTO_TRADE_ENABLED: false,  // Manual control by default
```

## 🚨 Important Warnings

### Risk Management
- **ALWAYS TEST FIRST**: Use devnet for testing
- **START SMALL**: Begin with minimal amounts
- **MONITOR CLOSELY**: Watch positions and logs
- **NO GUARANTEES**: This system does not guarantee profits
- **RISK OF LOSS**: Trading cryptocurrencies involves substantial risk

### Technical Notes
- **MEV Awareness**: System does not assume guaranteed execution
- **Network Conditions**: Performance depends on Solana network state
- **API Limits**: Respect rate limits for external APIs
- **Backup Systems**: Implement monitoring and alerting

## 🤝 Contributing

This is a production-grade system. Contributions should:
- Maintain security standards
- Include comprehensive testing
- Follow existing code patterns
- Update documentation

## 📄 License

This project is for educational and research purposes. Use at your own risk.

## ⚠️ Disclaimer

This software is provided "as is" without warranty of any kind. Cryptocurrency trading involves significant risk of loss. The authors are not responsible for any financial losses incurred through the use of this software.

---

**Remember**: This system prioritizes safety over speed. Risk management is mandatory and cannot be disabled. Always trade responsibly.