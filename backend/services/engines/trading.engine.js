const { Keypair, PublicKey } = require('@solana/web3.js');
const logger = require('../../utils/logger');
const { tradeBuyRequestSchema, tradeSellRequestSchema } = require('../../utils/validator');
const jupiterService = require('../../integrations/jupiter.service');
const heliusService = require('../../integrations/helius.service');
const smartMoneyEngine = require('./smartmoney.engine');
const websocketServer = require('../../ws/websocket.server');

class TradingEngine {
  constructor() {
    this.wallets = new Map(); // Store wallets by public key
    this.activeWallet = null;
    this.tradeHistory = []; // Store trade history
  }

  // Wallet management
  createWallet(name, deterministic = false) {
    let keypair;
    if (deterministic) {
      // For testing - deterministic keypair
      keypair = Keypair.fromSeed(new Uint8Array(32).fill(1));
    } else {
      keypair = Keypair.generate();
    }

    const wallet = {
      name,
      publicKey: keypair.publicKey,
      keypair, // In production, this should be encrypted
      created: Date.now(),
    };

    this.wallets.set(keypair.publicKey.toString(), wallet);
    logger.info(`Created wallet: ${keypair.publicKey.toString()}`);
    return wallet;
  }

  connectExternalWallet(publicKey, name = 'external') {
    const wallet = {
      name,
      publicKey: new PublicKey(publicKey),
      external: true,
      connected: Date.now(),
    };

    this.wallets.set(publicKey, wallet);
    logger.info(`Connected external wallet: ${publicKey}`);
    return wallet;
  }

  setActiveWallet(publicKey) {
    const wallet = this.wallets.get(publicKey);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    this.activeWallet = wallet;
    logger.info(`Active wallet set to: ${publicKey}`);
  }

  getWallets() {
    return Array.from(this.wallets.values()).map(w => ({
      name: w.name,
      publicKey: w.publicKey.toString(),
      external: w.external || false,
    }));
  }

  getWallet(publicKey) {
    const wallet = this.wallets.get(publicKey);
    if (!wallet) return null;
    return {
      name: wallet.name,
      publicKey: wallet.publicKey.toString(),
      external: wallet.external || false,
      created: wallet.created,
      connected: wallet.connected || null,
    };
  }

  getActiveWallet() {
    if (!this.activeWallet) {
      return null;
    }

    return {
      name: this.activeWallet.name,
      publicKey: this.activeWallet.publicKey.toString(),
      external: this.activeWallet.external || false,
    };
  }

