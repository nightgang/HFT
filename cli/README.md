# Katana Terminal CLI

Command-line interface for the HFT Solana Trading System's Katana Mode.

## Installation

```bash
cd cli
npm install
```

## Usage

### Normal Mode (requires backend)
```bash
npm start
# or
node katana-terminal.js
```

### Demo Mode (works without backend)
```bash
npm run demo
# or
node katana-terminal.js --demo
```

## Features

- **Real-time Trading**: Execute buy/sell orders with selected tokens
- **AI Predictions**: Request ML-powered trade signals
- **Wallet Management**: Select and manage trading wallets
- **Position Tracking**: Monitor active positions and P&L
- **Token Discovery**: View recent token detections
- **Risk Management**: Auto-trade controls and risk alerts
- **WebSocket Integration**: Real-time updates from trading engine

## Commands

### Core Commands
- `start` - Start Katana Mode
- `stop` - Stop Katana Mode
- `status` - Show current system status

### Trading Commands
- `buy <amount>` - Buy selected token
- `sell <amount>` - Sell selected token
- `select <mint>` - Select token for trading
- `predict <mint>` - Request AI prediction for token

### Management Commands
- `wallets` - List configured wallets
- `usewallet <pk>` - Select wallet for trades
- `positions` - Show active positions
- `tokens` - Show recent token detections

### Control Commands
- `toggle` / `t` - Toggle auto-trade ON/OFF
- `autotrade on|off` - Set auto-trade mode
- `help` / `h` - Show help
- `exit` / `q` - Exit terminal

## Keyboard Shortcuts

- `[T]` - Toggle auto-trade
- `[H]` - Show help
- `[Q]` - Quick exit

## Demo Mode

Demo mode allows you to explore all CLI features without requiring a running backend:

```bash
npm run demo
```

In demo mode:
- All commands work with simulated data
- No real trades are executed
- AI predictions return random but realistic results
- Wallet and position data is mocked

## Requirements

- Node.js >= 16.0.0
- Backend server running (for normal mode)
- Network connection to backend APIs

## Configuration

The CLI connects to:
- Backend API: `http://localhost:3001`
- WebSocket: `ws://localhost:3003`

Modify `API_BASE` and `KATANA_WS_URL` constants in the code to change endpoints.