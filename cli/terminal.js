#!/usr/bin/env node

const readline = require('readline');
const WebSocket = require('ws');
const TradingCommands = require('./commands');

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3002';

class TradingTerminal {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.ws = null;
    this.isConnected = false;
    this.commands = new TradingCommands(API_BASE);
  }

  async start() {
    console.log('🚀 Solana Trading Terminal');
    console.log('==========================');

    await this.connectWebSocket();
    this.showHelp();
    this.startCommandLoop();
  }

  async connectWebSocket() {
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.on('open', () => {
        console.log('📡 Connected to trading engine');
        this.isConnected = true;
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('📡 Disconnected from trading engine');
        this.isConnected = false;
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  handleWebSocketMessage(message) {
    const timestamp = new Date(message.timestamp || message.serverTimestamp).toLocaleTimeString();

    switch (message.type) {
      case 'TOKEN_DETECTED':
        console.log(`🆕 [${timestamp}] Token detected: ${message.data.symbol} (${message.data.mint})`);
        break;
      case 'RISK_APPROVED':
        console.log(`✅ [${timestamp}] Risk approved for ${message.data.mint}`);
        break;
      case 'RISK_REJECTED':
        console.log(`❌ [${timestamp}] Risk rejected: ${message.data.reason}`);
        break;
      case 'TRADE_EXECUTED':
        console.log(`💰 [${timestamp}] Trade executed: ${message.data.signature}`);
        break;
      case 'TRADE_FAILED':
        console.log(`💥 [${timestamp}] Trade failed: ${message.data.reason}`);
        break;
      case 'SMART_MONEY_SIGNAL':
        console.log(`🐋 [${timestamp}] Smart Money ${message.data.walletAddress}: ${message.data.smartSignalScore} (${message.data.recommendation})`);
        break;
      case 'ARBITRAGE_SIGNAL':
        console.log(`⚡ [${timestamp}] Arbitrage ${message.data.tokenMint}: ${message.data.estimatedProfitPct?.toFixed(2)}%`);
        break;
      default:
        console.log(`📩 [${timestamp}] ${message.type}:`, message.data);
    }
  }

  showHelp() {
    console.log('\nAvailable commands:');
    console.log('  start-sniper          - Start the sniper engine');
    console.log('  stop-sniper           - Stop the sniper engine');
    console.log('  status                - Show system status');
    console.log('  enable-auto-trade     - Enable automatic trading');
    console.log('  disable-auto-trade    - Disable automatic trading');
    console.log('  enable-risk-mode      - Enable strict risk mode');
    console.log('  buy <token> [amount]  - Buy token (default amount from config)');
    console.log('  sell <token> [amount] - Sell token (default amount from config)');
    console.log('  unsigned-buy <token> [amount] - Generate unsigned buy transaction');
    console.log('  unsigned-sell <token> <amount> - Generate unsigned sell transaction');
    console.log('  detect-token <mint> [symbol] [decimals] [creator] - Submit a token for sniper detection');
    console.log('  create-wallet <name>  - Create new internal wallet');
    console.log('  connect-wallet <pubkey> [name] - Connect external wallet');
    console.log('  set-wallet <pubkey>   - Set active wallet');
    console.log('  list-wallets          - List all wallets');
    console.log('  analyze-wallet <pubkey> - Analyze smart money score for a wallet');
    console.log('  smart-signals [limit] - Show latest smart money signals');
    console.log('  random-smart-money    - Get a random smart money signal');
    console.log('  arbitrage-check <tokenMint> - Check a token for arbitrage opportunity');
    console.log('  logs                  - Stream live logs');
    console.log('  trade-history [wallet] - Show trade history');
    console.log('  help                  - Show this help');
    console.log('  exit                  - Exit terminal');
    console.log('');
  }

  startCommandLoop() {
    this.rl.setPrompt('trading> ');
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const args = line.trim().split(/\s+/);
      const command = args[0];

      if (command === 'exit' || command === 'quit') {
        console.log('Goodbye! 👋');
        this.cleanup();
        process.exit(0);
      }

      try {
        await this.commands.handleCommand(command, args.slice(1));
      } catch (error) {
        console.error('Command error:', error.message);
      }

      this.rl.prompt();
    });
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    this.rl.close();
  }
}
          console.log('  Active Wallet:');
          console.log(`    ${walletInfo.activeWallet.name} - ${walletInfo.activeWallet.publicKey}`);
          console.log(`    Type: ${walletInfo.activeWallet.external ? 'External' : 'Internal'}`);
        } else {
          console.log('  Active Wallet: None');
        }
        break;

      case 'enable-auto-trade':
        await this.apiCall('POST', '/sniper/enable-auto-trade');
        console.log('Auto trade enabled');
        break;

      case 'disable-auto-trade':
        await this.apiCall('POST', '/sniper/disable-auto-trade');
        console.log('Auto trade disabled');
        break;

      case 'enable-risk-mode':
        console.log('Risk mode is always strict in this system');
        break;

      case 'buy':
        if (!args[0]) {
          console.log('Usage: buy <token_mint> [amount_sol]');
          return;
        }
        const buyAmount = args[1] ? parseFloat(args[1]) : undefined;
        await this.apiCall('POST', '/trade/buy', {
          tokenMint: args[0],
          amount: buyAmount,
        });
        console.log('Buy order submitted');
        break;

      case 'sell':
        if (!args[0] || !args[1]) {
          console.log('Usage: sell <token_mint> <amount_tokens>');
          return;
        }
        await this.apiCall('POST', '/trade/sell', {
          tokenMint: args[0],
          amount: parseFloat(args[1]),
        });
        console.log('Sell order submitted');
        break;

      case 'unsigned-buy':
        if (!args[0]) {
          console.log('Usage: unsigned-buy <token_mint> [amount_sol]');
          return;
        }
        const unsignedBuyAmount = args[1] ? parseFloat(args[1]) : undefined;
        const unsignedBuy = await this.apiCall('POST', '/trade/unsigned', {
          type: 'buy',
          tokenMint: args[0],
          amount: unsignedBuyAmount,
        });
        console.log('Unsigned buy transaction generated:');
        console.log(unsignedBuy.swapTransaction);
        break;

      case 'unsigned-sell':
        if (!args[0] || !args[1]) {
          console.log('Usage: unsigned-sell <token_mint> <amount_tokens>');
          return;
        }
        const unsignedSell = await this.apiCall('POST', '/trade/unsigned', {
          type: 'sell',
          tokenMint: args[0],
          amount: parseFloat(args[1]),
        });
        console.log('Unsigned sell transaction generated:');
        console.log(unsignedSell.swapTransaction);
        break;

      case 'create-wallet':
        if (!args[0]) {
          console.log('Usage: create-wallet <name>');
          return;
        }
        const wallet = await this.apiCall('POST', '/wallet/create', {
          name: args[0],
        });
        console.log(`Wallet created: ${wallet.wallet.publicKey}`);
        break;

      case 'connect-wallet':
        if (!args[0]) {
          console.log('Usage: connect-wallet <public_key> [name]');
          return;
        }
        const connected = await this.apiCall('POST', '/wallet/connect', {
          publicKey: args[0],
          name: args[1] || 'external',
        });
        console.log(`Wallet connected: ${connected.wallet.publicKey}`);
        break;

      case 'set-wallet':
        if (!args[0]) {
          console.log('Usage: set-wallet <public_key>');
          return;
        }
        await this.apiCall('POST', '/wallet/set-active', {
          publicKey: args[0],
        });
        console.log('Active wallet set');
        break;

      case 'list-wallets':
        const wallets = await this.apiCall('GET', '/wallets');
        console.log('Wallets:');
        wallets.wallets.forEach(w => {
          console.log(`  ${w.name}: ${w.publicKey} ${w.external ? '(external)' : '(internal)'}`);
        });
        break;

      case 'logs':
        console.log('Live logs streaming... (press Ctrl+C to stop)');
        // Logs are already streaming via WebSocket
        break;

      case 'trade-history':
        const walletAddress = args[0];
        if (walletAddress) {
          const history = await this.apiCall('GET', `/trades/${walletAddress}`);
          console.log(`Trade history for ${walletAddress}:`);
          if (history.trades.length === 0) {
            console.log('  No trades found');
          } else {
            history.trades.forEach(trade => {
              console.log(`  ${new Date(trade.timestamp).toLocaleString()} - ${trade.type.toUpperCase()} ${trade.amount} of ${trade.tokenMint} (${trade.status})`);
            });
          }
        } else {
          const history = await this.apiCall('GET', '/trades');
          console.log('Recent trade history:');
          if (history.trades.length === 0) {
            console.log('  No trades found');
          } else {
            history.trades.forEach(trade => {
              console.log(`  ${new Date(trade.timestamp).toLocaleString()} - ${trade.type.toUpperCase()} ${trade.amount} of ${trade.tokenMint} (${trade.status})`);
            });
          }
        }
        break;

      case 'help':
        this.showHelp();
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Type "help" for available commands');
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    this.rl.close();
  }
}

// Start the terminal
const terminal = new TradingTerminal();
terminal.start();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  terminal.cleanup();
  process.exit(0);
});