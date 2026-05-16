#!/usr/bin/env node

const readline = require('readline');
const WebSocket = require('ws');
const axios = require('axios');

// ============ CONFIGURATION FROM ENVIRONMENT ============
// Use environment variables with fallbacks for development
const API_BASE = process.env.API_BASE || process.env.BACKEND_URL || 'http://localhost:3001';
const HFT_WS_URL = process.env.HFT_WS_URL || process.env.KATANA_WS_URL || process.env.WS_URL || 'ws://localhost:3002';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '5000', 10); // 5 seconds default
const MAX_LOGIN_RETRIES = parseInt(process.env.MAX_LOGIN_RETRIES || '3', 10);
const WS_CONNECTION_TIMEOUT = parseInt(process.env.WS_CONNECTION_TIMEOUT || '5000', 10);

// Validate configuration
if (!API_BASE || !HFT_WS_URL) {
  console.error('❌ Error: API_BASE or HFT_WS_URL not configured');
  console.error('Please set environment variables:');
  console.error('  - API_BASE or BACKEND_URL');
  console.error('  - HFT_WS_URL or WS_URL (legacy KATANA_WS_URL supported)');
  process.exit(1);
}

const AVAILABLE_COMMANDS = [
  'start', 'stop', 'status', 'buy', 'sell', 'select', 'wallets', 'usewallet',
  'predict', 'positions', 'tokens', 'history', 'trades', 'orders', 'cancel-order',
  'risk-heatmap', 'risk-correlation', 'alerts', 'ack-alert', 'sentiment', 'pnl',
  'portfolio', 'settings', 'help', 'exit', 'toggle', 'autotrade'
];

// ============ EMOJIS AND MESSAGES ============
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

const STYLES = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  purple: '\x1b[35m',
  purpleBright: '\x1b[95m',
  cyan: '\x1b[36m',
  cyanBright: '\x1b[96m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

function colorText(text, color) {
  return `${color}${text}${STYLES.reset}`;
}

function styleText(text, ...styles) {
  return `${styles.join('')}${text}${STYLES.reset}`;
}

function panelLine(label, value) {
  return `${styleText(label.padEnd(18), STYLES.purple)} ${styleText(':', STYLES.gray)} ${styleText(value, STYLES.white)}`;
}

function renderPanel(title, rows) {
  const width = 72;
  const top = `${STYLES.purple}╭${'─'.repeat(width)}╮${STYLES.reset}`;
  const titleLine = `${STYLES.purple}│${STYLES.reset} ${styleText(title, STYLES.bold, STYLES.cyan)}${' '.repeat(Math.max(0, width - title.length - 1))}${STYLES.purple}│${STYLES.reset}`;
  const separator = `${STYLES.purple}├${'─'.repeat(width)}┤${STYLES.reset}`;
  const content = rows.map((line) => `${STYLES.purple}│${STYLES.reset} ${line.padEnd(width - 1)} ${STYLES.purple}│${STYLES.reset}`);
  const bottom = `${STYLES.purple}╰${'─'.repeat(width)}╯${STYLES.reset}`;
  return [top, titleLine, separator, ...content, bottom].join('\n');
}

// Messages
const MESSAGES = {
  AUTH_SUCCESS: '✅ Authentication successful',
  AUTH_FAILED: '❌ Authentication failed',
  CONNECTION_FAILED: '❌ Cannot connect to backend server. Is it running?',
  DEMO_MODE: '🎭 DEMO MODE - No backend required',
  SYSTEM_STARTED: '✅ HFT System Mode started',
  SYSTEM_STOPPED: '🛑 HFT System Mode stopped',
  TRADE_SUBMITTED: '✅ Trade order submitted',
  NO_TOKEN_SELECTED: '❌ No token selected. Use "select <mint>" first.',
  INVALID_AMOUNT: '❌ Invalid amount. Usage: buy/sell <amount>',
  UNKNOWN_COMMAND: '❌ Unknown command. Type "help" for available commands.',
  EXITING: '⚔️ Exiting HFT SYSTEM TERMINAL...'
};

