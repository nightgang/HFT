const fs = require('fs');
const path = require('path');
const { Keypair, PublicKey } = require('@solana/web3.js');
const logger = require('../../utils/logger');
const { tradeBuyRequestSchema, tradeSellRequestSchema } = require('../../utils/validator');
const multiExchangeService = require('../multi-exchange.service');
const heliusService = require('../../integrations/helius.service');
const jupiterService = require('../../integrations/jupiter.service');
const smartMoneyEngine = require('./smartmoney.engine');
const eventBus = require('../../services/event-bus.service');
const { encrypt, decrypt } = require('../../middleware/auth');
const mevService = require('../mev/mev.service');
const riskService = require('../risk/risk.service');
const autoTradeService = require('../auto-trade.service');
const TradeModel = require('../../models/trade.model');
const WalletModel = require('../../models/wallet.model');
const solanaWalletService = require('../solana-wallet.service');

class TradingEngine {
  constructor() {
    this.activeWallet = null;
    this.tradeHistory = []; // Store trade history
  }

  // Wallet management using Solana Wallet Service
  async setActiveWallet(walletAddress) {
    try {
      const wallet = await solanaWalletService.getWalletInfo(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      this.activeWallet = {
        address: wallet.address,
        name: wallet.name,
        wallet_id: wallet.wallet_id
      };
      logger.info(`Active wallet set to: ${walletAddress}`);
      return this.activeWallet;
    } catch (error) {
      logger.error('Failed to set active wallet:', error);
      throw error;
    }
  }

  getActiveWallet() {
    return this.activeWallet;
  }

  // Return recent trade history (safe fallback)
  getTradeHistory(limit = 50) {
    try {
      const l = parseInt(limit, 10) || 50;
      if (!Array.isArray(this.tradeHistory)) return [];
      return this.tradeHistory.slice(-l).reverse();
    } catch (error) {
      logger.error('getTradeHistory error:', error);
      return [];
    }
  }

  async getWallets() {
    try {
      return await solanaWalletService.listWallets();
    } catch (error) {
      logger.error('Failed to get wallets:', error);
      throw error;
    }
  }

  async getWallet(walletAddress) {
    try {
      return await solanaWalletService.getWalletInfo(walletAddress);
    } catch (error) {
      logger.error('Failed to get wallet:', error);
      throw error;
    }
  }

  async getPortfolioSummary(walletAddress) {
    try {
      const wallet = await solanaWalletService.getWalletInfo(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get recent trades from database
      const recentTrades = await TradeModel.getRecentTrades(wallet.wallet_id, 20);

      // Get balance
      const balance = await solanaWalletService.getBalance(walletAddress);

      return {
        wallet: {
          name: wallet.name,
          address: wallet.address,
          wallet_id: wallet.wallet_id
        },
        solBalance: balance.balance,
        lamports: balance.lamports,
        tradeStats: {
          totalTrades: recentTrades.length,
          // Additional stats can be calculated from trades
        },
        recentTrades: recentTrades.map(trade => ({
          id: trade.trade_id,
          timestamp: trade.executed_at,
          type: trade.direction,
          tokenMint: trade.output_token_mint,
          amount: trade.input_amount,
          price: trade.actual_price,
          status: trade.status
        }))
      };
    } catch (error) {
      logger.error('Failed to get portfolio summary:', error);
      throw error;
    }
  }

  async executeBuy(tradeRequest) {
    try {
      // Check if auto-trade is enabled
      if (!autoTradeService.canExecuteTrade()) {
        logger.warn(`🛑 AUTO TRADE OFF - Buy trade skipped: ${tradeRequest.tokenMint}`);
        return {
          success: false,
          error: 'AUTO TRADE OFF - Trade skipped',
          status: 'skipped',
          reason: 'AUTO_TRADE_DISABLED'
        };
      }

      const validated = tradeBuyRequestSchema.parse(tradeRequest);
      const buyAmount = validated.amount || parseFloat(process.env.DEFAULT_BUY_AMOUNT_SOL || '0.1');

      if (!this.activeWallet) {
        throw new Error('No active wallet set');
      }

      // Get wallet from database
      const walletRecord = await WalletModel.getByAddress(this.activeWallet.address);
      if (!walletRecord) {
        throw new Error('Wallet not found in database');
      }

      // Check if wallet is external (read-only)
      if (walletRecord.is_external) {
        throw new Error('Cannot execute trades with external wallets - use manual signing');
      }

      // Get keypair for signing
      const keypair = await solanaWalletService.getKeypair(this.activeWallet.address);
      if (!keypair) {
        throw new Error('Failed to retrieve wallet keypair');
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

      // Get best quote across all exchanges
      const quoteResult = await multiExchangeService.getBestQuote({
        inputMint: wsolMint,
        outputMint: validated.tokenMint,
        amount: amountLamports,
        slippageBps: validated.slippageBps || parseInt(process.env.MAX_SLIPPAGE_BPS)
      });

      const quote = {
        inAmount: quoteResult.inAmount,
        outAmount: quoteResult.outAmount,
        priceImpactPct: quoteResult.priceImpactPct,
        route: quoteResult.route,
        swapTransaction: quoteResult.swapTransaction,
        exchange: quoteResult.exchange,
        exchangeName: quoteResult.exchangeName
      };

      logger.info(`Best quote from ${quoteResult.exchangeName}: ${quoteResult.outAmount} tokens`);

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

      // Execute trade with best exchange
      const result = await multiExchangeService.executeBestSwap(
        quote,
        {
          publicKey: keypair.publicKey,
          keypair: keypair
        }
      );

      logger.info(`Buy executed successfully on ${quote.exchangeName}: ${result.txId}`);

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

      // Publish trade execution event using the shared EventBus
      {
        const payload = {
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
              address: this.activeWallet.address,
            },
          },
        };
        await eventBus.publishEvent('trade.executed', payload, payload);
      }

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
          const walletRecord = await WalletModel.getByAddress(this.activeWallet.address);
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
      // Check if auto-trade is enabled
      if (!autoTradeService.canExecuteTrade()) {
        logger.warn(`🛑 AUTO TRADE OFF - Sell trade skipped: ${tradeRequest.tokenMint}`);
        return {
          success: false,
          error: 'AUTO TRADE OFF - Trade skipped',
          status: 'skipped',
          reason: 'AUTO_TRADE_DISABLED'
        };
      }

      const validated = tradeSellRequestSchema.parse(tradeRequest);

      if (!this.activeWallet) {
        throw new Error('No active wallet set');
      }

      // Get wallet from database
      const walletRecord = await WalletModel.getByAddress(this.activeWallet.address);
      if (!walletRecord) {
        throw new Error('Wallet not found in database');
      }

      // Check if wallet is external (read-only)
      if (walletRecord.is_external) {
        throw new Error('Cannot execute trades with external wallets - use manual signing');
      }

      // Get keypair for signing
      const keypair = await solanaWalletService.getKeypair(this.activeWallet.address);
      if (!keypair) {
        throw new Error('Failed to retrieve wallet keypair');
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

      // Get best quote across all exchanges
      const quoteResult = await multiExchangeService.getBestQuote({
        inputMint: validated.tokenMint,
        outputMint: wsolMint,
        amount: amountTokens,
        slippageBps: validated.slippageBps || parseInt(process.env.MAX_SLIPPAGE_BPS)
      });

      const quote = {
        inAmount: quoteResult.inAmount,
        outAmount: quoteResult.outAmount,
        priceImpactPct: quoteResult.priceImpactPct,
        route: quoteResult.route,
        swapTransaction: quoteResult.swapTransaction,
        exchange: quoteResult.exchange,
        exchangeName: quoteResult.exchangeName
      };

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

      // Execute trade with best exchange
      const result = await multiExchangeService.executeBestSwap(
        quote,
        {
          publicKey: keypair.publicKey,
          keypair: keypair
        }
      );

      logger.info(`Sell executed successfully on ${quote.exchangeName}: ${result.txId}`);

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

      // Publish trade execution event using the shared EventBus
      {
        const payload = {
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
              address: this.activeWallet.address,
            },
          },
        };
        await eventBus.publishEvent('trade.executed', payload, payload);
      }

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
          const walletRecord = await WalletModel.getByAddress(this.activeWallet.address);
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

    const response = await jupiterService.getUnsignedSwapTransaction(quote, this.activeWallet.address);
    return response.swapTransaction;
  }
}

module.exports = new TradingEngine();