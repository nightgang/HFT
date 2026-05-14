#!/usr/bin/env node

const readline = require('readline');
const WebSocket = require('ws');
const axios = require('axios');

// Constants
const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const KATANA_WS_URL = process.env.KATANA_WS_URL || 'ws://localhost:3003';
const MAX_LOGIN_RETRIES = 3;
const WS_CONNECTION_TIMEOUT = 5000;
const AVAILABLE_COMMANDS = [
  'start', 'stop', 'status', 'buy', 'sell', 'select', 'wallets', 'usewallet',
  'predict', 'positions', 'tokens', 'history', 'trades', 'orders', 'cancel-order',
  'risk-heatmap', 'risk-correlation', 'alerts', 'ack-alert', 'sentiment', 'pnl',
  'portfolio', 'settings', 'help', 'exit', 'toggle', 'autotrade'
];

// Emojis and symbols
const EMOJIS = {
  SWORD: '⚔️',
  GREEN_CIRCLE: '🟢',
  RED_CIRCLE: '🔴',
  CROSS_MARK: '❌',
  CHECK_MARK: '✅',
  STOP_SIGN: '🛑',
  CHART_UP: '📈',
  TARGET: '🎯',
  LOCK: '🔐',
  ROBOT: '🤖',
  WARNING: '🚨',
  GEAR: '⚙️'
};

// Messages
const MESSAGES = {
  AUTH_SUCCESS: '✅ Authentication successful',
  AUTH_FAILED: '❌ Authentication failed',
  CONNECTION_FAILED: '❌ Cannot connect to backend server. Is it running?',
  DEMO_MODE: '🎭 DEMO MODE - No backend required',
  KATANA_STARTED: '✅ Katana Mode started',
  KATANA_STOPPED: '🛑 Katana Mode stopped',
  TRADE_SUBMITTED: '✅ Trade order submitted',
  NO_TOKEN_SELECTED: '❌ No token selected. Use "select <mint>" first.',
  INVALID_AMOUNT: '❌ Invalid amount. Usage: buy/sell <amount>',
  UNKNOWN_COMMAND: '❌ Unknown command. Type "help" for available commands.',
  EXITING: '⚔️ Exiting Katana Terminal...'
};

