const logger = require('../../utils/logger');
const { tokenDetectionSchema } = require('../../utils/validator');
const riskEngine = require('./risk.engine');
const tradingEngine = require('./trading.engine');
const predictionEngine = require('./prediction.engine');
const websocketServer = require('../../ws/websocket.server');

class SniperEngine {
  constructor() {
    this.isActive = false;
    this.autoTradeEnabled = process.env.AUTO_TRADE_ENABLED === 'true';
  }

  start() {
    this.isActive = true;
    logger.info('Sniper engine started');
  }

  stop() {
    this.isActive = false;
    logger.info('Sniper engine stopped');
  }

  enableAutoTrade() {
    this.autoTradeEnabled = true;
    logger.info('Auto trade enabled');
  }

  disableAutoTrade() {
    this.autoTradeEnabled = false;
    logger.info('Auto trade disabled');
  }

  async processTokenDetection(tokenData) {
    try {
      // Step 1: Normalize token data
      const normalizedData = this.normalizeTokenData(tokenData);

      // Step 2: Run validation schema (zod)
      const validatedData = tokenDetectionSchema.parse(normalizedData);
      logger.info(`Processing token detection: ${validatedData.mint}`);

      // Broadcast token detected event
      websocketServer.broadcast({
        type: 'TOKEN_DETECTED',
        data: validatedData,
        timestamp: Date.now(),
      });

      // Step 3: Pass through Risk Engine
      const riskResult = await riskEngine.evaluateTokenRisk(validatedData.mint);

      if (riskResult === 'SAFE') {
        // Step 4: Check AUTO_TRADE_ENABLED
        if (this.autoTradeEnabled && this.isActive) {
          // Execute Jupiter buy
          const tradeResult = await tradingEngine.executeBuy({
            tokenMint: validatedData.mint,
            amount: parseFloat(process.env.DEFAULT_BUY_AMOUNT_SOL),
            slippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS),
          });

          if (tradeResult.success) {
            // Log trade result
            const tradeRecord = tradingEngine.recordTrade({
              type: 'buy',
              walletPublicKey: tradingEngine.getActiveWallet()?.publicKey,
              tokenMint: validatedData.mint,
              amount: tradeResult.amount,
              signature: tradeResult.signature,
              status: 'success',
            });

            // Broadcast event via WebSocket
            websocketServer.broadcast({
              type: 'TRADE_EXECUTED',
              data: {
                mint: validatedData.mint,
                signature: tradeResult.signature,
                amount: tradeResult.amount,
                tradeId: tradeRecord.id,
              },
              timestamp: Date.now(),
            });

            logger.info(`Sniper trade executed successfully: ${tradeResult.signature}`);
          } else {
            // Log failed trade
            websocketServer.broadcast({
              type: 'TRADE_FAILED',
              data: {
                mint: validatedData.mint,
                reason: tradeResult.error,
              },
              timestamp: Date.now(),
            });
            logger.error(`Sniper trade failed for ${validatedData.mint}: ${tradeResult.error}`);
          }
        } else {
          // Auto trade disabled - just log approval
          websocketServer.broadcast({
            type: 'RISK_APPROVED',
            data: { mint: validatedData.mint },
            timestamp: Date.now(),
          });
          logger.info(`Token ${validatedData.mint} approved but auto-trade disabled`);
        }
      } else {
        // Step 5: If UNSAFE - Reject + log reason
        websocketServer.broadcast({
          type: 'RISK_REJECTED',
          data: { mint: validatedData.mint, reason: 'Risk evaluation failed' },
          timestamp: Date.now(),
        });
        logger.warn(`Token ${validatedData.mint} rejected by risk engine`);
      }
    } catch (error) {
      logger.error('Token detection processing error:', error);
      websocketServer.broadcast({
        type: 'PROCESSING_ERROR',
        data: { error: error.message },
        timestamp: Date.now(),
      });
    }
  }

  normalizeTokenData(tokenData) {
    // Normalize token data to ensure consistent format
    return {
      mint: tokenData.mint || tokenData.tokenMint || tokenData.address,
      name: tokenData.name || 'Unknown',
      symbol: tokenData.symbol || 'UNK',
      decimals: typeof tokenData.decimals === 'number' ? tokenData.decimals : 6,
      supply: tokenData.supply != null ? tokenData.supply.toString() : '0',
      creator: tokenData.creator || undefined,
      timestamp: tokenData.timestamp || Date.now(),
      source: tokenData.source || 'unknown',
    };
  }

  getStatus() {
    return {
      isActive: this.isActive,
      autoTradeEnabled: this.autoTradeEnabled,
    };
  }
}

module.exports = new SniperEngine();