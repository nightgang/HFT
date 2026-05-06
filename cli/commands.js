const axios = require('axios');

class TradingCommands {
  constructor(apiBase) {
    this.apiBase = apiBase;
  }

  async apiCall(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${this.apiBase}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.data.error || error.response.statusText}`);
      } else {
        throw new Error(`Network Error: ${error.message}`);
      }
    }
  }

  async handleCommand(command, args) {
    switch (command) {
      case 'start-sniper':
        await this.apiCall('POST', '/sniper/start');
        console.log('Sniper started');
        break;

      case 'stop-sniper':
        await this.apiCall('POST', '/sniper/stop');
        console.log('Sniper stopped');
        break;

      case 'status':
        const [status, walletInfo] = await Promise.all([
          this.apiCall('GET', '/sniper/status'),
          this.apiCall('GET', '/wallet/active'),
        ]);
        console.log('System Status:');
        console.log(`  Sniper Active: ${status.isActive ? '✅' : '❌'}`);
        console.log(`  Auto Trade: ${status.autoTradeEnabled ? '✅' : '❌'}`);
        if (walletInfo.activeWallet) {
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

      case 'analyze-wallet':
        if (!args[0]) {
          console.log('Usage: analyze-wallet <public_key>');
          return;
        }
        {
          const analysis = await this.apiCall('GET', `/smart-money/${args[0]}`);
          console.log(`Smart money analysis for ${args[0]}:`);
          console.log(`  Score: ${analysis.score}/100 (${analysis.recommendation})`);
          console.log(`  SOL balance: ${analysis.solBalance?.toFixed(4) || 'N/A'}`);
          console.log(`  Token count: ${analysis.tokenCount || 0}`);
          if (analysis.signals?.length) {
            console.log(`  Signals: ${analysis.signals.join(', ')}`);
          }
        }
        break;

      case 'smart-signals':
        {
          const limit = args[0] ? parseInt(args[0], 10) : 5;
          const response = await this.apiCall('GET', `/smart-money/signals?limit=${limit}`);
          console.log('Smart money signals:');
          response.signals.forEach((signal, index) => {
            console.log(`  ${index + 1}. ${signal.walletAddress || 'SIMULATED'} - ${signal.smartSignalScore || signal.score}/100 (${signal.recommendation})`);
          });
        }
        break;

      case 'random-smart-money':
        {
          const signal = await this.apiCall('GET', '/smart-money/signal/random');
          console.log('Random smart money signal:');
          console.log(`  Wallet: ${signal.walletAddress}`);
          console.log(`  Score: ${signal.smartSignalScore || signal.score}/100`);
          console.log(`  Recommendation: ${signal.recommendation}`);
        }
        break;

      case 'arbitrage-check':
        if (!args[0]) {
          console.log('Usage: arbitrage-check <token_mint>');
          return;
        }
        {
          const result = await this.apiCall('GET', `/arbitrage/check/${args[0]}`);
          console.log(`Arbitrage check for ${args[0]}:`);
          console.log(`  Profit: ${result.estimatedProfitPct?.toFixed(2) ?? 'N/A'}%`);
          console.log(`  Buy Dex: ${result.buyDex || 'N/A'}`);
          console.log(`  Sell Dex: ${result.sellDex || 'N/A'}`);
          console.log(`  Risk: ${result.risk || 'N/A'}`);
          if (result.note) console.log(`  Note: ${result.note}`);
        }
        break;

      case 'detect-token':
        if (!args[0]) {
          console.log('Usage: detect-token <mint> [symbol] [decimals] [creator]');
          return;
        }
        {
          const payload = {
            mint: args[0],
            symbol: args[1] || undefined,
            decimals: args[2] ? parseInt(args[2], 10) : undefined,
            creator: args[3] || undefined,
          };
          const result = await this.apiCall('POST', '/token/detect', payload);
          console.log('Token detection submitted:');
          console.log(`  Mint: ${args[0]}`);
          console.log(`  Symbol: ${payload.symbol || 'unknown'}`);
          console.log(`  Decimals: ${payload.decimals || 'unknown'}`);
          if (payload.creator) console.log(`  Creator: ${payload.creator}`);
          console.log(`  Message: ${result.message || 'Processing'}`);
        }
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

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Type "help" for available commands');
    }
  }
}

module.exports = TradingCommands;