/**
 * Katana Terminal CLI for HFT Solana Trading System
 */
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
    this.availableCommands = AVAILABLE_COMMANDS;
  }

  completer(line) {
    const commands = this.availableCommands.filter(cmd => cmd.startsWith(line));
    return [commands.length ? commands : this.availableCommands, line];
  }

  question(promptText) {
    return new Promise((resolve) => {
      this.rl.question(promptText, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Start the Katana terminal
   */
  async start() {
    console.clear();
    console.log('⚔️  KATANA MODE TERMINAL');
    console.log('========================');

    if (!this.demoMode && !process.stdin.isTTY) {
      console.log('⚠️  No interactive terminal detected. Starting in demo mode.');
      this.demoMode = true;
    }
    console.log('⚔️  KATANA MODE TERMINAL');
    console.log('========================');

    if (this.demoMode) {
      console.log(MESSAGES.DEMO_MODE);
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

  /**
   * Authenticate user with backend
   */
  async login() {
    let retryCount = 0;

    while (retryCount < MAX_LOGIN_RETRIES) {
      try {
        const username = await this.question('Username: ');
        const password = await this.question('Password: ');

        const response = await axios.post(`${API_BASE}/auth/login`, {
          username,
          password
        }, { timeout: 10000 });

        if (response.data.success) {
          this.authToken = response.data.token;
          console.log(MESSAGES.AUTH_SUCCESS);
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
          return;
        } else {
          console.log(`${MESSAGES.AUTH_FAILED}:`, response.data.error || 'Invalid credentials');
          retryCount++;
          if (retryCount < MAX_LOGIN_RETRIES) {
            console.log(`Retrying... (${retryCount}/${MAX_LOGIN_RETRIES})`);
          }
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.log(MESSAGES.CONNECTION_FAILED);
          console.log('💡 Try running in demo mode: node katana-terminal.js --demo');
          process.exit(1);
        } else if (error.response) {
          console.log('❌ Login error:', error.response.data?.error || error.response.statusText);
        } else {
          console.log('❌ Network error:', error.message);
        }
        retryCount++;
        if (retryCount < MAX_LOGIN_RETRIES) {
          console.log(`Retrying... (${retryCount}/${MAX_LOGIN_RETRIES})`);
        }
      }
    }

    console.log('❌ Maximum login attempts exceeded');
    process.exit(1);
  }

  /**
   * Establish WebSocket connection to Katana engine
   */
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
        }, WS_CONNECTION_TIMEOUT);

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
    const pnl = this.formatPnL(this.pnlData.totalPnL);
    const percent = this.formatPercentage(this.pnlData.pnlPercentage);
    process.title = `Katana Terminal | PnL: ${pnl} (${percent}) | Trades: ${this.pnlData.activeTrades}`;
  }

  /**
   * Display welcome message and available commands
   */
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
    console.log('  history        - Show trade history for selected wallet');
    console.log('  orders         - Show advanced orders for selected wallet');
    console.log('  cancel-order <id> - Cancel an advanced order');
    console.log('  risk-heatmap   - Show portfolio risk heatmap');
    console.log('  risk-correlation - Show portfolio correlation data');
    console.log('  alerts         - Show active predictive alerts');
    console.log('  ack-alert <id> - Acknowledge an alert');
    console.log('  sentiment bullish - Show bullish sentiment opportunities');
    console.log('  sentiment token <mint> - Show sentiment for a token');
    console.log('  pnl            - Show P&L dashboard summary');
    console.log('  portfolio      - Show portfolio summary for selected wallet');
    console.log('  settings show <wallet> - Show wallet limits');
    console.log('  settings set <wallet> <spendingLimitUsd> [dailySpendingUsd] - Update wallet limits');
    console.log('  help           - Show this help');
    console.log('  exit           - Exit terminal\n');
    console.log('Keyboard shortcuts:');
    console.log('  [T]            - Toggle AUTO TRADE ON/OFF');
    console.log('  [H]            - Show help');
    console.log('  [Q]            - Quick exit\n');
  }

  /**
   * Process user command input
   * @param {string} line - The command line input
   */
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
        case 'history':
        case 'trades':
          await this.showTradeHistory();
          break;
        case 'orders':
          await this.showAdvancedOrders();
          break;
        case 'cancel-order':
          await this.cancelAdvancedOrder(args[0]);
          break;
        case 'risk-heatmap':
          await this.showRiskHeatmap();
          break;
        case 'risk-correlation':
          await this.showRiskCorrelation();
          break;
        case 'alerts':
          await this.showAlerts('active');
          break;
        case 'ack-alert':
          await this.acknowledgeAlert(args[0]);
          break;
        case 'sentiment':
          await this.showSentiment(args);
          break;
        case 'pnl':
          await this.showPnLDashboard();
          break;
        case 'portfolio':
          await this.showPortfolio(args[0]);
          break;
        case 'settings':
          await this.handleSettingsCommand(args);
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
          console.log(MESSAGES.UNKNOWN_COMMAND);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    this.rl.prompt();
  }

  async startKatana() {
    if (this.demoMode) {
      this.katanaActive = true;
      console.log(`${MESSAGES.KATANA_STARTED} (DEMO)`);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/katana/start`);
      if (response.data.success) {
        console.log(MESSAGES.KATANA_STARTED);
        this.katanaActive = true;
      }
    } catch (error) {
      console.log('❌ Failed to start Katana:', error.response?.data?.error || error.message);
    }
  }

  async stopKatana() {
    if (this.demoMode) {
      this.katanaActive = false;
      console.log(`${MESSAGES.KATANA_STOPPED} (DEMO)`);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/katana/stop`);
      if (response.data.success) {
        console.log(MESSAGES.KATANA_STOPPED);
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
      console.log(`   Total PnL: ${this.formatPnL(this.pnlData.totalPnL)}`);
      console.log(`   PnL %: ${this.formatPercentage(this.pnlData.pnlPercentage)}%`);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/katana/status`);
      const status = response.data.data;

      console.log('\n📊 Katana Status:');
      console.log(`   Active: ${status.isActive ? '✅' : '❌'}`);
      console.log(`   Active Trades: ${status.activeTrades}`);
      console.log(`   Watched Tokens: ${status.watchedTokens}`);
      console.log(`   Total PnL: ${this.formatPnL(this.pnlData.totalPnL)}`);
      console.log(`   PnL %: ${this.formatPercentage(this.pnlData.pnlPercentage)}%`);

    } catch (error) {
      console.log('❌ Failed to get status:', error.response?.data?.error || error.message);
    }
  }

  async executeTrade(side, amount) {
    if (this.demoMode) {
      if (!this.selectedToken) {
        console.log(MESSAGES.NO_TOKEN_SELECTED);
        return;
      }
      console.log(`${MESSAGES.TRADE_SUBMITTED} (DEMO) - ${amount} ${this.selectedToken.slice(0, 8)}...`);
      return;
    }

    if (!this.selectedToken) {
      console.log(MESSAGES.NO_TOKEN_SELECTED);
      return;
    }

    if (!amount || isNaN(parseFloat(amount))) {
      console.log(MESSAGES.INVALID_AMOUNT);
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
        console.log(MESSAGES.TRADE_SUBMITTED);
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
        const pnl = this.formatPnL(pos.pnl);
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
          const pnl = this.formatPnL(pos.pnl);
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

  requireSelectedWallet(command) {
    if (!this.selectedWallet) {
      console.log(`❌ Select a wallet first with \"usewallet <publicKey>\" to use ${command}.`);
      return null;
    }
    return this.selectedWallet;
  }

  async showTradeHistory() {
    if (this.demoMode) {
      console.log('\n📜 Trade History (DEMO):');
      const demoHistory = [
        { id: 'tx1', token: 'SOL', side: 'BUY', amount: 3.0, price: 45.12, pnl: 28.80 },
        { id: 'tx2', token: 'RAY', side: 'SELL', amount: 200, price: 0.93, pnl: -12.10 }
      ];
      demoHistory.forEach((trade, index) => {
        console.log(`   ${index + 1}. [${trade.side}] ${trade.amount} ${trade.token} @ $${trade.price.toFixed(2)} | PnL: ${this.formatPnL(trade.pnl)}`);
      });
      return;
    }

    const walletId = this.requireSelectedWallet('trade history');
    if (!walletId) return;

    try {
      const response = await axios.get(`${API_BASE}/api/trading/trades/${walletId}`);
      const trades = response.data.trades || [];

      console.log('\n📜 Trade History:');
      if (!trades.length) {
        console.log('   No trades found for selected wallet.');
        return;
      }

      trades.slice(0, 20).forEach((trade, index) => {
        console.log(`   ${index + 1}. [${trade.side?.toUpperCase() || 'N/A'}] ${trade.amount || 'N/A'} ${trade.tokenMint?.slice(0, 8) || trade.token || ''} @ $${trade.price?.toFixed(4) || 'N/A'} | PnL: ${this.formatPnL(trade.pnl || 0)}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch trade history:', error.response?.data?.error || error.message);
    }
  }

  async showAdvancedOrders() {
    if (this.demoMode) {
      console.log('\n📦 Advanced Orders (DEMO):');
      const demoOrders = [
        { orderId: 'A1', type: 'Stop-Loss', token: 'SOL', amount: 2, status: 'Pending' },
        { orderId: 'A2', type: 'Take-Profit', token: 'RAY', amount: 100, status: 'Active' }
      ];
      demoOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.orderId} | ${order.type} ${order.amount} ${order.token} | ${order.status}`);
      });
      return;
    }

    const walletId = this.requireSelectedWallet('advanced orders');
    if (!walletId) return;

    try {
      const response = await axios.get(`${API_BASE}/api/trading/advanced-orders/${walletId}`);
      const orders = response.data.orders || [];

      console.log('\n📦 Advanced Orders:');
      if (!orders.length) {
        console.log('   No advanced orders found for selected wallet.');
        return;
      }

      orders.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.orderId || order.id} | ${order.type || order.orderType} ${order.amount || order.quantity} ${order.tokenMint?.slice(0, 8) || order.token || ''} | ${order.status}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch advanced orders:', error.response?.data?.error || error.message);
    }
  }

  async cancelAdvancedOrder(orderId) {
    if (!orderId) {
      console.log('❌ Usage: cancel-order <orderId>');
      return;
    }

    if (this.demoMode) {
      console.log(`✅ (DEMO) Cancelled advanced order ${orderId}`);
      return;
    }

    const walletId = this.requireSelectedWallet('cancel-order');
    if (!walletId) return;

    try {
      const response = await axios.delete(`${API_BASE}/api/trading/advanced-orders/${orderId}`, {
        data: { walletId }
      });

      if (response.data.success) {
        console.log(`✅ Advanced order ${orderId} cancelled`);
      }
    } catch (error) {
      console.log('❌ Failed to cancel advanced order:', error.response?.data?.error || error.message);
    }
  }

  async showRiskHeatmap() {
    if (this.demoMode) {
      console.log('\n🌡️ Risk Heatmap (DEMO):');
      console.log('   - Low concentration in SOL');
      console.log('   - Medium concentration in RAY');
      console.log('   - High concentration in MNGO');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/risk/heatmap`);
      const heatmap = response.data.data || {};

      console.log('\n🌡️ Risk Heatmap:');
      if (!heatmap.positions || !heatmap.positions.length) {
        console.log('   No risk data available.');
        return;
      }

      heatmap.positions.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.token || item.symbol || item.tokenMint?.slice(0, 8)} - Exposure: ${item.exposure || item.weight || 'N/A'} - Risk: ${item.riskLevel || item.level || 'N/A'}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch risk heatmap:', error.response?.data?.error || error.message);
    }
  }

  async showRiskCorrelation() {
    if (this.demoMode) {
      console.log('\n📉 Risk Correlation (DEMO):');
      console.log('   SOL/RAY: 0.32');
      console.log('   SOL/USDC: -0.14');
      console.log('   RAY/COPE: 0.76');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/risk/correlation`);
      const matrix = response.data.data || [];

      console.log('\n📉 Risk Correlation Matrix:');
      if (!matrix.length) {
        console.log('   No correlation data available.');
        return;
      }

      matrix.slice(0, 10).forEach((row) => {
        console.log(`   ${row.tokenA || row.a} / ${row.tokenB || row.b}: ${row.correlation?.toFixed(2) || 'N/A'}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch correlation matrix:', error.response?.data?.error || error.message);
    }
  }

  async showAlerts(filter = 'active') {
    if (this.demoMode) {
      console.log('\n🚨 Predictive Alerts (DEMO):');
      console.log('   [A1] Price spike detected in SOL');
      console.log('   [A2] Liquidity drain in Raydium pool');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/alerts/${filter}`);
      const alerts = response.data.data || [];

      console.log(`\n🚨 Predictive Alerts (${filter}):`);
      if (!alerts.length) {
        console.log('   No alerts found.');
        return;
      }

      alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.id || alert.alertId}] ${alert.title || alert.message || alert.type} - ${alert.severity || 'N/A'} - Status: ${alert.status || 'N/A'}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch alerts:', error.response?.data?.error || error.message);
    }
  }

  async acknowledgeAlert(alertId) {
    if (!alertId) {
      console.log('❌ Usage: ack-alert <alertId>');
      return;
    }

    if (this.demoMode) {
      console.log(`✅ (DEMO) Acknowledged alert ${alertId}`);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/alerts/${alertId}/acknowledge`);
      if (response.data.success) {
        console.log(`✅ Alert ${alertId} acknowledged`);
      }
    } catch (error) {
      console.log('❌ Failed to acknowledge alert:', error.response?.data?.error || error.message);
    }
  }

  async showSentiment(args) {
    if (this.demoMode) {
      if (args[0] === 'token' && args[1]) {
        console.log(`\n📊 Sentiment for ${args[1]} (DEMO): Positive`);
      } else {
        console.log('\n📊 Bullish Sentiment Opportunities (DEMO):');
        console.log('   SOL, RAY, BONK');
      }
      return;
    }

    try {
      if (args[0] === 'token' && args[1]) {
        const response = await axios.get(`${API_BASE}/api/sentiment/token/${args[1]}`);
        const sentiment = response.data.data || {};
        console.log(`\n📊 Sentiment for ${args[1]}:`);
        console.log(`   Score: ${sentiment.score ?? 'N/A'}`);
        console.log(`   Trend: ${sentiment.trend || 'N/A'}`);
        console.log(`   Summary: ${sentiment.summary || 'N/A'}`);
      } else {
        const response = await axios.get(`${API_BASE}/api/sentiment/bullish`);
        const opportunities = response.data.data || [];
        console.log('\n📊 Bullish Sentiment Opportunities:');
        if (!opportunities.length) {
          console.log('   No bullish opportunities found.');
          return;
        }
        opportunities.slice(0, 10).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.token || item.symbol || item.mint} - ${item.score || item.sentimentScore || 'N/A'}`);
        });
      }
    } catch (error) {
      console.log('❌ Failed to fetch sentiment data:', error.response?.data?.error || error.message);
    }
  }

  async showPnLDashboard() {
    if (this.demoMode) {
      console.log('\n📈 P&L Dashboard (DEMO):');
      console.log('   Total PnL: +$4,230.50');
      console.log('   Daily Change: +3.2%');
      console.log('   Open Positions: 8');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/analytics/pnl/dashboard`);
      const dashboard = response.data.data || {};

      console.log('\n📈 P&L Dashboard:');
      console.log(`   Total PnL: ${this.formatPnL(dashboard.totalPnL ?? 0)}`);
      console.log(`   Period: ${dashboard.period || 'N/A'}`);
      console.log(`   Return: ${dashboard.returnPercentage != null ? `${dashboard.returnPercentage.toFixed(2)}%` : 'N/A'}`);
      console.log(`   Open Positions: ${dashboard.openPositions ?? 'N/A'}`);
      console.log(`   Realized PnL: ${this.formatPnL(dashboard.realizedPnL ?? 0)}`);
      console.log(`   Unrealized PnL: ${this.formatPnL(dashboard.unrealizedPnL ?? 0)}`);
    } catch (error) {
      console.log('❌ Failed to fetch P&L dashboard:', error.response?.data?.error || error.message);
    }
  }

  async showPortfolio(walletPublicKey) {
    if (this.demoMode) {
      console.log('\n💼 Portfolio Summary (DEMO):');
      console.log('   Wallet: demo-wallet-1');
      console.log('   Total Value: $12,540.10');
      console.log('   Holdings: SOL, RAY, BONK');
      console.log('   Unrealized PnL: +$1,220.50');
      return;
    }

    const publicKey = walletPublicKey || this.requireSelectedWallet('portfolio');
    if (!publicKey) return;

    try {
      const response = await axios.get(`${API_BASE}/api/trading/portfolio/${publicKey}`);
      const portfolio = response.data || response.data.data || {};

      console.log('\n💼 Portfolio Summary:');
      if (!portfolio || typeof portfolio !== 'object') {
        console.log('   No portfolio data available.');
        return;
      }

      console.log(`   Wallet: ${publicKey}`);
      console.log(`   Total Value: $${(portfolio.totalValueUsd || portfolio.total_portfolio_value_usd || 0).toFixed(2)}`);
      console.log(`   Unrealized PnL: ${this.formatPnL(portfolio.unrealizedPnL || portfolio.unrealized_pnl_usd || 0)}`);
      console.log(`   Realized PnL: ${this.formatPnL(portfolio.realizedPnL || portfolio.realized_pnl_usd || 0)}`);
      console.log(`   Holdings: ${Array.isArray(portfolio.holdings) ? portfolio.holdings.map(h => h.symbol || h.tokenMint || h.token).join(', ') : 'N/A'}`);
    } catch (error) {
      console.log('❌ Failed to fetch portfolio summary:', error.response?.data?.error || error.message);
    }
  }

  async handleSettingsCommand(args) {
    if (args[0] === 'show') {
      await this.showWalletSettings(args[1]);
      return;
    }

    if (args[0] === 'set') {
      await this.setWalletSettings(args[1], args[2], args[3]);
      return;
    }

    console.log('❌ Usage: settings show <walletAddress> OR settings set <walletAddress> <spendingLimitUsd> [dailySpendingUsd]');
  }

  async showWalletSettings(walletAddress) {
    if (this.demoMode) {
      console.log('\n⚙️ Wallet Settings (DEMO):');
      console.log('   Wallet: demo-wallet-1');
      console.log('   Spending Limit USD: $10,000');
      console.log('   Daily Spending USD: $500');
      return;
    }

    const publicKey = walletAddress || this.requireSelectedWallet('settings show');
    if (!publicKey) return;

    try {
      const response = await axios.get(`${API_BASE}/api/trading/wallet/${publicKey}`);
      const wallet = response.data.wallet || response.data || {};

      console.log('\n⚙️ Wallet Settings:');
      console.log(`   Wallet: ${publicKey}`);
      console.log(`   Spending Limit USD: $${wallet.spending_limit_usd ?? wallet.spendingLimitUsd ?? 'N/A'}`);
      console.log(`   Daily Spending USD: $${wallet.daily_spending_usd ?? wallet.dailySpendingUsd ?? 'N/A'}`);
    } catch (error) {
      console.log('❌ Failed to fetch wallet settings:', error.response?.data?.error || error.message);
    }
  }

  async setWalletSettings(walletAddress, spendingLimitUsd, dailySpendingUsd) {
    if (this.demoMode) {
      console.log(`\n✅ (DEMO) Wallet settings updated for ${walletAddress}`);
      return;
    }

    if (!walletAddress || !spendingLimitUsd) {
      console.log('❌ Usage: settings set <walletAddress> <spendingLimitUsd> [dailySpendingUsd]');
      return;
    }

    try {
      const body = {
        walletAddress,
        spendingLimitUsd: parseFloat(spendingLimitUsd),
      };
      if (dailySpendingUsd) {
        body.dailySpendingUsd = parseFloat(dailySpendingUsd);
      }

      const response = await axios.post(`${API_BASE}/api/trading/wallet/settings`, body);
      const wallet = response.data.wallet || {};

      console.log(`\n✅ Wallet settings updated for ${walletAddress}:`);
      console.log(`   Spending Limit USD: $${wallet.spending_limit_usd ?? body.spendingLimitUsd}`);
      console.log(`   Daily Spending USD: $${wallet.daily_spending_usd ?? body.dailySpendingUsd ?? 'N/A'}`);
    } catch (error) {
      console.log('❌ Failed to update wallet settings:', error.response?.data?.error || error.message);
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

  /**
   * Format PnL value with sign and color
   * @param {number} pnl - The PnL value
   * @returns {string} Formatted PnL string
   */
  formatPnL(pnl) {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${Math.abs(pnl).toFixed(2)}`;
  }

  /**
   * Format percentage with sign
   * @param {number} percent - The percentage value
   * @returns {string} Formatted percentage string
   */
  formatPercentage(percent) {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  }

  handleExit() {
    console.log(`\n${MESSAGES.EXITING}`);
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
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log('Usage: node katana-terminal.js [--demo] [--help]');
    console.log('  --demo      Start in demo mode without backend authentication');
    console.log('  --help, -h  Show this help message');
    process.exit(0);
  }

  const terminal = new KatanaTerminal({ demo: demoMode });
  terminal.start().catch(console.error);
}

module.exports = KatanaTerminal;