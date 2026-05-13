# Trading Guide

Complete guide to using the HFT Solana Trading System, including the Katana Terminal and API.

---

## 🎯 Trading Overview

The HFT system provides multiple ways to execute trades:

1. **Web Dashboard**: User-friendly interface for casual trading
2. **REST API**: Programmatic trading for applications
3. **WebSocket API**: Real-time streaming and updates
4. **Katana Terminal**: Professional CLI for power users

---

## 📊 Web Dashboard

### Getting Started

1. Navigate to http://localhost:5173
2. Login with your credentials
3. Connect your Solana wallet

### Dashboard Features

#### Portfolio Overview
- Current balance in SOL and USDC
- Total portfolio value in USD
- 24h percentage change
- Asset allocation pie chart

#### Trading Interface
- Token pair selector
- Amount input with swap preview
- Slippage tolerance setting
- Fee estimation
- Real-time price updates

#### Advanced Orders
- Stop-loss setup
- Take-profit tiers (TP1, TP2, TP3)
- Trailing stops
- Breakeven protection

#### Trade History
- Executed trades list
- Filter by status, token, date range
- Detailed trade information
- Export to CSV

#### Settings
- Risk configuration
- API key management
- Notification preferences
- Theme and language

---

## 🔗 REST API Trading Guide

### Base URL
```
http://localhost:3000/api
```

### Authentication

All requests require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

Get token via:
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h"
}
```

### Core Trading Endpoints

#### Execute Trade

```bash
POST /trades/execute
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "BUY",           # or "SELL"
  "tokenIn": "SOL",          # Token to spend
  "tokenOut": "USDC",        # Token to receive
  "amount": 1.5,             # Amount of tokenIn
  "maxSlippage": 1.0,        # Max slippage %
  "priority": "high",        # high|medium|low (affects fee)
  "jitoBundles": false,      # Use Jito MEV protection
  "autoMode": false          # Use AI recommendations
}

Response (201):
{
  "tradeId": "trade_xyz123",
  "status": "pending",       # pending|success|failed
  "txHash": "5W7t9...",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 1.5,
  "amountOut": 47.2,
  "slippagePercent": 0.8,
  "fee": 0.00025,
  "executedAt": "2026-05-13T10:30:45Z",
  "confirmations": 32,
  "finalizedAt": "2026-05-13T10:30:52Z"
}
```

#### Get Trade History

```bash
GET /trades/history?limit=20&offset=0&status=success
Authorization: Bearer <token>

