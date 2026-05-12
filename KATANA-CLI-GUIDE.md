# Katana CLI Terminal Setup & Usage Guide

## Overview

Katana is the command-line interface for the HFT trading system. It provides direct control over trading operations, wallet management, and real-time market data. Perfect for experienced traders who prefer terminal-based interaction.

## Quick Start

### Start Katana

```bash
npm run katana
# or
npm run cli
```

**Expected Output**:
```
╔════════════════════════════════════════════════════════════╗
║            Katana Trading Terminal v1.0.0                  ║
║         Solana High-Frequency Trading System               ║
╚════════════════════════════════════════════════════════════╝

Connected to: api.devnet.solana.com
Press 'help' for commands
> _
```

## Core Commands

### Account Management

**Show Account Info**:
```
> account
```

**Set Active Wallet**:
```
> wallet set devnet-test
```

**List Wallets**:
```
> wallet list
```

**Create New Wallet**:
```
> wallet create --name trader-1 --type devnet
```

**Import Private Key**:
```
> wallet import --key <BASE58_PRIVATE_KEY> --name imported-wallet
```

**Delete Wallet** (with confirmation):
```
> wallet delete trader-1
```

### Trading Commands

**Get Price Quote**:
```
> quote EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

**Execute Swap**:
```
> swap --input-mint So11111111111111111111111111111111111111112 \
       --output-mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
       --amount 1.0 \
       --slippage 1
```

**Buy Token** (simplified):
```
> buy EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --amount 500 --usd
# Buys $500 worth of token
```

**Sell Token**:
```
> sell EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --percent 50
# Sells 50% of holdings
```

**Execute Limit Order**:
```
> limit-order --buy --mint TOKEN_MINT --price 5.00 --amount 100
```

### Portfolio Management

**Show Portfolio**:
```
> portfolio
```

**Show Holdings**:
```
> holdings
```

**Show Trade History**:
```
> history [--limit 50] [--token TOKEN_MINT]
```

**Show Performance**:
```
> performance
```

**Calculate Gains/Losses**:
```
> pnl --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### Risk Management

**Set Stop Loss**:
```
> stop-loss --token TOKEN_MINT --percent 20
# Sells if token drops 20%
```

**Set Take Profit**:
```
> take-profit --token TOKEN_MINT --percent 50
# Sells if token rises 50%
```

**Set Trailing Stop**:
```
> trailing-stop --token TOKEN_MINT --percent 15
# Dynamic stop that follows price upward
```

**Enable Risk Protection**:
```
> risk-protection on
```

**Disable Risk Protection**:
```
> risk-protection off
```

**View Risk Settings**:
```
> risk-protection --view
```

### Market Data

**Watch Token**:
```
> watch EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
# Real-time price updates
```

**Stop Watching**:
```
> unwatch EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

**List Watched Tokens**:
```
> watched
```

**Get Market Stats**:
```
> stats EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### System Commands

**Help**:
```
> help
> help <command>
```

**Status**:
```
> status
```

**System Info**:
```
> system
```

**Network Status**:
```
> network
```

**API Connectivity**:
```
> ping
```

**Logs**:
```
> logs --tail 50 --follow
```

**Clear Screen**:
```
> clear
```

**Exit**:
```
> exit
> quit
```

## Advanced Features

### Scripting

Create trading scripts in `.katana-scripts/`:

**example-strategy.kat**:
```
# Auto-buy promising tokens
watch USDC_MINT
when price_drops 50% from_previous
  buy_amount 500
  set stop_loss 20
  set take_profit 100
end
```

Run script:
```
> run example-strategy
```

### Batch Operations

**Multiple Trades**:
```
> batch
  swap --input So11111111111111111111111111111111111111112 \
       --output EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
       --amount 1.0
  swap --input So11111111111111111111111111111111111111112 \
       --output Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsl \
       --amount 0.5
end
```

### Monitoring

**Real-time Dashboard**:
```
> dashboard
```

**Monitor Specific Token**:
```
> monitor EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --interval 5
```

## Configuration

### Environment Variables

