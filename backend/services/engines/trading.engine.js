const fs = require('fs');
const path = require('path');
const { Keypair, PublicKey } = require('@solana/web3.js');
const logger = require('../../utils/logger');
const { tradeBuyRequestSchema, tradeSellRequestSchema } = require('../../utils/validator');
const jupiterService = require('../../integrations/jupiter.service');
const heliusService = require('../../integrations/helius.service');
const smartMoneyEngine = require('./smartmoney.engine');
const websocketServer = require('../../ws/websocket.server');
const { encrypt, decrypt } = require('../../middleware/auth');
const mevService = require('../mev/mev.service');
const riskService = require('../risk/risk.service');
const TradeModel = require('../../models/trade.model');
const WalletModel = require('../../models/wallet.model');

class TradingEngine {
  constructor() {
    this.wallets = new Map(); // Store wallets by public key
    this.activeWallet = null;
    this.tradeHistory = []; // Store trade history
    this.dataDir = path.resolve(__dirname, '../../data');
    this.storePath = path.join(this.dataDir, 'wallets.json');
    this.loadWalletStore();
  }

  loadWalletStore() {
    try {
      if (!fs.existsSync(this.storePath)) {
        return;
      }
      const raw = fs.readFileSync(this.storePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.wallets)) {
        parsed.wallets.forEach((wallet) => {
          if (wallet.secretKey) {
            try {
              // Decrypt the secret key
              const decryptedKey = decrypt(wallet.secretKey);
              const keypair = Keypair.fromSecretKey(Buffer.from(decryptedKey, 'base64'));
              wallet.keypair = keypair;
              wallet.publicKey = keypair.publicKey;
            } catch (decryptError) {
              logger.error(`Failed to decrypt wallet ${wallet.name}:`, decryptError.message);
              // Skip this wallet if decryption fails
              return;
            }
          } else {
            wallet.publicKey = new PublicKey(wallet.publicKey);
          }
          this.wallets.set(wallet.publicKey.toString(), wallet);
        });
      }
      if (parsed.tradeHistory && Array.isArray(parsed.tradeHistory)) {
        this.tradeHistory = parsed.tradeHistory;
      }
      if (parsed.activeWallet) {
        this.activeWallet = this.wallets.get(parsed.activeWallet) || null;
      }
      logger.info('Loaded wallet store from disk (decrypted)');
    } catch (error) {
      logger.warn('Failed to load wallet store:', error.message);
    }
  }

  saveWalletStore() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const wallets = Array.from(this.wallets.values()).map((wallet) => {
        const payload = {
          name: wallet.name,
          publicKey: wallet.publicKey.toString(),
          external: wallet.external || false,
          created: wallet.created,
          connected: wallet.connected || null,
        };
        if (wallet.keypair && !wallet.external) {
          // Encrypt the secret key before storing
          payload.secretKey = encrypt(Buffer.from(wallet.keypair.secretKey).toString('base64'));
        }
        return payload;
      });
      const payload = {
        wallets,
        activeWallet: this.activeWallet ? this.activeWallet.publicKey.toString() : null,
        tradeHistory: this.tradeHistory,
      };
      fs.writeFileSync(this.storePath, JSON.stringify(payload, null, 2), 'utf-8');
      logger.info('Wallet store persisted to disk (encrypted)');
    } catch (error) {
      logger.error('Failed to save wallet store:', error.message);
    }
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
    this.saveWalletStore();
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
    this.saveWalletStore();
    logger.info(`Connected external wallet: ${publicKey}`);
    return wallet;
  }

  async createMultisigWallet(name, signers = [], threshold = 2, multisigAddress = null, notes = null) {
    if (!Array.isArray(signers) || signers.length < 2) {
      throw new Error('Multisig wallet requires at least 2 signers');
    }
    if (!threshold || threshold > signers.length) {
      throw new Error('Multisig threshold must be a positive number and less than or equal to signer count');
    }

    const walletAddress = multisigAddress || `multisig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const walletRecord = await WalletModel.createMultisigWallet({
      wallet_address: walletAddress,
      wallet_name: name,
      multisig_signers: signers,
      multisig_threshold: threshold,
      multisig_address: multisigAddress,
      notes,
      metadata: { createdBy: 'trading-engine' }
    });

    const wallet = {
      ...walletRecord,
      walletName: walletRecord.wallet_name,
      publicKey: {
        toString: () => walletRecord.wallet_address
      },
      multisig: true,
      signers,
      threshold,
      multisigAddress: walletRecord.multisig_address || multisigAddress,
      created: walletRecord.created_at
    };

    this.wallets.set(walletAddress, wallet);
    this.saveWalletStore();

    logger.info(`Created multisig wallet: ${walletAddress}`);
    return wallet;
  }

  async getMultisigWallets() {
    const wallets = await WalletModel.getMultisigWallets();
    return wallets.map(wallet => ({
      walletId: wallet.wallet_id,
      walletName: wallet.wallet_name,
      walletAddress: wallet.wallet_address,
      multisigSigners: wallet.multisig_signers,
      multisigThreshold: wallet.multisig_threshold,
      multisigAddress: wallet.multisig_address,
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at,
      isActive: wallet.is_active,
      notes: wallet.notes,
    }));
  }

  setActiveWallet(publicKey) {
    const wallet = this.wallets.get(publicKey);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    this.activeWallet = wallet;
    this.saveWalletStore();
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
    this.saveWalletStore();
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

      // Get wallet from database
      const walletRecord = await WalletModel.getByAddress(this.activeWallet.publicKey.toString());
      if (!walletRecord) {
        throw new Error('Wallet not found in database');
      }

      // Risk check before execution
      const riskCheck = await riskService.canExecuteTrade(walletRecord.wallet_id, {
        amountIn: buyAmount,
        tokenIn: { mint: 'So11111111111111111111111111111111111111112' }, // WSOL
        tokenOut: { mint: validated.tokenMint }
      });

      if (!riskCheck.allowed) {
        logger.warn('Trade blocked by risk engine:', riskCheck.violations);
        return {
          success: false,
          error: `Risk violation: ${riskCheck.violations[0].message}`,
          violations: riskCheck.violations
        };
      }

      logger.info(`Executing buy: ${buyAmount} SOL for ${validated.tokenMint}`);

      const wsolMint = 'So11111111111111111111111111111111111111112';
      const amountLamports = Math.floor(buyAmount * 1e9); // Convert SOL to lamports

      // Get quote from Jupiter
      const quote = await jupiterService.getQuote(
        wsolMint,
        validated.tokenMint,
        amountLamports,
        validated.slippageBps || parseInt(process.env.MAX_SLIPPAGE_BPS)
      );

      // MEV protection: Simulate slippage
      const slippageSim = await mevService.simulateSlippage(
        wsolMint,
        validated.tokenMint,
        amountLamports,
        quote.route || {}
      );

      if (!slippageSim.slippageProtection) {
        logger.warn('Trade aborted due to high slippage risk');
        return {
          success: false,
          error: 'High slippage risk detected',
          slippage: slippageSim
        };
      }

      // MEV protection: Check for sandwich attacks
      const sandwichCheck = await mevService.detectSandwichAttack(validated.tokenMint);
      if (sandwichCheck.detected) {
        logger.warn('Trade aborted due to sandwich attack detection');
        return {
          success: false,
          error: 'Sandwich attack detected',
          sandwich: sandwichCheck
        };
      }

      // Execute trade with MEV protection
      const result = await jupiterService.executeSwap(
        quote,
        this.activeWallet.publicKey,
        async (transaction) => {
          transaction.sign(this.activeWallet.keypair);
          return transaction;
        }
      );

      logger.info(`Buy executed successfully: ${result.signature}`);

      // Record trade in database
      const tradeData = {
        wallet_id: walletRecord.wallet_id,
        strategy_type: 'trading',
        direction: 'buy',
        input_token_mint: wsolMint,
        input_token_symbol: 'SOL',
        input_amount: buyAmount,
        output_token_mint: validated.tokenMint,
        expected_output_amount: quote.outAmount,
        actual_output_amount: result.outputAmount || quote.outAmount,
        expected_price: quote.priceImpactPct ? (1 / (1 + quote.priceImpactPct / 100)) : 1,
        actual_price: result.price || quote.priceImpactPct ? (1 / (1 + quote.priceImpactPct / 100)) : 1,
        slippage_percent: quote.priceImpactPct || 0,
        transaction_fee: result.fee || 0,
        priority_fee: result.priorityFee || 0,
        total_cost_usd: buyAmount * 100, // Approximate USD value
        executed_at: new Date(),
        tx_signature: result.signature,
        tx_confirmation_status: 'confirmed',
        pnl_usd: 0, // Will be calculated later
        pnl_percent: 0,
        status: 'completed'
      };

      const tradeRecord = await TradeModel.create(tradeData);

      // Update wallet performance
      await WalletModel.updatePerformance(walletRecord.wallet_id, {
        total_trades: 1,
        successful_trades: 1,
        failed_trades: 0,
        total_pnl: 0,
        roi_percent: 0,
        win_rate_percent: 100,
        last_trade_at: new Date()
      });

      // Broadcast trade update
      websocketServer.broadcast({
        type: 'TRADE_EXECUTED',
        data: {
          trade: {
            id: tradeRecord.trade_id,
            type: 'buy',
            tokenMint: validated.tokenMint,
            amount: buyAmount,
            signature: result.signature,
            status: 'success',
            slippage: slippageSim,
            sandwich: sandwichCheck
          },
          wallet: {
            name: this.activeWallet.name,
            publicKey: this.activeWallet.publicKey.toString(),
          },
        },
      });

      return {
        success: true,
        signature: result.signature,
        amount: buyAmount,
        tokenMint: validated.tokenMint,
        tradeId: tradeRecord.trade_id,
        slippage: slippageSim,
        sandwich: sandwichCheck
      };
    } catch (error) {
      logger.error('Buy execution error:', error);

      // Record failed trade
      if (this.activeWallet) {
        try {
          const walletRecord = await WalletModel.getByAddress(this.activeWallet.publicKey.toString());
          if (walletRecord) {
            await TradeModel.create({
              wallet_id: walletRecord.wallet_id,
              strategy_type: 'trading',
              direction: 'buy',
              input_token_mint: 'So11111111111111111111111111111111111111112',
              input_token_symbol: 'SOL',
              input_amount: tradeRequest.amount || parseFloat(process.env.DEFAULT_BUY_AMOUNT_SOL || '0.1'),
              output_token_mint: tradeRequest.tokenMint,
              status: 'failed',
              error_message: error.message
            });

            // Update wallet performance
            await WalletModel.updatePerformance(walletRecord.wallet_id, {
              total_trades: 1,
              successful_trades: 0,
              failed_trades: 1,
              last_trade_at: new Date()
            });
          }
        } catch (recordError) {
          logger.error('Failed to record failed trade:', recordError);
        }
      }

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

      // Get wallet from database
      const walletRecord = await WalletModel.getByAddress(this.activeWallet.publicKey.toString());
      if (!walletRecord) {
        throw new Error('Wallet not found in database');
      }

      // Risk check before execution
      const riskCheck = await riskService.canExecuteTrade(walletRecord.wallet_id, {
        amountIn: validated.amount,
        tokenIn: { mint: validated.tokenMint },
        tokenOut: { mint: 'So11111111111111111111111111111111111111112' } // WSOL
      });

      if (!riskCheck.allowed) {
        logger.warn('Trade blocked by risk engine:', riskCheck.violations);
        return {
          success: false,
          error: `Risk violation: ${riskCheck.violations[0].message}`,
          violations: riskCheck.violations
        };
      }

      logger.info(`Executing sell: ${validated.amount} tokens of ${validated.tokenMint}`);

      const wsolMint = 'So11111111111111111111111111111111111111112';
      // Note: amount here is in token units, need to handle decimals properly
      const amountTokens = Math.floor(validated.amount * Math.pow(10, 6)); // Assume 6 decimals

      // Get quote from Jupiter
      const quote = await jupiterService.getQuote(
        validated.tokenMint,
        wsolMint,
        amountTokens,
        validated.slippageBps || parseInt(process.env.MAX_SLIPPAGE_BPS)
      );

      // MEV protection: Simulate slippage
      const slippageSim = await mevService.simulateSlippage(
        validated.tokenMint,
        wsolMint,
        amountTokens,
        quote.route || {}
      );

      if (!slippageSim.slippageProtection) {
        logger.warn('Trade aborted due to high slippage risk');
        return {
          success: false,
          error: 'High slippage risk detected',
          slippage: slippageSim
        };
      }

      // MEV protection: Check for sandwich attacks
      const sandwichCheck = await mevService.detectSandwichAttack(validated.tokenMint);
      if (sandwichCheck.detected) {
        logger.warn('Trade aborted due to sandwich attack detection');
        return {
          success: false,
          error: 'Sandwich attack detected',
          sandwich: sandwichCheck
        };
      }

      // Execute trade
      const result = await jupiterService.executeSwap(
        quote,
        this.activeWallet.publicKey,
        async (transaction) => {
          transaction.sign(this.activeWallet.keypair);
          return transaction;
        }
      );

      logger.info(`Sell executed successfully: ${result.signature}`);

      // Record trade in database
      const tradeData = {
        wallet_id: walletRecord.wallet_id,
        strategy_type: 'trading',
        direction: 'sell',
        input_token_mint: validated.tokenMint,
        input_amount: validated.amount,
        output_token_mint: wsolMint,
        output_token_symbol: 'SOL',
        expected_output_amount: quote.outAmount,
        actual_output_amount: result.outputAmount || quote.outAmount,
        expected_price: quote.priceImpactPct ? (1 / (1 + quote.priceImpactPct / 100)) : 1,
        actual_price: result.price || quote.priceImpactPct ? (1 / (1 + quote.priceImpactPct / 100)) : 1,
        slippage_percent: quote.priceImpactPct || 0,
        transaction_fee: result.fee || 0,
        priority_fee: result.priorityFee || 0,
        total_cost_usd: validated.amount * 0.00001, // Approximate USD value
        executed_at: new Date(),
        tx_signature: result.signature,
        tx_confirmation_status: 'confirmed',
        pnl_usd: 0, // Will be calculated later
        pnl_percent: 0,
        status: 'completed'
      };

      const tradeRecord = await TradeModel.create(tradeData);

      // Update wallet performance
      await WalletModel.updatePerformance(walletRecord.wallet_id, {
        total_trades: 1,
        successful_trades: 1,
        failed_trades: 0,
        total_pnl: 0,
        roi_percent: 0,
        win_rate_percent: 100,
        last_trade_at: new Date()
      });

      // Broadcast trade update
      websocketServer.broadcast({
        type: 'TRADE_EXECUTED',
        data: {
          trade: {
            id: tradeRecord.trade_id,
            type: 'sell',
            tokenMint: validated.tokenMint,
            amount: validated.amount,
            signature: result.signature,
            status: 'success',
            slippage: slippageSim,
            sandwich: sandwichCheck
          },
          wallet: {
            name: this.activeWallet.name,
            publicKey: this.activeWallet.publicKey.toString(),
          },
        },
      });

      return {
        success: true,
        signature: result.signature,
        amount: validated.amount,
        tokenMint: validated.tokenMint,
        tradeId: tradeRecord.trade_id,
        slippage: slippageSim,
        sandwich: sandwichCheck
      };
    } catch (error) {
      logger.error('Sell execution error:', error);

      // Record failed trade
      if (this.activeWallet) {
        try {
          const walletRecord = await WalletModel.getByAddress(this.activeWallet.publicKey.toString());
          if (walletRecord) {
            await TradeModel.create({
              wallet_id: walletRecord.wallet_id,
              strategy_type: 'trading',
              direction: 'sell',
              input_token_mint: tradeRequest.tokenMint,
              input_amount: tradeRequest.amount,
              output_token_mint: 'So11111111111111111111111111111111111111112',
              output_token_symbol: 'SOL',
              status: 'failed',
              error_message: error.message
            });

            // Update wallet performance
            await WalletModel.updatePerformance(walletRecord.wallet_id, {
              total_trades: 1,
              successful_trades: 0,
              failed_trades: 1,
              last_trade_at: new Date()
            });
          }
        } catch (recordError) {
          logger.error('Failed to record failed trade:', recordError);
        }
      }

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