Response (200):
{
  "trades": [
    {
      "tradeId": "trade_001",
      "tokenIn": "SOL",
      "tokenOut": "USDC",
      "amountIn": 1.0,
      "amountOut": 31.5,
      "slippage": 0.5,
      "fee": 0.0001,
      "status": "success",
      "executedAt": "2026-05-13T10:30:00Z"
    },
    # ... more trades
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

#### Get Trade Details

```bash
GET /trades/{tradeId}
Authorization: Bearer <token>

Response (200):
{
  "tradeId": "trade_xyz123",
  "status": "success",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 1.5,
  "amountOut": 47.2,
  "priceImpact": 0.3,
  "slippage": 0.8,
  "fee": 0.00025,
  "route": [
    "SOL → USDC (Jupiter)"
  ],
  "txHash": "5W7t9...",
  "confirmations": 32,
  "createdAt": "2026-05-13T10:30:00Z",
  "executedAt": "2026-05-13T10:30:45Z",
  "finalizedAt": "2026-05-13T10:30:52Z"
}
```

### Portfolio Endpoints

#### Get Portfolio Overview

```bash
GET /portfolio
Authorization: Bearer <token>

Response (200):
{
  "totalValueUSD": 10500.50,
  "totalValueSOL": 300,
  "totalValueUSDC": 9500,
  "change24hPercent": 5.2,
  "change24hUSD": 500.00,
  "change7dPercent": 12.3,
  "change30dPercent": 45.6,
  "winRate": 0.65,
  "sharpeRatio": 1.2,
  "maxDrawdown": 0.15,
  "lastUpdated": "2026-05-13T10:30:00Z"
}
```

#### Get Portfolio Positions

```bash
GET /portfolio/positions
Authorization: Bearer <token>

Response (200):
{
  "positions": [
    {
      "token": "SOL",
      "amount": 50,
      "valueUSD": 1500,
      "percentOfPortfolio": 0.15,
      "avgCostPerToken": 30.0,
      "currentPrice": 30.0,
      "unrealizedPNL": 0,
      "unrealizedPNLPercent": 0
    },
    {
      "token": "USDC",
      "amount": 9000,
      "valueUSD": 9000,
      "percentOfPortfolio": 0.85,
      "avgCostPerToken": 1.0,
      "currentPrice": 1.0,
      "unrealizedPNL": 0,
      "unrealizedPNLPercent": 0
    }
  ]
}
```

### Advanced Orders API

#### Create Stop-Loss Order

```bash
POST /advanced-orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "tradeId": "trade_xyz123",
  "orderType": "STOP_LOSS",
  "triggerPrice": 28.0,
  "quantity": 10,              # SOL to sell if price drops
  "action": "SELL"
}

Response (201):
{
  "orderId": "order_abc123",
  "tradeId": "trade_xyz123",
  "orderType": "STOP_LOSS",
  "status": "active",
  "triggerPrice": 28.0,
  "quantity": 10,
  "createdAt": "2026-05-13T10:30:00Z"
}
```

#### Create Take-Profit Orders

```bash
POST /advanced-orders
Authorization: Bearer <token>

{
  "tradeId": "trade_xyz123",
  "orderType": "TAKE_PROFIT",
  "quantity": 10,
  "tiers": [
    {
      "level": "TP1",
      "price": 35.0,
      "quantityPercent": 0.33    # Sell 33% at this price
    },
    {
      "level": "TP2",
      "price": 40.0,
      "quantityPercent": 0.33
    },
    {
      "level": "TP3",
      "price": 45.0,
      "quantityPercent": 0.34
    }
  ]
}

Response (201):
{
  "orderId": "order_def456",
  "tpOrders": [
    {
      "level": "TP1",
      "status": "active",
      "price": 35.0
    },
    {
      "level": "TP2",
      "status": "active",
      "price": 40.0
    },
    {
      "level": "TP3",
      "status": "active",
      "price": 45.0
    }
  ]
}
```

#### Create Trailing Stop Order

```bash
POST /advanced-orders
Authorization: Bearer <token>

{
  "tradeId": "trade_xyz123",
  "orderType": "TRAILING_STOP",
  "quantity": 10,
  "trailingPercent": 5.0,      # Trail by 5% from highest price
  "action": "SELL"
}
```

#### Get Active Orders

```bash
GET /advanced-orders?status=active
Authorization: Bearer <token>

Response (200):
{
  "orders": [
    {
      "orderId": "order_abc123",
      "orderType": "STOP_LOSS",
      "token": "SOL",
      "quantity": 10,
      "triggerPrice": 28.0,
      "status": "active",
      "createdAt": "2026-05-13T10:30:00Z"
    }
  ],
  "total": 5
}
```

#### Cancel Order

```bash
DELETE /advanced-orders/{orderId}
Authorization: Bearer <token>

Response (200):
{
  "orderId": "order_abc123",
  "status": "cancelled",
  "cancelledAt": "2026-05-13T10:35:00Z"
}
```

---

## 📡 WebSocket Trading API

### Connection

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

// Send authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_jwt_token'
}));

// Listen for messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Price Streams

Subscribe to real-time prices:

```javascript
// Subscribe to token prices
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'prices',
  tokens: ['SOL/USDC', 'USDC/USD']
}));

// Receive price updates
{
  "type": "price",
  "token": "SOL/USDC",
  "price": 30.25,
  "bid": 30.20,
  "ask": 30.30,
  "volume24h": 1500000,
  "timestamp": "2026-05-13T10:30:45.123Z"
}
```

### Trade Notifications

Subscribe to personal trade updates:

```javascript
// Subscribe to trades
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'trades'
}));

// Receive trade updates
{
  "type": "trade",
  "tradeId": "trade_xyz123",
  "status": "success",      # pending|success|failed
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 1.5,
  "amountOut": 47.2,
  "timestamp": "2026-05-13T10:30:45.123Z"
}
```

### Order Notifications

```javascript
// Subscribe to order updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'orders'
}));

// Receive order updates
{
  "type": "order",
  "orderId": "order_abc123",
  "status": "triggered",    # active|triggered|executed|cancelled
  "orderType": "STOP_LOSS",
  "price": 28.0,
  "executionTime": "2026-05-13T10:32:00.000Z"
}
```

### Portfolio Updates

```javascript
// Subscribe to portfolio changes
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'portfolio'
}));

// Receive updates
{
  "type": "portfolio",
  "totalValueUSD": 10500.50,
  "change24hPercent": 5.2,
  "positions": {
    "SOL": { "amount": 50, "valueUSD": 1500 },
    "USDC": { "amount": 9000, "valueUSD": 9000 }
  },
  "timestamp": "2026-05-13T10:30:45.123Z"
}
```

---

## 🖥️ Katana Terminal

The Katana Terminal is a professional command-line trading interface.

### Launch Katana

