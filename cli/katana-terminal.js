#!/usr/bin/env node

const readline = require('readline');
const WebSocket = require('ws');
const axios = require('axios');

const API_BASE = 'http://localhost:3001';
const KATANA_WS_URL = 'ws://localhost:3003';

class KatanaTerminal {
  constructor(options = {}) {
    this.demoMode = options.demo || false;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '⚔️ katana> ',
      historySize: 100,
      completer: this.completer.bind(this)
    });
    this.ws = null;
    this.isConnected = false;
    this.authToken = null;
    this.katanaActive = false;
    this.currentPositions = [];
    this.pnlData = { totalPnL: 0, pnlPercentage: 0, activeTrades: 0 };
    this.autoTradeEnabled = true;
    this.selectedToken = null;
    this.selectedWallet = null;
    this.commandHistory = [];
    this.availableCommands = [
      'start', 'stop', 'status', 'buy', 'sell', 'select', 'wallets', 'usewallet',
      'predict', 'positions', 'tokens', 'help', 'exit', 'toggle', 'autotrade'
    ];
  }

  completer(line) {
    const commands = this.availableCommands.filter(cmd => cmd.startsWith(line));
    return [commands.length ? commands : this.availableCommands, line];
  }

  async start() {
    console.clear();
    console.log('⚔️  KATANA MODE TERMINAL');
    console.log('========================');

    if (this.demoMode) {
      console.log('🎭 DEMO MODE - No backend required');
      console.log('');
      this.authToken = 'demo-token';
      this.isConnected = true;
      this.showWelcome();
      this.rl.prompt();
      this.rl.on('line', (line) => this.handleCommand(line.trim()));
      this.rl.on('SIGINT', () => this.handleExit());
      return;
    }

    console.log('Ultra-fast Solana trading system');
    console.log('');

    // Login first
    await this.login();

    // Connect to Katana WebSocket
    await this.connectWebSocket();

    // Start command loop
    this.showWelcome();
    this.rl.prompt();
    this.rl.on('line', (line) => this.handleCommand(line.trim()));
    this.rl.on('SIGINT', () => this.handleExit());
  }

  async login() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const username = await this.question('Username: ');
        const password = await this.question('Password: ');

        const response = await axios.post(`${API_BASE}/auth/login`, {
          username,
          password
        }, { timeout: 10000 });

        if (response.data.success) {
          this.authToken = response.data.token;
          console.log('✅ Authentication successful');
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
          return;
        } else {
          console.log('❌ Authentication failed:', response.data.error || 'Invalid credentials');
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Retrying... (${retryCount}/${maxRetries})`);
          }
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.log('❌ Cannot connect to backend server. Is it running?');
          console.log('💡 Try running in demo mode: node katana-terminal.js --demo');
          process.exit(1);
        } else if (error.response) {
          console.log('❌ Login error:', error.response.data?.error || error.response.statusText);
        } else {
          console.log('❌ Network error:', error.message);
        }
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying... (${retryCount}/${maxRetries})`);
        }
      }
    }

    console.log('❌ Maximum login attempts exceeded');
    process.exit(1);
  }

  async connectWebSocket() {
    if (this.demoMode) return;

    try {
      console.log('🔌 Connecting to Katana engine...');
      this.ws = new WebSocket(`${KATANA_WS_URL}?token=${this.authToken}`);

      this.ws.on('open', () => {
        console.log('🔌 Connected to Katana engine');
        this.isConnected = true;

        // Subscribe to channels
        this.ws.send(JSON.stringify({
          type: 'SUBSCRIBE',
          channels: ['tokens', 'trades', 'pnl', 'risk', 'autotrade-status']
        }));
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
        console.log('🔌 Disconnected from Katana engine');
        this.isConnected = false;
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        this.isConnected = false;
      });

      // Wait for connection or timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);

        this.ws.on('open', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.ws.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      // Fetch initial auto-trade status
      await this.fetchAutoTradeStatus();

    } catch (error) {
      console.error('Failed to connect to Katana WebSocket:', error.message);
      console.log('⚠️  Continuing in offline mode...');
      this.isConnected = false;
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'TOKEN_DETECTED':
        this.displayTokenDetection(message.data);
        break;
      case 'TRADE_UPDATE':
        this.displayTradeUpdate(message.data);
        break;
      case 'PNL_UPDATE':
        this.pnlData = message.data;
        this.updateStatusBar();
        break;
      case 'RISK_ALERT':
        this.displayRiskAlert(message.data);
        break;
      case 'autotrade-status':
        this.handleAutoTradeStatusUpdate(message);
        break;
      case 'PRICE_UPDATE':
        // Update displayed prices if needed
        break;
      default:
        break;
    }
  }

  displayTokenDetection(token) {
    console.log(`\n🎯 NEW TOKEN: ${token.symbol || 'UNKNOWN'} (${token.mint.slice(0, 8)}...)`);
    console.log(`   Liquidity: ${token.liquidity?.toFixed(1) || 'N/A'} SOL`);
    console.log(`   Risk Level: ${token.riskLevel || 'UNKNOWN'}`);
    this.rl.prompt();
  }

  displayTradeUpdate(trade) {
    const emoji = trade.side === 'buy' ? '🟢' : '🔴';
    console.log(`\n${emoji} TRADE: ${trade.side.toUpperCase()} ${trade.amount} ${trade.tokenMint.slice(0, 8)}...`);
    console.log(`   Price: $${trade.price?.toFixed(6) || 'N/A'}`);
    console.log(`   Status: ${trade.status || 'EXECUTED'}`);
    this.rl.prompt();
  }

  displayRiskAlert(alert) {
    console.log(`\n🚨 RISK ALERT: ${alert.alertType} (${alert.severity})`);
    console.log(`   Token: ${alert.tokenMint?.slice(0, 8) || 'N/A'}...`);
    this.rl.prompt();
  }

  updateStatusBar() {
    // Update terminal title/status if possible
    const pnl = this.pnlData.totalPnL >= 0 ? `+$${this.pnlData.totalPnL.toFixed(2)}` : `-$${Math.abs(this.pnlData.totalPnL).toFixed(2)}`;
    const percent = `${this.pnlData.pnlPercentage >= 0 ? '+' : ''}${this.pnlData.pnlPercentage.toFixed(2)}%`;
    process.title = `Katana Terminal | PnL: ${pnl} (${percent}) | Trades: ${this.pnlData.activeTrades}`;
  }

  showWelcome() {
    console.log('\n================================');
    console.log('      HFT SYSTEM - KATANA MODE');
    console.log('================================\n');
    console.log(`${this.getAutoTradeDisplay()}`);
    console.log(`   MODE       : KATANA`);
    console.log(`   STATUS     : ${this.katanaActive ? '🟢 RUNNING' : '🔴 STOPPED'}\n`);
    console.log('Available commands:');
    console.log('  start          - Start Katana Mode');
    console.log('  stop           - Stop Katana Mode');
    console.log('  status         - Show current status');
    console.log('  buy <amount>   - Buy selected token');
    console.log('  sell <amount>  - Sell selected token');
    console.log('  select <mint>  - Select token for trading');
    console.log('  wallets        - List configured wallets');
    console.log('  usewallet <pk> - Select wallet for trades');
    console.log('  predict <mint> - Request AI signal for token');
    console.log('  positions      - Show active positions');
    console.log('  tokens         - Show recent token detections');
    console.log('  help           - Show this help');
    console.log('  exit           - Exit terminal\n');
    console.log('Keyboard shortcuts:');
    console.log('  [T]            - Toggle AUTO TRADE ON/OFF');
    console.log('  [H]            - Show help');
    console.log('  [Q]            - Quick exit\n');
  }

  async handleCommand(line) {
    const parts = line.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 't':
        case 'toggle':
          await this.toggleAutoTrade();
          break;
        case 'autotrade':
          await this.setAutoTrade(args[0] === 'on');
          break;
        case 'start':
          await this.startKatana();
          break;
        case 'stop':
          await this.stopKatana();
          break;
        case 'status':
          await this.showStatus();
          break;
        case 'buy':
          await this.executeTrade('buy', args[0]);
          break;
        case 'sell':
          await this.executeTrade('sell', args[0]);
          break;
        case 'select':
          this.selectToken(args[0]);
          break;
        case 'wallets':
          await this.showWallets();
          break;
        case 'usewallet':
          this.selectWallet(args[0]);
          break;
        case 'predict':
          await this.requestPrediction(args[0]);
          break;
        case 'positions':
          await this.showPositions();
          break;
        case 'tokens':
          await this.showTokens();
          break;
        case 'h':
        case 'help':
          this.showWelcome();
          break;
        case 'q':
        case 'exit':
          this.handleExit();
          return;
        default:
          console.log('❌ Unknown command. Type "help" for available commands.');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    this.rl.prompt();
  }

  async startKatana() {
    if (this.demoMode) {
      this.katanaActive = true;
      console.log('✅ Katana Mode started (DEMO)');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/katana/start`);
      if (response.data.success) {
        console.log('✅ Katana Mode started');
        this.katanaActive = true;
      }
    } catch (error) {
      console.log('❌ Failed to start Katana:', error.response?.data?.error || error.message);
    }
  }

  async stopKatana() {
    if (this.demoMode) {
      this.katanaActive = false;
      console.log('🛑 Katana Mode stopped (DEMO)');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/katana/stop`);
      if (response.data.success) {
        console.log('🛑 Katana Mode stopped');
        this.katanaActive = false;
      }
    } catch (error) {
      console.log('❌ Failed to stop Katana:', error.response?.data?.error || error.message);
    }
  }

  async showStatus() {
    if (this.demoMode) {
      console.log('\n📊 Katana Status (DEMO):');
      console.log(`   Active: ${this.katanaActive ? '✅' : '❌'}`);
      console.log(`   Active Trades: ${Math.floor(Math.random() * 5)}`);
      console.log(`   Watched Tokens: ${Math.floor(Math.random() * 20)}`);
      console.log(`   Total PnL: ${this.pnlData.totalPnL >= 0 ? '+' : ''}$${this.pnlData.totalPnL.toFixed(2)}`);
      console.log(`   PnL %: ${this.pnlData.pnlPercentage >= 0 ? '+' : ''}${this.pnlData.pnlPercentage.toFixed(2)}%`);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/katana/status`);
      const status = response.data.data;

      console.log('\n📊 Katana Status:');
      console.log(`   Active: ${status.isActive ? '✅' : '❌'}`);
      console.log(`   Active Trades: ${status.activeTrades}`);
      console.log(`   Watched Tokens: ${status.watchedTokens}`);
      console.log(`   Total PnL: ${this.pnlData.totalPnL >= 0 ? '+' : ''}$${this.pnlData.totalPnL.toFixed(2)}`);
      console.log(`   PnL %: ${this.pnlData.pnlPercentage >= 0 ? '+' : ''}${this.pnlData.pnlPercentage.toFixed(2)}%`);

    } catch (error) {
      console.log('❌ Failed to get status:', error.response?.data?.error || error.message);
    }
  }

  async executeTrade(side, amount) {
    if (this.demoMode) {
      if (!this.selectedToken) {
        console.log('❌ No token selected. Use "select <mint>" first.');
        return;
      }
      console.log(`✅ ${side.toUpperCase()} order submitted (DEMO) - ${amount} ${this.selectedToken.slice(0, 8)}...`);
      return;
    }

    if (!this.selectedToken) {
      console.log('❌ No token selected. Use "select <mint>" first.');
      return;
    }

    if (!amount || isNaN(parseFloat(amount))) {
      console.log('❌ Invalid amount. Usage: buy/sell <amount>');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/katana/trade`, {
        side,
        tokenMint: this.selectedToken,
        amount: parseFloat(amount),
        slippage: 0.3,
        walletId: this.selectedWallet,
        useJito: false
      });

      if (response.data.success) {
        console.log(`✅ ${side.toUpperCase()} order submitted`);
      }
    } catch (error) {
      console.log(`❌ Trade failed:`, error.response?.data?.error || error.message);
    }
  }

  async showWallets() {
    if (this.demoMode) {
      console.log('\n🔐 Configured Wallets (DEMO):');
      const demoWallets = [
        { name: 'Main Wallet', publicKey: '11111111111111111111111111111112', balance: 1250.50 },
        { name: 'Trading Wallet', publicKey: '22222222222222222222222222222222', balance: 500.25 }
      ];
      demoWallets.forEach((wallet, index) => {
        const selected = wallet.publicKey === this.selectedWallet ? ' [ACTIVE]' : '';
        console.log(`   ${index + 1}. ${wallet.name} - ${wallet.publicKey}${selected} ($${wallet.balance})`);
      });
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/trading/wallets`);
      const wallets = response.data.wallets || [];

      console.log('\n🔐 Configured Wallets:');
      if (!wallets.length) {
        console.log('   No wallets found.');
        return;
      }

      wallets.forEach((wallet, index) => {
        const selected = wallet.publicKey === this.selectedWallet ? ' [ACTIVE]' : '';
        console.log(`   ${index + 1}. ${wallet.name} - ${wallet.publicKey}${selected}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch wallets:', error.response?.data?.error || error.message);
    }
  }

  selectWallet(publicKey) {
    if (!publicKey) {
      console.log('❌ Usage: usewallet <publicKey>');
      return;
    }
    this.selectedWallet = publicKey;
    console.log(`✅ Selected wallet: ${publicKey}`);
  }

  async requestPrediction(tokenMint) {
    if (this.demoMode) {
      if (!tokenMint) {
        console.log('❌ Usage: predict <tokenMint>');
        return;
      }

      const predictions = ['BUY', 'SELL', 'HOLD'];
      const scores = [Math.floor(Math.random() * 40) + 30, Math.floor(Math.random() * 40) + 60];
      const score = scores[Math.floor(Math.random() * scores.length)];
      const recommendation = score > 70 ? 'BUY' : score > 40 ? 'HOLD' : 'SELL';
      const confidence = Math.random() * 0.5 + 0.5;

      console.log(`\n🤖 Prediction for ${tokenMint} (DEMO):`);
      console.log(`   Score        : ${score}`);
      console.log(`   Recommendation: ${recommendation}`);
      console.log(`   Confidence   : ${confidence.toFixed(2)}`);
      return;
    }

    if (!tokenMint) {
      console.log('❌ Usage: predict <tokenMint>');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/ai/predict`, { tokenMint });
      const payload = response.data.data || response.data;

      console.log(`\n🤖 Prediction for ${tokenMint}:`);
      console.log(`   Score        : ${payload.score}`);
      console.log(`   Recommendation: ${payload.recommendation}`);
      console.log(`   Confidence   : ${payload.confidence}`);
      if (payload.riskLevel) console.log(`   Risk Level   : ${payload.riskLevel}`);
      if (payload.model) console.log(`   Model        : ${payload.model}`);
    } catch (error) {
      console.log('❌ Prediction failed:', error.response?.data?.error || error.message);
    }
  }

  selectToken(mint) {
    if (!mint) {
      console.log('❌ Usage: select <token_mint>');
      return;
    }
    this.selectedToken = mint;
    console.log(`🎯 Selected token: ${mint}`);
  }

  async showPositions() {
    if (this.demoMode) {
      console.log('\n📈 Active Positions (DEMO):');
      const demoPositions = [
        { tokenMint: 'So11111111111111111111111111111111111111112', amount: 0.5, pnl: 25.30 },
        { tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: 100, pnl: -5.20 }
      ];
      demoPositions.forEach((pos, index) => {
        const pnl = pos.pnl >= 0 ? `+$${pos.pnl.toFixed(2)}` : `-$${Math.abs(pos.pnl).toFixed(2)}`;
        console.log(`   ${index + 1}. ${pos.tokenMint.slice(0, 8)}... | ${pos.amount} | ${pnl}`);
      });
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/katana/positions`);
      const positions = response.data.data.positions;

      console.log('\n📈 Active Positions:');
      if (positions.length === 0) {
        console.log('   No active positions');
      } else {
        positions.forEach((pos, index) => {
          const pnl = pos.pnl >= 0 ? `+$${pos.pnl.toFixed(2)}` : `-$${Math.abs(pos.pnl).toFixed(2)}`;
          console.log(`   ${index + 1}. ${pos.tokenMint.slice(0, 8)}... | ${pos.amount.toFixed(4)} | ${pnl}`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to get positions:', error.response?.data?.error || error.message);
    }
  }

  async showTokens() {
    if (this.demoMode) {
      console.log('\n🎯 Recent Token Detections (DEMO):');
      const demoTokens = [
        { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', riskLevel: 'Low', liquidity: 150000 },
        { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', riskLevel: 'Medium', liquidity: 75000 },
        { symbol: 'NEW', mint: '11111111111111111111111111111112', riskLevel: 'High', liquidity: 25000 }
      ];
      demoTokens.forEach((token, index) => {
        console.log(`   ${index + 1}. ${token.symbol || token.mint} (${token.mint.slice(0, 8)}...) - ${token.riskLevel} - Liquidity: ${token.liquidity}`);
      });
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/katana/detections`);
      const detections = response.data.data.detections || [];

      console.log('\n🎯 Recent Token Detections:');
      if (!detections.length) {
        console.log('   No recent detections available.');
        return;
      }

      detections.slice(0, 10).forEach((token, index) => {
        const timeAgo = Math.max(0, Math.floor((Date.now() - token.detectedAt) / 1000));
        console.log(`   ${index + 1}. ${token.symbol || token.mint} (${token.mint.slice(0, 8)}...) - ${token.riskLevel} - Liquidity: ${token.liquidity} - ${timeAgo}s ago`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch recent tokens:', error.response?.data?.error || error.message);
    }
  }

  /**
   * Get formatted auto-trade status for terminal display
   */
  getAutoTradeDisplay() {
    const emoji = this.autoTradeEnabled ? '🟢' : '🔴';
    const status = this.autoTradeEnabled ? 'ON' : 'OFF';
    const color = this.autoTradeEnabled ? '\x1b[32m' : '\x1b[31m'; // Green or Red
    const reset = '\x1b[0m';
    return `${emoji} AUTO TRADE : ${color}${status}${reset}`;
  }

  /**
   * Handle auto-trade status updates from WebSocket
   */
  handleAutoTradeStatusUpdate(message) {
    this.autoTradeEnabled = message.AUTO_TRADE;
    console.log(`\n${this.getAutoTradeDisplay()}`);
    console.log(`   Updated: ${message.timestamp}`);
    this.rl.prompt();
  }

  /**
   * Toggle auto-trade ON/OFF
   */
  async toggleAutoTrade() {
    try {
      const response = await axios.post(
        `${API_BASE}/api/system/autotrade/toggle`,
        {},
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        this.autoTradeEnabled = response.data.AUTO_TRADE;
        console.log(`\n✅ Auto Trade ${response.data.status}`);
        console.log(`${this.getAutoTradeDisplay()}`);
      }
    } catch (error) {
      console.log('❌ Failed to toggle auto-trade:', error.response?.data?.error || error.message);
    }
  }

  /**
   * Set auto-trade to ON or OFF
   */
  async setAutoTrade(enabled) {
    try {
      const response = await axios.post(
        `${API_BASE}/api/system/autotrade`,
        { enabled, action: 'set' },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        this.autoTradeEnabled = response.data.AUTO_TRADE;
        console.log(`\n✅ ${response.data.message}`);
        console.log(`${this.getAutoTradeDisplay()}`);
      }
    } catch (error) {
      console.log('❌ Failed to set auto-trade:', error.response?.data?.error || error.message);
    }
  }

  /**
   * Fetch auto-trade status from backend
   */
  async fetchAutoTradeStatus() {
    try {
      const response = await axios.get(
        `${API_BASE}/api/system/autotrade`,
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );
      this.autoTradeEnabled = response.data.AUTO_TRADE;
    } catch (error) {
      console.error('Failed to fetch auto-trade status:', error.message);
    }
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  handleExit() {
    console.log('\n⚔️ Exiting Katana Terminal...');
    if (this.ws) {
      this.ws.close();
    }
    this.rl.close();
    process.exit(0);
  }
}

// Start the terminal
if (require.main === module) {
  const args = process.argv.slice(2);
  const demoMode = args.includes('--demo') || args.includes('-d');

  const terminal = new KatanaTerminal({ demo: demoMode });
  terminal.start().catch(console.error);
}

module.exports = KatanaTerminal;