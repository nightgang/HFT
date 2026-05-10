#!/usr/bin/env node

const readline = require('readline');
const WebSocket = require('ws');
const axios = require('axios');

const API_BASE = 'http://localhost:3001';
const KATANA_WS_URL = 'ws://localhost:3003';

class KatanaTerminal {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '⚔️ katana> '
    });
    this.ws = null;
    this.isConnected = false;
    this.authToken = null;
    this.katanaActive = false;
    this.currentPositions = [];
    this.pnlData = { totalPnL: 0, pnlPercentage: 0, activeTrades: 0 };
    this.autoTradeEnabled = true; // Initialize auto-trade as enabled
    this.selectedToken = null;
    this.selectedWallet = null;
  }

  async start() {
    console.clear();
    console.log('⚔️  KATANA MODE TERMINAL');
    console.log('========================');
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
    const username = await this.question('Username: ');
    const password = await this.question('Password: ');

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        this.authToken = response.data.token;
        console.log('✅ Authentication successful');
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`;
      } else {
        console.log('❌ Authentication failed');
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data?.error || error.message);
      process.exit(1);
    }
  }

  async connectWebSocket() {
    try {
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
      });

      // Fetch initial auto-trade status
      await this.fetchAutoTradeStatus();

    } catch (error) {
      console.error('Failed to connect to Katana WebSocket:', error);
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
  const terminal = new KatanaTerminal();
  terminal.start().catch(console.error);
}

module.exports = KatanaTerminal;