```bash
npm run katana
# or
node cli/katana-terminal.js
```

### Terminal Interface

```
╔══════════════════════════════════════════════════════════╗
║          HFT KATANA TRADING TERMINAL v1.0               ║
║        Professional Solana Trading Platform             ║
╚══════════════════════════════════════════════════════════╝

>> LOGIN WITH CREDENTIALS
Email: user@example.com
Password: ••••••••••••

╔════════════════════════════════════════════════════════════════╗
║ PORTFOLIO                │  MARKET DATA                        ║
║ Balance: 10,500 USDC     │  SOL/USDC: 30.25                   ║
║ P&L: +$500 (+5.2%)       │  Volume: 1.5M                      ║
║ Win Rate: 65%            │  Change: +2.3%                     ║
╚════════════════════════════════════════════════════════════════╝

Commands:
  BUY   - Execute buy order
  SELL  - Execute sell order
  ORDERS - Manage advanced orders
  HISTORY - View trade history
  PORTFOLIO - Show portfolio details
  SETTINGS - Configure trading params
  ANALYZE - AI market analysis
  HELP - Show all commands

katana>
```

### Katana Commands

#### Buy Command

```bash
katana> BUY SOL 1.5 USDC
Enter max slippage %: 1.0
Use Jito MEV protection? (y/n): y
Priority (high/medium/low): high

Executing trade...
✓ Trade executed
Trade ID: trade_xyz123
Sent: 1.5 SOL
Received: 47.2 USDC
Slippage: 0.8%
TX Hash: 5W7t9...
```

#### Sell Command

```bash
katana> SELL 10 SOL for USDC
Enter max slippage %: 1.0
Priority: high

✓ Trade executed
Trade ID: trade_abc456
Sent: 10 SOL
Received: 310.5 USDC
```

#### Create Orders

```bash
katana> STOP_LOSS
Current SOL position: 50
Stop loss price: 28.0
Quantity to sell: 10

✓ Stop loss order created
Order ID: order_xyz789
Trigger: 28.0 SOL/USDC
Status: Active

---

katana> TAKE_PROFIT 50 SOL
TP1 (33%): 35.0
TP2 (33%): 40.0
TP3 (34%): 45.0

✓ Take profit tiers created
```

#### Portfolio Command

```bash
katana> PORTFOLIO

Portfolio Summary (Last 24h)
├─ Balance: 10,500.50 USD
├─ Change: +500.00 USD (+5.2%)
├─ Win Rate: 65%
├─ Sharpe Ratio: 1.2
└─ Max Drawdown: 15%

Positions:
  SOL     | 50      | $1,500   | +10% | 14.3%
  USDC    | 9,000   | $9,000   | 0%   | 85.7%

Open Orders: 5
```

#### Trade History

```bash
katana> HISTORY 10

Recent Trades (Last 10):
ID           Token    Amount  Price  Status   Time
trade_001    SOL      1.5     30.25  SUCCESS  10:30
trade_002    USDC     47.2    1.00   SUCCESS  10:30
trade_003    SOL      2.0     30.10  SUCCESS  10:32
trade_004    USDC     65.0    1.00   PENDING  10:33
...

Total Win Rate: 65% | Avg Profit: +0.8% | Total P&L: +$500
```

#### AI Analysis (if enabled)

```bash
katana> ANALYZE SOL

Market Analysis
├─ Sentiment: BULLISH (+0.8)
├─ Trend: UPTREND (4h)
├─ Support: 28.50
├─ Resistance: 32.00
├─ Recommendation: BUY
└─ Confidence: 78%

Signals:
  ✓ 200MA above 100MA (bullish)
  ✓ RSI: 65 (overbought but strong)
  ✓ Volume: Above average
  ✗ Funding rate: High (consider profit-taking)

Next Support: 28.50
Next Resistance: 32.00
```

---

## 📈 Trading Strategies

### Strategy 1: Dollar-Cost Averaging (DCA)

```bash
# Configure DCA in settings
katana> SETTINGS
Enter strategy: DCA
DCA amount (USDC): 100
Frequency: DAILY
Start time: 10:00 UTC
Duration: 30 days

✓ DCA strategy configured
```

### Strategy 2: Grid Trading

```bash
# Buy at support, sell at resistance in grids
katana> GRID_TRADE
Token: SOL
Lower price: 28.0
Upper price: 35.0
Number of grids: 10
Grid amount: 1 SOL each

✓ Grid strategy activated
Orders created: 20 (10 buy, 10 sell)
```

### Strategy 3: Mean Reversion

```bash
# Buy when price deviates from average
katana> MEAN_REVERSION
Token: SOL
Period (days): 7
Deviation threshold: -2.5%  # Buy when 2.5% below 7-day avg
Take profit: +2%

✓ Strategy configured
Status: Active (monitoring)
```

