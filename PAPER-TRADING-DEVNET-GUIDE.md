# Paper Trading & Devnet Testing Setup Guide

## Paper Trading Mode

Paper trading allows testing trading strategies with simulated funds without using real SOL or money. Perfect for development, testing, and strategy validation.

### Enable Paper Trading

**1. Update .env Configuration**:

```env
# Paper Trading
PAPER_TRADING_ENABLED=true
PAPER_TRADING_INITIAL_BALANCE_USD=10000
PAPER_TRADING_SLIPPAGE_FACTOR=1.001  # 0.1% slippage
```

**2. Configuration Options**:

```env
# Initial virtual balance (in dollars/USDC equivalent)
PAPER_TRADING_INITIAL_BALANCE_USD=10000

# Slippage simulation (1.001 = 0.1% slippage)
PAPER_TRADING_SLIPPAGE_FACTOR=1.001

# Optional: Realistic price impact
PAPER_TRADING_PRICE_IMPACT_FACTOR=1.002

# Track performance
PAPER_TRADING_TRACK_PERFORMANCE=true
PAPER_TRADING_EXPORT_PERFORMANCE=true
```

### Using Paper Trading

#### 1. Start Backend with Paper Trading

```bash
npm run dev:backend
# Backend will start in paper trading mode
```

#### 2. API Endpoints for Paper Trading

**Get Paper Account**:
```bash
curl http://localhost:3001/api/paper/account
```

**Response**:
```json
{
  "balance": 10000,
  "currency": "USD",
  "positions": [],
  "totalValue": 10000,
  "realizedProfit": 0,
  "unrealizedProfit": 0,
  "mode": "paper"
}
```

**Execute Paper Trade**:
```bash
curl -X POST http://localhost:3001/api/trading/paper-trade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "action": "buy",
    "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "usdAmount": 500
  }'
```

**Paper Trade Response**:
```json
{
  "orderId": "paper_12345",
  "status": "executed",
  "action": "buy",
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "tokenSymbol": "USDC",
  "usdAmount": 500,
  "tokenAmount": 499.50,  # After slippage
  "slippage": 0.001,
  "executedAt": "2026-05-12T15:45:00Z",
  "balance": 9500
}
```

**Get Paper Portfolio**:
```bash
curl http://localhost:3001/api/paper/portfolio
```

**Get Paper Performance**:
```bash
curl http://localhost:3001/api/paper/performance
```

**Reset Paper Account**:
```bash
curl -X POST http://localhost:3001/api/paper/reset \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Paper Trading Features

- ✅ Simulated balance management
- ✅ Real-time price feeds
- ✅ Slippage simulation
- ✅ Fee estimation
- ✅ Position tracking
- ✅ Performance analytics
- ✅ trade history
- ✅ Export to CSV

### Testing Strategies

**1. Simple Buy & Sell**:
```bash
# Buy 500 USDC worth
curl -X POST http://localhost:3001/api/trading/paper-trade \
  -d '{"action":"buy","tokenMint":"USDC_MINT","usdAmount":500}'

# Sell all
curl -X POST http://localhost:3001/api/trading/paper-trade \
  -d '{"action":"sell","tokenMint":"USDC_MINT","percent":100}'
```

**2. Dollar-Cost Averaging**:
```bash
# Buy $100 daily for 10 days
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/trading/paper-trade \
    -d '{"action":"buy","tokenMint":"USDC_MINT","usdAmount":100}'
  sleep 86400  # Wait 1 day
done
```

**3. Risk Management Testing**:
```bash
# Set stop loss
curl -X POST http://localhost:3001/api/trading/set-stop-loss \
  -d '{"tokenMint":"TOKEN_MINT","percent":20}'

# Set take profit
curl -X POST http://localhost:3001/api/trading/set-take-profit \
  -d '{"tokenMint":"TOKEN_MINT","percent":50}'
```

---

## Devnet Testing

Devnet is a Solana testing network where you can test real transactions with free test SOL tokens. No real money is involved.

### Setup Devnet Environment

**1. Verify Devnet Configuration**:

```env
# Your .env should have these settings
SOLANA_CLUSTER=devnet
RPC_URL=https://api.devnet.solana.com
NODE_ENV=development
```

**2. Create Devnet Wallet** (if needed):

```bash
# Using Solana CLI (if installed)
solana-keygen new --outfile devnet-wallet.json

# Or generate in app - endpoint:
curl -X POST http://localhost:3001/api/wallet/create-devnet
```

### Get Devnet SOL Tokens

**Free SOL Airdrop** (limited):

```bash
# Via Solana CLI
solana airdrop 2 --url devnet

