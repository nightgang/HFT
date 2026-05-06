const logger = require('../../utils/logger');
const jupiterService = require('../../integrations/jupiter.service');

class ArbitrageEngine {
  constructor() {
    this.dexes = ['raydium', 'orca', 'jupiter', 'meteora']; // Supported DEXes
    this.minProfitThreshold = 0.005; // 0.5% minimum profit threshold
    this.maxSlippageCheck = 0.02; // 2% max slippage for arbitrage
  }

  /**
   * Detect price differences across DEX routes (SIGNALING ONLY)
   * System must NOT assume guaranteed execution profit
   */
  async detectArbitrageOpportunities(tokenMint) {
    try {
      logger.info(`🔍 Checking arbitrage signals for ${tokenMint}`);

      const opportunities = [];

      // Check price differences across routes
      const wsolMint = 'So11111111111111111111111111111111111111112';
      const testAmount = 1000000000; // 1 SOL in lamports

      // Get quotes from different DEXes/routes
      const quotes = await this.getMultiDexQuotes(wsolMint, tokenMint, testAmount);

      if (quotes.length < 2) {
        logger.debug(`Insufficient quotes for ${tokenMint} arbitrage analysis`);
        return { opportunities: [] };
      }

      // Find best buy and sell prices
      const buyQuote = quotes.reduce((best, current) =>
        parseFloat(current.outAmount) > parseFloat(best.outAmount) ? current : best
      );

      const sellQuote = quotes.reduce((best, current) =>
        parseFloat(current.outAmount) < parseFloat(best.outAmount) ? current : best
      );

      // Calculate potential arbitrage spread
      const buyAmount = parseFloat(buyQuote.outAmount);
      const sellAmount = parseFloat(sellQuote.outAmount);
      const spread = (buyAmount - sellAmount) / sellAmount;

      if (spread > this.minProfitThreshold) {
        const signalData = {
          type: 'PRICE_DIFFERENCE',
          tokenMint,
          spread: spread * 100, // Convert to percentage
          buyDex: buyQuote.dex || 'unknown',
          sellDex: sellQuote.dex || 'unknown',
          estimatedProfitPct: spread * 100,
          signal: 'ARBITRAGE_OPPORTUNITY',
          risk: 'HIGH', // Arbitrage can be risky due to execution timing
          note: 'Signal only - no guaranteed execution profit',
          timestamp: Date.now(),
        };
        opportunities.push(signalData);

        // Emit WebSocket signal
        const websocketServer = require('../../ws/websocket.server');
        websocketServer.broadcast({
          type: 'ARBITRAGE_SIGNAL',
          data: signalData
        });

        logger.info(`📊 Arbitrage signal: ${tokenMint} spread ${(spread * 100).toFixed(2)}%`);
      }

      // Check liquidity imbalance opportunities
      const liquiditySignals = await this.checkLiquidityImbalance(tokenMint);
      opportunities.push(...liquiditySignals);

      return { opportunities };
    } catch (error) {
      logger.error(`Arbitrage detection error for ${tokenMint}:`, error);
      return { opportunities: [] };
    }
  }

  async getMultiDexQuotes(inputMint, outputMint, amount) {
    const quotes = [];

    try {
      // Primary: Jupiter (aggregates multiple DEXes)
      const jupiterQuote = await jupiterService.getQuote(inputMint, outputMint, amount);
      if (jupiterQuote) {
        quotes.push({
          ...jupiterQuote,
          dex: 'jupiter',
          route: jupiterQuote.marketInfos?.[0]?.marketMeta?.quoteMint || 'aggregated',
        });
      }

      // In production, add direct DEX API calls here:
      // - Raydium API
      // - Orca API
      // - Meteora API
      // - Other DEX aggregators

      // For now, simulate additional quotes with slight variations
      if (quotes.length > 0) {
        const baseQuote = quotes[0];
        const variations = [-0.002, -0.001, 0.001, 0.002]; // ±0.2% variations

        variations.forEach((variation, index) => {
          const variedAmount = Math.floor(parseFloat(baseQuote.outAmount) * (1 + variation));
          quotes.push({
            ...baseQuote,
            outAmount: variedAmount.toString(),
            dex: ['raydium', 'orca', 'meteora'][index] || 'unknown',
            route: 'simulated',
          });
        });
      }

    } catch (error) {
      logger.error('Multi-DEX quote fetching error:', error);
    }

    return quotes;
  }

  async checkLiquidityImbalance(tokenMint) {
    try {
      const signals = [];

      // Check for liquidity imbalances between DEXes
      // This could indicate manipulation or real opportunities
      const wsolMint = 'So11111111111111111111111111111111111111112';
      const testAmount = 100000000; // 0.1 SOL

      const quotes = await this.getMultiDexQuotes(wsolMint, tokenMint, testAmount);

      if (quotes.length < 2) return signals;

      // Calculate liquidity distribution
      const totalLiquidity = quotes.reduce((sum, quote) => {
        // Estimate liquidity from quote data
        return sum + (parseFloat(quote.outAmount) / parseFloat(quote.inAmount));
      }, 0);

      const avgLiquidity = totalLiquidity / quotes.length;

      // Check for significant imbalances
      quotes.forEach(quote => {
        const liquidityRatio = (parseFloat(quote.outAmount) / parseFloat(quote.inAmount)) / avgLiquidity;

        if (liquidityRatio > 2.0) {
          // Much higher liquidity on this DEX
          signals.push({
            type: 'LIQUIDITY_IMBALANCE',
            tokenMint,
            dex: quote.dex,
            imbalanceRatio: liquidityRatio,
            signal: 'HIGH_LIQUIDITY_OPPORTUNITY',
            risk: 'MEDIUM',
            note: 'Unusual liquidity concentration detected',
            timestamp: Date.now(),
          });

          logger.info(`🏦 Liquidity imbalance signal: ${tokenMint} on ${quote.dex} (${liquidityRatio.toFixed(2)}x average)`);
        } else if (liquidityRatio < 0.3) {
          // Much lower liquidity on this DEX
          signals.push({
            type: 'LIQUIDITY_IMBALANCE',
            tokenMint,
            dex: quote.dex,
            imbalanceRatio: liquidityRatio,
            signal: 'LOW_LIQUIDITY_WARNING',
            risk: 'HIGH',
            note: 'Potential liquidity manipulation or low availability',
            timestamp: Date.now(),
          });

          logger.warn(`⚠️ Low liquidity warning: ${tokenMint} on ${quote.dex} (${liquidityRatio.toFixed(2)}x average)`);
        }
      });

      return signals;
    } catch (error) {
      logger.error('Liquidity imbalance check error:', error);
      return [];
    }
  }

  // Legacy method for backward compatibility
  async detectArbitrageOpportunity(tokenMint) {
    const result = await this.detectArbitrageOpportunities(tokenMint);
    return result;
  }

  // Note: This engine only provides signals, never executes trades
  // Execution would require complex cross-DEX logic and is not guaranteed profitable
  // All signals are for informational purposes only
}

module.exports = new ArbitrageEngine();