### Strategy 4: Trend Following

```bash
# Buy on trend confirmation, sell on reversal
katana> TREND_FOLLOW
Token: SOL
Timeframe: 4h
MA1: 20
MA2: 50
Entry: MA1 crosses above MA2
Exit: MA1 crosses below MA2

✓ Strategy configured
Status: Monitoring 4h timeframe
```

---

## ⚙️ Advanced Settings

### Risk Management

```bash
katana> SETTINGS RISK

Portfolio Settings:
├─ Max position size: 20% of portfolio
├─ Max drawdown: 15%
├─ Max daily loss: 5%
├─ Max trades per day: 50
├─ Min trade size: 0.1 SOL
└─ Max trade size: 100 SOL

Position Settings:
├─ Default SL: -5%
├─ Default TP: +10%
├─ Correlation limit: 0.8
└─ Rebalance frequency: Weekly

✓ Settings saved
```

### Order Execution Settings

```bash
katana> SETTINGS ORDERS

Execution Preferences:
├─ Default slippage: 1.0%
├─ Default priority: medium
├─ Use Jito bundles: yes
├─ Bundle tip: 0.001 SOL
├─ Timeout (seconds): 30
└─ Retry failed orders: yes

✓ Execution settings saved
```

---

## 🔔 Alerts & Notifications

### Price Alerts

```bash
katana> ALERT PRICE SOL 32.0
Alert created: Notify when SOL/USDC reaches $32.0

katana> ALERT PRICE SOL 28.0
Alert created: Notify when SOL/USDC reaches $28.0
```

### Order Alerts

```bash
katana> ALERT ORDER
Notify on:
  ✓ Order filled
  ✓ Order partially filled
  ✓ Order cancelled
  ✓ SL triggered
  ✓ TP reached
```

### Portfolio Alerts

```bash
katana> ALERT PORTFOLIO
├─ Notify on balance change: > 2%
├─ Notify on P&L change: > 5%
├─ Notify on drawdown: > 10%
└─ Notify when open orders > 10
```

---

## 📊 Analytics & Reporting

### Performance Report

```bash
katana> REPORT PERFORMANCE

Performance Summary (30 days)
├─ Total Trades: 150
├─ Winning Trades: 98 (65%)
├─ Losing Trades: 52 (35%)
├─ Gross Profit: $2,500
├─ Gross Loss: ($1,200)
├─ Net Profit: $1,300
├─ Profit Factor: 2.08
├─ Sharpe Ratio: 1.2
├─ Max Drawdown: 15%
├─ Win Rate: 65%
└─ Avg Win/Avg Loss: 1.8

Best Trade: +5.2% ($520)
Worst Trade: -2.8% (-$280)
Avg Trade: +0.87%
```

### Export Report

```bash
katana> EXPORT CSV
Export file: trades_2026_05_13.csv

katana> EXPORT PDF
Report generated: portfolio_report_2026_05_13.pdf
```

---

## 🚨 Error Handling

### Common Errors

```
ERROR: Insufficient balance
  → Check account balance
  → Ensure funds are available
  → Wait for pending transactions

ERROR: Slippage exceeded
  → Increase max slippage tolerance
  → Try again with smaller amount
  → Check market liquidity

ERROR: RPC timeout
  → Retry trade
  → Check internet connection
  → Verify Solana network status

ERROR: Token not found
  → Verify token address/symbol
  → Check token exists on Solana
  → Try with token address instead

ERROR: Order already exists
  → Cancel existing order first
  → Use ORDERS command to manage
  → Modify order parameters
```

---

## 📝 Best Practices

### Risk Management

1. **Always use stop losses** - Protect against unexpected movements
2. **Position sizing** - Never risk >2% of portfolio on single trade
3. **Diversification** - Spread across multiple tokens/strategies
4. **Take profits** - Lock in gains with take-profit orders
5. **Monitor drawdown** - Stop trading if hitting limits

### Trading Discipline

1. **Follow your strategy** - Don't deviate on emotions
2. **Keep records** - Log all trades and rationale
3. **Review regularly** - Analyze performance weekly/monthly
4. **Backtest first** - Test strategies on historical data
5. **Scale gradually** - Start small, increase with confidence

### API Best Practices

1. **Use connection pooling** - Reuse database connections
2. **Implement retry logic** - Handle transient failures
3. **Rate limit yourself** - Don't overwhelm the API
4. **Monitor latency** - Track API response times
5. **Error handling** - Gracefully handle all error cases

---

**Trading Guide Last Updated**: 2026-05-13

See also:
- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