```env
# Katana CLI Settings
KATANA_ENABLED=true
KATANA_TERMINAL_MODE=true
KATANA_AUTO_CONNECT=true
KATANA_LOG_LEVEL=info

# Trading Parameters
KATANA_MAX_CONCURRENT_TRADES=5
KATANA_MIN_LIQUIDITY_SOL=5
KATANA_MAX_SLIPPAGE=0.5
```

### Custom Config File

Create `.katana-config.json`:

```json
{
  "theme": "dark",
  "autoConnect": true,
  "defaultRpc": "https://api.devnet.solana.com",
  "defaultWallet": "devnet-test",
  "notifications": {
    "tradeExecution": true,
    "riskAlerts": true,
    "priceAlerts": true
  },
  "shortcuts": {
    "quick_buy": "buy {mint} --amount 100 --usd",
    "quick_sell": "sell {mint} --percent 50"
  }
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Auto-complete |
| `Ctrl+C` | Cancel current operation |
| `Ctrl+L` | Clear screen |
| `Ctrl+D` | Exit |
| `Arrow Up/Down` | Command history |
| `Enter` | Execute command |

## Examples

### Example 1: Buy & Hold Strategy

```bash
# Start fresh account with $10,000
account create --balance 10000 --mode paper

# Find token to buy (USDC)
quote EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Buy $5,000 worth
buy EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --amount 5000 --usd

# Set risk management
stop-loss --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --percent 20
take-profit --token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --percent 50

# Monitor
watch EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
portfolio
```

### Example 2: Dollar Cost Averaging

```bash
# Setup DCA strategy
set-reminder --interval daily --time 09:00 --command "buy MINT --amount 500 --usd"

# Or manually execute
for i in {1..10}; do
  buy --all-strategy dca
  wait-hours 24
end
```

### Example 3: Arbitrage Search

```bash
# Find arbitrage opportunities
arbitrage scan --bases wSOL,USDC --scan-time 30

# Execute best opportunity
arbitrage execute --pair BEST_PAIR --amount 1
```

## Error Handling

### Common Errors

**Insufficient Balance**:
```
Error: Insufficient SOL balance
Balance: 0.5 SOL | Required: 1 SOL
```

**Network Error**:
```
Error: Cannot reach RPC endpoint
Retrying in 5 seconds...
```

**Invalid Token Mint**:
```
Error: Invalid token mint address
Expected: 43 character base58 string
```

### Troubleshooting

**Command not found**:
- Check spelling: `hello` → `help`
- List commands: `help`

**Connection issues**:
- Verify network: `ping`
- Check RPC: `network`
- Try different endpoint: `network set --rpc https://api.devnet.solana.com`

**Slow transaction**:
- Check network status: `status`
- Increase priority fee: `set --priority-fee 100000`
- Wait for confirmation: transactions usually confirm in 10-30s

## Advanced Workflows

### Automated Grid Trading

```
grid-trade --token MINT \
           --levels 10 \
           --interval 2 \
           --buy-percent 5 \
           --sell-percent 3
```

### Momentum Trading Alert

```
alert create --token MINT \
             --type momentum \
             --threshold 30 \
             --action notify
```

### Portfolio Rebalancing

```
rebalance portfolio \
          --target-allocation "wSOL:50,USDC:30,RAY:20" \
          --execute
```

## Performance Tips

1. **Batch Operations**: Group multiple trades together
2. **Use Shortcuts**: Create custom shortcuts for frequent trades
3. **Monitor Efficiently**: Watch only necessary tokens
4. **Set Alerts**: Use alerts instead of constant monitoring
5. **Use Paper Mode**: Test strategies before real execution

## Security

### Best Practices

- ✅ Never paste private keys directly
- ✅ Use `wallet import` command securely
- ✅ Keep wallet list private
- ✅ Log out before leaving terminal
- ✅ Use read-only wallets for monitoring

### Commands

**Lock Terminal**:
```
> lock
```

**Unlock With Password**:
```
> unlock
```

**Clear Sensitive Data**:
```
> clear-sensitive
```

---

**Last Updated**: May 12, 2026
**Version**: 1.0.0
**Status**: Ready for production use
