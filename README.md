# HFT - Solana Trading System

Sistem trading otomatis untuk Solana blockchain dengan AI-powered signal scoring.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- Python 3.9+

### Installation

```bash
# Clone repository
git clone https://github.com/nightgang/HFT.git
cd HFT

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### Running the System

**Development Mode:**
```bash
# Run backend + frontend secara bersamaan
npm run dev

# Atau jalankan terpisah:
npm run dev:backend  # Backend di port 3000
npm run dev:frontend # Frontend di port 5173
```

**CLI Mode:**
```bash
npm run cli
```

**Katana Mode (Ultra-fast Trading):**
```bash
# Terminal mode
npm run katana

# Or access via web dashboard at /katana
```

**Production:**
```bash
npm run start-backend
npm run start-frontend
```

## Cara Menggunakan

### 1. Setup Wallet
```
CLI → Login → Add Wallet → Input private key
```

### 2. Trading via Web Dashboard
1. Buka http://localhost:5173
2. Login dengan akun Anda
3. Lihat real-time price chart
4. Click "BUY" atau "SELL" untuk trade
5. Lihat order history

### 3. Trading via CLI
```bash
npm run cli

# Command tersedia:
- account login      # Login
- wallet add        # Tambah wallet
- trade buy         # Beli token
- trade sell        # Jual token
- portfolio view    # Lihat portfolio
- order history     # Lihat riwayat order
```

## API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
```

### Trading
```
POST   /api/trades/execute      # Execute trade
GET    /api/trades/history      # Order history
GET    /api/portfolio/balance   # Lihat balance
```

### Market Data
```
GET    /api/market/price/:token    # Get price
GET    /api/market/chart/:token    # Get chart data
```

### AI Predictions
```
POST   /api/ai/predict/:token     # Get trade signal
```

## ⚔️ Katana Mode (Ultra-fast Trading)

Katana Mode adalah sistem trading ultra-cepat untuk meme coin Solana dengan fitur-fitur canggih:

### 🚀 Fitur Utama

- **Ultra Fast Execution**: Optimasi kecepatan eksekusi dengan priority fees
- **Sniper Features**: Deteksi peluncuran token baru secara real-time
- **Risk Protection**: Deteksi honeypot, freeze authority, dan risiko lainnya
- **TP System**: Take Profit otomatis (TP1: 200%, TP2: 400%, TP3: 600%)
- **Multi-wallet**: Eksekusi trading di multiple wallet secara bersamaan

### 🎯 Cara Menggunakan Katana Mode

#### Web Dashboard
1. Buka http://localhost:5173
2. Pilih tab "⚔️ Katana"
3. Klik "Start Katana" untuk mengaktifkan
4. Pilih token dari live feed
5. Klik "Buy Token" untuk trading otomatis

#### Terminal Mode
```bash
npm run katana

# Commands:
start          # Start Katana Mode
stop           # Stop Katana Mode
status         # Show current status
buy <amount>   # Buy selected token
sell <amount>  # Sell selected token
select <mint>  # Select token for trading
positions      # Show active positions
help           # Show help
exit           # Exit terminal
```

### 🛡️ Risk Management

Katana Mode secara otomatis mendeteksi:
- **Honeypot tokens** (freeze/mint authority tidak revoked)
- **Liquidity removal** (penarikan liquidity yang mencurigakan)
- **Suspicious dev wallets** (wallet developer memiliki terlalu banyak supply)
- **Rug pull indicators** (sinyal-sinyal manipulasi harga)

### ⚙️ Konfigurasi Katana

Tambahkan ke `.env`:

```env
# Katana Mode
KATANA_ENABLED=true
KATANA_TERMINAL_MODE=false
KATANA_WS_PORT=3003

# Trading Config
KATANA_MAX_CONCURRENT_TRADES=5
KATANA_MIN_LIQUIDITY_SOL=5
KATANA_MAX_SLIPPAGE=0.3
KATANA_AUTO_BUY_ENABLED=true

# Strategy
KATANA_TP1_PROFIT=200
KATANA_TP1_SELL=30
KATANA_TP2_PROFIT=400
KATANA_TP2_SELL=30
KATANA_TP3_PROFIT=600
KATANA_TP3_SELL=100

# Risk Protection
KATANA_RISK_HONEYPOT_CHECK=true
KATANA_RISK_LIQUIDITY_CHECK=true
KATANA_RISK_DEV_CHECK=true

# Execution
KATANA_EXECUTOR_MAX_RETRIES=3
KATANA_JITO_ENABLED=false
KATANA_JITO_TIP=10000
```

### 📊 API Endpoints Katana

```
GET    /api/katana/status         # Status Katana
POST   /api/katana/start          # Start Katana
POST   /api/katana/stop           # Stop Katana
POST   /api/katana/trade          # Execute trade
GET    /api/katana/positions      # Active positions
GET    /api/katana/stats          # Statistics
```

## Deployment

### Docker
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## Konfigurasi (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/hft
REDIS_URL=redis://localhost:6379

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_ENABLED=true

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
```

## Monitoring

- **Metrics**: Prometheus (localhost:9090)
- **Logs**: Winston & Centralized Logging
- **Dashboard**: Grafana (localhost:3001)

## Security Features

✅ JWT authentication  
✅ CSRF protection  
✅ Rate limiting  
✅ Encrypted wallet storage  
✅ Input validation  
✅ Security headers (Helmet)

## Troubleshooting

**Database connection error:**
```bash
# Pastikan PostgreSQL running
# Check DATABASE_URL di .env
```

**WebSocket disconnected:**
```bash
# Restart backend service
npm run dev:backend
```

**AI Service unavailable:**
```bash
# Pastikan Python service running
# cd ai-service && python -m uvicorn main:app
```

## Support

📖 [Dokumentasi lengkap](./docs/)  
🐛 [Report bugs](https://github.com/nightgang/HFT/issues)  
💬 [Diskusi](https://github.com/nightgang/HFT/discussions)