// ============ API HELPER FUNCTIONS ============
/**
 * Make API call with timeout and error handling
 */
async function makeApiCall(method, endpoint, data = null, timeout = REQUEST_TIMEOUT) {
  try {
    const config = {
      timeout,
      headers: { 'Content-Type': 'application/json' }
    };

    let response;
    if (method === 'GET') {
      response = await axios.get(`${API_BASE}${endpoint}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${API_BASE}${endpoint}`, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(`${API_BASE}${endpoint}`, data, config);
    } else {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timeout (${timeout}ms). Backend server may be unresponsive.`);
    }
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to backend at ${API_BASE}. Is it running?`);
    }
    if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }
    if (error.response?.status === 403) {
      throw new Error('Access denied.');
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

/**
 * HFT System Terminal CLI for HFT Solana Trading System
 */
class HFTSystemTerminal {
  constructor(options = {}) {
    this.demoMode = options.demo || false;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.makePrompt(),
      historySize: 100,
      completer: this.completer.bind(this)
    });
    this.ws = null;
    this.isConnected = false;
    this.authToken = null;
    this.systemActive = false;
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

  makePrompt() {
    return `${styleText(`${EMOJIS.SWORD} HFT`, STYLES.purple, STYLES.bold)} ${styleText('>', STYLES.cyan)} `;
  }

  question(promptText) {
    return new Promise((resolve) => {
      this.rl.question(promptText, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Start the HFT SYSTEM TERMINAL
   */
  async start() {
    console.clear();
    console.log(renderPanel('HFT SYSTEM TERMINAL', [
      styleText('Dark terminal UI aligned to frontend trading dashboard', STYLES.gray),
      '',
      panelLine('Environment', this.demoMode ? 'DEMO MODE' : 'CLI'),
      panelLine('Backend', API_BASE),
      panelLine('Realtime WS', HFT_WS_URL)
    ]) + '\n');

    if (!this.demoMode && !process.stdin.isTTY) {
      console.log(styleText('⚠️  No interactive terminal detected. Starting in demo mode.', STYLES.yellow));
      this.demoMode = true;
    }

    if (this.demoMode) {
      console.log(styleText(MESSAGES.DEMO_MODE, STYLES.cyan));
      console.log('');
      this.authToken = 'demo-token';
      this.isConnected = true;
      this.showWelcome();
      this.rl.prompt();
      this.rl.on('line', (line) => this.handleCommand(line.trim()));
      this.rl.on('SIGINT', () => this.handleExit());
      return;
    }

    console.log(styleText('Ultra-fast Solana trading system', STYLES.gray));
    console.log('');

    // Login first
    await this.login();

    // Connect to HFT WebSocket
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

        const result = await makeApiCall('POST', '/auth/login', {
          username,
          password
        });

        if (result.success) {
          this.authToken = result.token;
          console.log(MESSAGES.AUTH_SUCCESS);
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
          return;
        } else {
          console.log(`${MESSAGES.AUTH_FAILED}:`, result.error || 'Invalid credentials');
          retryCount++;
          if (retryCount < MAX_LOGIN_RETRIES) {
            console.log(`Retrying... (${retryCount}/${MAX_LOGIN_RETRIES})`);
          }
        }
      } catch (error) {
        console.log('❌ Login error:', error.message);
        if (error.message.includes('Cannot connect') || error.message.includes('timeout')) {
          console.log('💡 Try running in demo mode: node hft-terminal.js --demo');
          process.exit(1);
        }
        retryCount++;
        if (retryCount < MAX_LOGIN_RETRIES) {
          console.log(`Retrying... (${retryCount}/${MAX_LOGIN_RETRIES})`);
        }
      }
    }

    console.log('❌ Login failed after maximum retries');
    process.exit(1);
  }

  /**
   * Establish WebSocket connection to HFT system engine
   */
  async connectWebSocket() {
    if (this.demoMode) return;

    try {
      console.log('🔌 Connecting to HFT system engine...');
      this.ws = new WebSocket(`${HFT_WS_URL}?token=${this.authToken}`);

      this.ws.on('open', () => {
        console.log('🔌 Connected to HFT system engine');
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
        console.log('🔌 Disconnected from HFT system engine');
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
      console.error('Failed to connect to HFT WebSocket:', error.message);
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
    process.title = `HFT SYSTEM TERMINAL | PnL: ${pnl} (${percent}) | Trades: ${this.pnlData.activeTrades}`;
  }

  /**
   * Display welcome message and available commands
   */
  showWelcome() {
    const walletDisplay = this.selectedWallet || 'None';
    const tokenDisplay = this.selectedToken || 'None';
    const demoDisplay = this.demoMode ? ` ${styleText('(DEMO MODE)', STYLES.cyan)}` : '';

    console.log('\n' + renderPanel('HFT SYSTEM SUITE', [
      styleText('Fast analytics and smart trading tools in one dashboard.', STYLES.gray),
      '',
      panelLine('Mode', 'HFT SYSTEM'),
      panelLine('Status', this.systemActive ? styleText('RUNNING', STYLES.cyan) : styleText('STOPPED', STYLES.red)),
      panelLine('Token', tokenDisplay),
      panelLine('Wallet', walletDisplay),
      panelLine('Auto Trade', this.autoTradeEnabled ? styleText('ENABLED', STYLES.green) : styleText('DISABLED', STYLES.red))
    ]) + demoDisplay);

    console.log('\n' + renderPanel('COMMAND CENTER', [
      `${styleText('start', STYLES.cyan)} ${styleText('- Start HFT System Mode', STYLES.gray)}`,
      `${styleText('stop', STYLES.cyan)}  ${styleText('- Stop HFT System Mode', STYLES.gray)}`,
      `${styleText('status', STYLES.cyan)} ${styleText('- Show current status', STYLES.gray)}`,
      `${styleText('buy <amount>', STYLES.cyan)} ${styleText('- Buy selected token', STYLES.gray)}`,
      `${styleText('sell <amount>', STYLES.cyan)} ${styleText('- Sell selected token', STYLES.gray)}`,
      `${styleText('select <mint>', STYLES.cyan)} ${styleText('- Select token for trading', STYLES.gray)}`,
      `${styleText('wallets', STYLES.cyan)} ${styleText('- List configured wallets', STYLES.gray)}`,
      `${styleText('usewallet <pk>', STYLES.cyan)} ${styleText('- Select wallet for trades', STYLES.gray)}`,
      `${styleText('predict <mint>', STYLES.cyan)} ${styleText('- Request AI signal for token', STYLES.gray)}`,
      `${styleText('positions', STYLES.cyan)} ${styleText('- Show active positions', STYLES.gray)}`,
      `${styleText('tokens', STYLES.cyan)} ${styleText('- Show recent token detections', STYLES.gray)}`,
      `${styleText('history / trades', STYLES.cyan)} ${styleText('- Show trade history', STYLES.gray)}`,
      `${styleText('orders', STYLES.cyan)} ${styleText('- Show advanced orders', STYLES.gray)}`,
      `${styleText('cancel-order <id>', STYLES.cyan)} ${styleText('- Cancel an advanced order', STYLES.gray)}`,
      `${styleText('risk-heatmap', STYLES.cyan)} ${styleText('- Show portfolio risk heatmap', STYLES.gray)}`,
      `${styleText('alerts', STYLES.cyan)} ${styleText('- Show active predictive alerts', STYLES.gray)}`,
      `${styleText('pnl', STYLES.cyan)} ${styleText('- Show P&L dashboard summary', STYLES.gray)}`,
      `${styleText('portfolio', STYLES.cyan)} ${styleText('- Show portfolio summary', STYLES.gray)}`,
      `${styleText('settings', STYLES.cyan)} ${styleText('- Show or update wallet limits', STYLES.gray)}`,
      `${styleText('help', STYLES.cyan)} ${styleText('- Show this help', STYLES.gray)}`
    ]));

    console.log('\n' + styleText('Keyboard shortcuts:', STYLES.bold, STYLES.white));
    console.log(`  ${styleText('T', STYLES.cyan)}  - ${styleText('Toggle AUTO TRADE ON/OFF', STYLES.gray)}`);
    console.log(`  ${styleText('H', STYLES.cyan)}  - ${styleText('Show help', STYLES.gray)}`);
    console.log(`  ${styleText('Q', STYLES.cyan)}  - ${styleText('Quick exit', STYLES.gray)}\n`);
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
          await this.startSystem();
          break;
        case 'stop':
          await this.stopSystem();
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

  async startSystem() {
    if (this.demoMode) {
      this.systemActive = true;
      console.log(`${MESSAGES.SYSTEM_STARTED} (DEMO)`);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/hft/start`);
      if (response.data.success) {
        console.log(MESSAGES.SYSTEM_STARTED);
        this.systemActive = true;
      }
    } catch (error) {
      console.log('❌ Failed to start HFT System Mode:', error.response?.data?.error || error.message);
    }
  }

  async stopSystem() {
    if (this.demoMode) {
      this.systemActive = false;
      console.log(`${MESSAGES.SYSTEM_STOPPED} (DEMO)`);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/api/hft/stop`);
      if (response.data.success) {
        console.log(MESSAGES.SYSTEM_STOPPED);
        this.systemActive = false;
      }
    } catch (error) {
      console.log('❌ Failed to stop HFT System Mode:', error.response?.data?.error || error.message);
    }
  }

  async showStatus() {
    const statusLines = [];

    if (this.demoMode) {
      statusLines.push(panelLine('Active', this.systemActive ? styleText('YES', STYLES.green) : styleText('NO', STYLES.red)));
      statusLines.push(panelLine('Active Trades', String(Math.floor(Math.random() * 5))));
      statusLines.push(panelLine('Watched Tokens', String(Math.floor(Math.random() * 20))));
      statusLines.push(panelLine('Total PnL', this.formatPnL(this.pnlData.totalPnL)));
      statusLines.push(panelLine('P&L %', `${this.formatPercentage(this.pnlData.pnlPercentage)}%`));
      console.log('\n' + renderPanel('HFT SYSTEM STATUS (DEMO)', statusLines));
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/hft/status`);
      const status = response.data.data;

      statusLines.push(panelLine('Active', status.isActive ? styleText('YES', STYLES.green) : styleText('NO', STYLES.red)));
      statusLines.push(panelLine('Active Trades', String(status.activeTrades)));
      statusLines.push(panelLine('Watched Tokens', String(status.watchedTokens)));
      statusLines.push(panelLine('Total PnL', this.formatPnL(this.pnlData.totalPnL)));
      statusLines.push(panelLine('P&L %', `${this.formatPercentage(this.pnlData.pnlPercentage)}%`));

      console.log('\n' + renderPanel('HFT SYSTEM STATUS', statusLines));
    } catch (error) {
      console.log(styleText('❌ Failed to get status:', STYLES.red), error.response?.data?.error || error.message);
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
      const response = await axios.post(`${API_BASE}/api/hft/trade`, {
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
      const response = await axios.get(`${API_BASE}/api/hft/positions`);
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
      const response = await axios.get(`${API_BASE}/api/hft/detections`);
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
    console.log('Usage: node hft-terminal.js [--demo] [--help]');
    console.log('  --demo      Start in demo mode without backend authentication');
    console.log('  --help, -h  Show this help message');
    process.exit(0);
  }

  const terminal = new HFTSystemTerminal({ demo: demoMode });
  terminal.start().catch(console.error);
}

module.exports = HFTSystemTerminal;