# Via API (if your backend supports it)
curl -X POST http://localhost:3001/api/wallet/devnet-airdrop \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"walletAddress":"YOUR_WALLET_ADDRESS","amount":2}'
```

**Using Devnet Faucet**:
- Website: https://faucet.solana.com/?cluster=devnet
- Paste your wallet address
- Receive 0.5 SOL (max 1 per hour)

### Testing with Devnet

**1. Import or Create Devnet Wallet**:

```bash
curl -X POST http://localhost:3001/api/wallet/import-devnet \
  -H "Content-Type: application/json" \
  -d '{
    "privateKey": "YOUR_PRIVATE_KEY_IN_BASE58",
    "alias": "devnet-test"
  }'
```

**2. Check Devnet Balance**:

```bash
curl http://localhost:3001/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**3. Execute Real Devnet Trade**:

```bash
curl -X POST http://localhost:3001/api/trading/swap-devnet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "action": "swap",
    "inputMint": "So11111111111111111111111111111111111111112",  # Wrapped SOL
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  # USDC
    "inputAmount": 1000000,  # 1 SOL in lamports
    "slippage": 1
  }'
```

**4. Monitor Transaction**:

```bash
curl http://localhost:3001/api/trading/tx-status/YOUR_TX_SIGNATURE
```

### Devnet Tokens Available

Popular tokens available on Devnet for testing:

| Token | Mint Address | Symbol |
|-------|--------|--------|
| Wrapped SOL | So11111111111111111111111111111111111111112 | wSOL |
| USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v | USDC |
| USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsl | USDT |
| Raydium | 4k3Dyjzvzp8eMZKqC75DwCvCKfLR7z5vXgaDo4vrsBn | RAY |

### Devnet Explorer

View all transactions and accounts:
- https://explorer.solana.com/?cluster=devnet

**Track Your Test Transaction**:
```
https://explorer.solana.com/tx/YOUR_TX_SIGNATURE?cluster=devnet
```

### Testing Checklist

- [ ] Wallet setup and funded with test SOL
- [ ] Can view balance on Devnet
- [ ] Can execute swap transactions
- [ ] Can monitor transaction status
- [ ] Transaction appears on Devnet Explorer
- [ ] Can execute multiple trades in sequence
- [ ] Slippage calculations are correct
- [ ] Fees are estimated accurately
- [ ] Error handling works (insufficient balance, etc.)
- [ ] Rate limiting functions
- [ ] Timeouts handled properly

### Troubleshooting Devnet

**Error: Insufficient SOL**
```bash
# Get more free SOL from faucet
# https://faucet.solana.com/?cluster=devnet
# Or request in-app airdrop
```

**Error: Transaction Simulation Failed**
```bash
# Verify token mints are correct for devnet
# Check RPC endpoint is devnet: https://api.devnet.solana.com
# Ensure wallet has sufficient balance
```

**Error: Transaction Timeout**
```bash
# Increase timeout in .env:
# NODE_ENV=development
# TRANSACTION_TIMEOUT_MS=30000

# Retry transaction with new signature
```

**Slow Transactions**
```bash
# Devnet can be slow - this is normal
# Average confirmation time: 10-30 seconds
# Check cluster status: https://status.solana.com
```

### Performance Testing on Devnet

**Load Test Small Trades**:
```bash
#!/bin/bash
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/trading/swap-devnet \
    -d '{"action":"swap","inputAmount":10000}' &
done
wait
```

**Benchmark Response Times**:
```bash
time curl http://localhost:3001/api/trading/quote-devnet
```

---

## Paper Trading vs Devnet Comparison

| Feature | Paper Trading | Devnet |
|---------|--------------|--------|
| Real Network | No | Yes (Devnet) |
| Real Transactions | No | Yes |
| Speed | Instant | 10-30s |
| Cost | Free | Free (test SOL) |
| Data Quality | Simulated | Real |
| Wallet Creation | Virtual | Required |
| Risk | None | None (test tokens) |
| Best For | Strategy testing | Real transaction testing |

---

## Best Practices

### Paper Trading
- ✅ Test strategies without risk
- ✅ Validate logic and calculations
- ✅ Rapid iteration and testing
- ✅ Practice before real trading

### Devnet Testing
- ✅ Test with real transaction mechanics
- ✅ Verify gas calculations
- ✅ Test error handling
- ✅ Load testing
- ✅ Prepare for mainnet

### Production Migration
1. Start with paper trading
2. Move to devnet once confident
3. Test on mainnet with minimal funds
4. Gradually increase volume
5. Monitor performance

---

**Last Updated**: May 12, 2026
**Status**: Ready for testing