  // Trade history management
  recordTrade(tradeData) {
    const trade = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...tradeData,
    };
    this.tradeHistory.unshift(trade); // Add to beginning
    // Keep only last 1000 trades
    if (this.tradeHistory.length > 1000) {
      this.tradeHistory = this.tradeHistory.slice(0, 1000);
    }
    logger.info(`Recorded trade: ${trade.id}`);
    return trade;
  }

  getTradeHistory(limit = 50) {
    return this.tradeHistory.slice(0, limit);
  }

  getTradesByWallet(walletPublicKey, limit = 50) {
    return this.tradeHistory
      .filter(trade => trade.walletPublicKey === walletPublicKey)
      .slice(0, limit);
  }

  async getPortfolioSummary(walletPublicKey) {
    const wallet = this.wallets.get(walletPublicKey);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const accountInfo = await heliusService.getAccountInfo(walletPublicKey);
    const solBalance = (accountInfo?.nativeBalance || 0) / 1e9;
    const tokens = Array.isArray(accountInfo?.tokens) ? accountInfo.tokens : [];
    const trades = this.getTradesByWallet(walletPublicKey, 1000);

    const buyTrades = trades.filter(t => t.type === 'buy' && t.status === 'success');
    const sellTrades = trades.filter(t => t.type === 'sell' && t.status === 'success');

    const totalBought = buyTrades.reduce((sum, trade) => sum + (trade.amount || 0), 0);
    const totalSold = sellTrades.reduce((sum, trade) => sum + (trade.amount || 0), 0);
    const profitEstimate = totalSold - totalBought;
    const smartMoneyProfile = await smartMoneyEngine.analyzeWallet(walletPublicKey);

    return {
      wallet: {
        name: wallet.name,
        publicKey: wallet.publicKey.toString(),
        external: wallet.external || false,
      },
      solBalance,
      tokenCount: tokens.length,
      holdings: tokens.map(token => ({
        mint: token.mint,
        amount: token.amount,
        symbol: token.symbol || token.name || 'UNKNOWN',
        decimals: token.decimals,
      })),
      tradeStats: {
        totalTrades: trades.length,
        successfulTrades: trades.filter(t => t.status === 'success').length,
        buyCount: buyTrades.length,
        sellCount: sellTrades.length,
      },
      pnlEstimate: profitEstimate,
      smartMoney: {
        score: smartMoneyProfile.score,
        recommendation: smartMoneyProfile.recommendation,
        signals: smartMoneyProfile.signals,
      },
      recentTrades: trades.slice(0, 20),
    };
  }

  async executeBuy(tradeRequest) {
    try {
      const validated = tradeBuyRequestSchema.parse(tradeRequest);
      const buyAmount = validated.amount || parseFloat(process.env.DEFAULT_BUY_AMOUNT_SOL || '0.1');

      if (!this.activeWallet) {
        throw new Error('No active wallet set');
      }

      if (this.activeWallet.external) {
        throw new Error('Cannot execute trades with external wallets - use manual signing');
      }

      logger.info(`Executing buy: ${buyAmount} SOL for ${validated.tokenMint}`);

      const wsolMint = 'So11111111111111111111111111111111111111112';
      const amountLamports = Math.floor(buyAmount * 1e9); // Convert SOL to lamports

      const quote = await jupiterService.getQuote(
        wsolMint,
        validated.tokenMint,
        amountLamports,
        validated.slippageBps || parseInt(process.env.MAX_SLIPPAGE_BPS)
      );

      const result = await jupiterService.executeSwap(
        quote,
        this.activeWallet.publicKey,
        async (transaction) => {
          transaction.sign(this.activeWallet.keypair);
          return transaction;
        }
      );

      logger.info(`Buy executed successfully: ${result.signature}`);

      // Record trade
      const tradeRecord = this.recordTrade({
        type: 'buy',
        walletPublicKey: this.activeWallet.publicKey.toString(),
        tokenMint: validated.tokenMint,
        amount: buyAmount,
        signature: result.signature,
        status: 'success',
      });

      return {
        success: true,
        signature: result.signature,
        amount: buyAmount,
        tokenMint: validated.tokenMint,
        tradeId: tradeRecord.id,
      };
    } catch (error) {
      logger.error('Buy execution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async executeSell(tradeRequest) {
    try {
      const validated = tradeSellRequestSchema.parse(tradeRequest);

      if (!this.activeWallet) {
        throw new Error('No active wallet set');
      }

      if (this.activeWallet.external) {
        throw new Error('Cannot execute trades with external wallets - use manual signing');
      }

      logger.info(`Executing sell: ${validated.amount} tokens of ${validated.tokenMint}`);

      const wsolMint = 'So11111111111111111111111111111111111111112';
      // Note: amount here is in token units, need to handle decimals properly
      const amountTokens = Math.floor(validated.amount * Math.pow(10, 6)); // Assume 6 decimals

      const quote = await jupiterService.getQuote(
        validated.tokenMint,
        wsolMint,
        amountTokens,
        validated.slippageBps || parseInt(process.env.MAX_SLIPPAGE_BPS)
      );

      const result = await jupiterService.executeSwap(
        quote,
        this.activeWallet.publicKey,
        async (transaction) => {
          transaction.sign(this.activeWallet.keypair);
          return transaction;
        }
      );

      logger.info(`Sell executed successfully: ${result.signature}`);
      const tradeRecord = this.recordTrade({
        type: 'sell',
        walletPublicKey: this.activeWallet.publicKey.toString(),
        tokenMint: validated.tokenMint,
        amount: validated.amount,
        signature: result.signature,
        status: 'success',
      });
      return {
        success: true,
        signature: result.signature,
        amount: validated.amount,
        tokenMint: validated.tokenMint,
        tradeId: tradeRecord.id,
      };
    } catch (error) {
      logger.error('Sell execution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Manual trade execution (for external wallets)
  async getUnsignedTransaction(tradeRequest, isBuy = true) {
    const validated = isBuy
      ? tradeBuyRequestSchema.parse(tradeRequest)
      : tradeSellRequestSchema.parse(tradeRequest);

    const effectiveAmount = isBuy
      ? validated.amount || parseFloat(process.env.DEFAULT_BUY_AMOUNT_SOL || '0.1')
      : validated.amount;

    if (!this.activeWallet) {
      throw new Error('No active wallet set');
    }

    const wsolMint = 'So11111111111111111111111111111111111111112';
    const amount = isBuy
      ? Math.floor(effectiveAmount * 1e9)
      : Math.floor(effectiveAmount * Math.pow(10, 6)); // Assume 6 decimals

    const quote = await jupiterService.getQuote(
      isBuy ? wsolMint : validated.tokenMint,
      isBuy ? validated.tokenMint : wsolMint,
      amount,
      validated.slippageBps || parseInt(process.env.MAX_SLIPPAGE_BPS)
    );

    const response = await jupiterService.getUnsignedSwapTransaction(quote, this.activeWallet.publicKey);
    return response.swapTransaction;
  }
}

module.exports = new TradingEngine();