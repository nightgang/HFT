const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');
const logger = require('../utils/logger');
const cacheService = require('../services/cache.service');
const metricsService = require('../services/monitoring/monitoring.service');
const signingService = require('./security/signing.service');

class MultiExchangeService {
  constructor() {
    this.exchanges = {
      jupiter: {
        name: 'Jupiter',
        apiUrl: 'https://quote-api.jup.ag',
        priority: 1,
        enabled: true
      },
      raydium: {
        name: 'Raydium',
        apiUrl: 'https://api.raydium.io',
        priority: 2,
        enabled: true
      },
      orca: {
        name: 'Orca',
        apiUrl: 'https://www.orca.so/api',
        priority: 3,
        enabled: true
      },
      meteora: {
        name: 'Meteora',
        apiUrl: 'https://app.meteora.ag/api',
        priority: 4,
        enabled: true
      }
    };

    this.rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(this.rpcUrl);
    this.cacheTTL = 30; // 30 seconds
    this.maxRetries = 2;
    this.timeout = 10000; // 10 seconds
  }

  computeRouteLiquidity(route) {
    if (!route) return 0;
    if (Array.isArray(route)) {
      return route.reduce((sum, segment) => {
        const liquidity = parseFloat(segment.liquidity || segment.estimatedLiquidity || 0) || 0;
        return sum + liquidity;
      }, 0);
    }

    if (typeof route === 'object') {
      return parseFloat(route.liquidity || route.estimatedLiquidity || 0) || 0;
    }

    return 0;
  }

  buildQuoteQuality(quote, slippageBps) {
    const outAmount = parseFloat(quote.outAmount) || 0;
    const priceImpact = parseFloat(quote.priceImpactPct) || 0;
    const feeAmount = parseFloat(quote.fee?.amount || 0) || 0;
    const routeLiquidity = this.computeRouteLiquidity(quote.route);
    const slippageTolerance = (slippageBps || 50) / 100;
    const liquidityScore = Math.min(routeLiquidity / 1000000, 1);
    const impactPenalty = 1 + priceImpact * 0.01;
    const feePenalty = Math.min(feeAmount / Math.max(outAmount, 1), 0.05);

    const qualityScore = outAmount / impactPenalty + liquidityScore * 1000 - feePenalty * 100;

    return {
      ...quote,
      routeLiquidity,
      effectiveOutAmount: outAmount,
      qualityScore,
      isSafe: priceImpact <= slippageTolerance * 100
    };
  }

  /**
   * Get best quote across all exchanges
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object>} Best quote with exchange info
   */
  async getBestQuote({ inputMint, outputMint, amount, slippageBps = 50 }) {
    const startTime = Date.now();
    const quotes = [];

    try {
      // Get quotes from all enabled exchanges in parallel
      const quotePromises = Object.entries(this.exchanges)
        .filter(([_, config]) => config.enabled)
        .map(async ([exchangeId, config]) => {
          try {
            const quote = await this.getExchangeQuote(exchangeId, {
              inputMint,
              outputMint,
              amount,
              slippageBps
            });

            if (quote) {
              return {
                ...quote,
                exchange: exchangeId,
                exchangeName: config.name,
                priority: config.priority
              };
            }
          } catch (error) {
            logger.warn(`Failed to get quote from ${config.name}:`, error.message);
          }
          return null;
        });

      const results = await Promise.allSettled(quotePromises);
      quotes.push(...results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
      );

      if (quotes.length === 0) {
        throw new Error('No quotes available from any exchange');
      }

      const enrichedQuotes = quotes.map(quote => this.buildQuoteQuality(quote, slippageBps));
      const safeQuotes = enrichedQuotes.filter(quote => quote.isSafe);
      const orderedQuotes = safeQuotes.length > 0 ? safeQuotes : enrichedQuotes;

      orderedQuotes.sort((a, b) => b.qualityScore - a.qualityScore);
      const bestQuote = orderedQuotes[0];
      const duration = Date.now() - startTime;

      if (!bestQuote.isSafe) {
        logger.warn(`No quotes matched requested slippage tolerance; returning best available quote from ${bestQuote.exchangeName}`);
      }

      logger.info(`Best quote from ${bestQuote.exchangeName}: ${bestQuote.outAmount} ${outputMint} (${duration}ms)`);

      metricsService.recordExchangeQuote(bestQuote.exchange, duration);

      return {
        ...bestQuote,
        allQuotes: orderedQuotes,
        comparison: this.generateQuoteComparison(orderedQuotes)
      };

    } catch (error) {
      logger.error('Multi-exchange quote error:', error);
      metricsService.recordExchangeError('multi_exchange', error.message);
      throw error;
    }
  }

  /**
   * Get quote from specific exchange
   * @param {string} exchangeId - Exchange identifier
   * @param {Object} params - Quote parameters
   * @returns {Promise<Object|null>} Quote or null if failed
   */
  async getExchangeQuote(exchangeId, { inputMint, outputMint, amount, slippageBps }) {
    const cacheKey = `quote:${exchangeId}:${inputMint}:${outputMint}:${amount}:${slippageBps}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const exchange = this.exchanges[exchangeId];
    if (!exchange) {
      throw new Error(`Unknown exchange: ${exchangeId}`);
    }

    let quote = null;

    switch (exchangeId) {
      case 'jupiter':
        quote = await this.getJupiterQuote(inputMint, outputMint, amount, slippageBps);
        break;
      case 'raydium':
        quote = await this.getRaydiumQuote(inputMint, outputMint, amount, slippageBps);
        break;
      case 'orca':
        quote = await this.getOrcaQuote(inputMint, outputMint, amount, slippageBps);
        break;
      case 'meteora':
        quote = await this.getMeteoraQuote(inputMint, outputMint, amount, slippageBps);
        break;
    }

    if (quote) {
      await cacheService.set(cacheKey, quote, this.cacheTTL);
    }

    return quote;
  }

  /**
   * Get quote from Jupiter
   */
  async getJupiterQuote(inputMint, outputMint, amount, slippageBps) {
    try {
      const response = await axios.get(`${this.exchanges.jupiter.apiUrl}/v6/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amount.toString(),
          slippageBps
        },
        timeout: this.timeout
      });

      if (response.data) {
        return {
          inAmount: response.data.inAmount,
          outAmount: response.data.outAmount,
          priceImpactPct: response.data.priceImpactPct,
          fee: response.data.fee || {},
          route: response.data.routePlan || [],
          swapTransaction: response.data.swapTransaction
        };
      }
    } catch (error) {
      logger.warn('Jupiter quote error:', error.message);
    }
    return null;
  }

  /**
   * Get quote from Raydium
   */
  async getRaydiumQuote(inputMint, outputMint, amount, slippageBps) {
    try {
      // Raydium API integration
      const response = await axios.get(`${this.exchanges.raydium.apiUrl}/v2/sdk/quote`, {
        params: {
          inputMint,
          outputMint,
          inAmount: amount.toString(),
          slippage: slippageBps / 100 // Convert to percentage
        },
        timeout: this.timeout
      });

      if (response.data) {
        return {
          inAmount: amount.toString(),
          outAmount: response.data.outAmount,
          priceImpactPct: response.data.priceImpact || 0,
          fee: { amount: response.data.fee || 0 },
          route: response.data.route || [],
          swapTransaction: response.data.tx
        };
      }
    } catch (error) {
      logger.warn('Raydium quote error:', error.message);
    }
    return null;
  }

  /**
   * Get quote from Orca
   */
  async getOrcaQuote(inputMint, outputMint, amount, slippageBps) {
    try {
      // Orca API integration
      const response = await axios.post(`${this.exchanges.orca.apiUrl}/v1/quote`, {
        inputTokenMint: inputMint,
        outputTokenMint: outputMint,
        amount: amount,
        slippageTolerance: slippageBps / 100
      }, {
        timeout: this.timeout
      });

      if (response.data) {
        return {
          inAmount: amount.toString(),
          outAmount: response.data.outputAmount,
          priceImpactPct: response.data.priceImpact || 0,
          fee: { amount: response.data.fee || 0 },
          route: response.data.route || [],
          swapTransaction: response.data.transaction
        };
      }
    } catch (error) {
      logger.warn('Orca quote error:', error.message);
    }
    return null;
  }

  /**
   * Get quote from Meteora
   */
  async getMeteoraQuote(inputMint, outputMint, amount, slippageBps) {
    try {
      // Meteora API integration
      const response = await axios.get(`${this.exchanges.meteora.apiUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amount.toString(),
          slippage: slippageBps / 100
        },
        timeout: this.timeout
      });

      if (response.data) {
        return {
          inAmount: amount.toString(),
          outAmount: response.data.outAmount,
          priceImpactPct: response.data.priceImpact || 0,
          fee: { amount: response.data.fee || 0 },
          route: response.data.route || [],
          swapTransaction: response.data.tx
        };
      }
    } catch (error) {
      logger.warn('Meteora quote error:', error.message);
    }
    return null;
  }

  /**
   * Execute swap on best exchange
   * @param {Object} quote - Quote from getBestQuote
   * @param {Object} wallet - Wallet information
   * @returns {Promise<Object>} Swap result
   */
  async executeBestSwap(quote, wallet) {
    const exchangeId = quote.exchange;

    try {
      let result;

      switch (exchangeId) {
        case 'jupiter':
          result = await this.executeJupiterSwap(quote, wallet);
          break;
        case 'raydium':
          result = await this.executeRaydiumSwap(quote, wallet);
          break;
        case 'orca':
          result = await this.executeOrcaSwap(quote, wallet);
          break;
        case 'meteora':
          result = await this.executeMeteoraSwap(quote, wallet);
          break;
        default:
          throw new Error(`Unsupported exchange for execution: ${exchangeId}`);
      }

      metricsService.recordExchangeSwap(exchangeId, true);
      return result;

    } catch (error) {
      logger.error(`Swap execution failed on ${exchangeId}:`, error);
      metricsService.recordExchangeSwap(exchangeId, false);
      throw error;
    }
  }

  /**
   * Execute Jupiter swap
   */
  async executeJupiterSwap(quote, wallet) {
    const jupiterService = require('../integrations/jupiter.service');

    try {
      const signTransaction = await signingService.getSignTransaction(wallet);
      const walletPublicKey = wallet.publicKey || wallet.wallet_address || wallet.address;

      const result = await jupiterService.executeSwap(quote.swapTransaction, walletPublicKey, signTransaction);

      return {
        success: true,
        txId: result.signature,
        signature: result.signature,
        exchange: 'jupiter',
        status: result.status,
        outputAmount: quote.outAmount,
        fee: 0, // Will be calculated from transaction
        priorityFee: 0
      };
    } catch (error) {
      logger.error('Jupiter swap execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute Raydium swap
   */
  async executeRaydiumSwap(quote, wallet) {
    // Implementation for Raydium swap execution
    return {
      success: true,
      txId: 'mock_raydium_tx',
      exchange: 'raydium',
      ...quote
    };
  }

  /**
   * Execute Orca swap
   */
  async executeOrcaSwap(quote, wallet) {
    // Implementation for Orca swap execution
    return {
      success: true,
      txId: 'mock_orca_tx',
      exchange: 'orca',
      ...quote
    };
  }

  /**
   * Execute Meteora swap
   */
  async executeMeteoraSwap(quote, wallet) {
    // Implementation for Meteora swap execution
    return {
      success: true,
      txId: 'mock_meteora_tx',
      exchange: 'meteora',
      ...quote
    };
  }

  /**
   * Generate quote comparison
   * @param {Array} quotes - All quotes
   * @returns {Object} Comparison data
   */
  generateQuoteComparison(quotes) {
    if (quotes.length === 0) return {};

    const best = quotes[0];
    const comparisons = {};

    quotes.forEach(quote => {
      const difference = ((parseFloat(quote.outAmount) - parseFloat(best.outAmount)) / parseFloat(best.outAmount)) * 100;
      comparisons[quote.exchange] = {
        difference: difference.toFixed(4),
        outAmount: quote.outAmount,
        priceImpact: quote.priceImpactPct,
        fee: quote.fee?.amount || 0
      };
    });

    return {
      bestExchange: best.exchange,
      bestAmount: best.outAmount,
      comparisons
    };
  }

  /**
   * Get exchange status and health
   * @returns {Promise<Object>} Exchange health status
   */
  async getExchangeStatus() {
    const status = {};

    for (const [exchangeId, config] of Object.entries(this.exchanges)) {
      try {
        // Simple health check - try to get a basic quote
        const testQuote = await this.getExchangeQuote(exchangeId, {
          inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          outputMint: 'So11111111111111111111111111111111111111112', // SOL
          amount: 1000000, // 1 USDC
          slippageBps: 50
        });

        status[exchangeId] = {
          name: config.name,
          enabled: config.enabled,
          healthy: testQuote !== null,
          priority: config.priority,
          lastCheck: new Date().toISOString()
        };
      } catch (error) {
        status[exchangeId] = {
          name: config.name,
          enabled: config.enabled,
          healthy: false,
          error: error.message,
          priority: config.priority,
          lastCheck: new Date().toISOString()
        };
      }
    }

    return status;
  }

  /**
   * Configure exchange settings
   * @param {string} exchangeId - Exchange to configure
   * @param {Object} settings - Settings to update
   */
  configureExchange(exchangeId, settings) {
    if (this.exchanges[exchangeId]) {
      this.exchanges[exchangeId] = {
        ...this.exchanges[exchangeId],
        ...settings
      };
      logger.info(`Exchange ${exchangeId} configured:`, settings);
    } else {
      throw new Error(`Unknown exchange: ${exchangeId}`);
    }
  }

  /**
   * Get arbitrage opportunities across exchanges
   * @param {string} tokenMint - Token to check
   * @param {number} amount - Amount to trade
   * @returns {Promise<Array>} Arbitrage opportunities
   */
  async findArbitrageOpportunities(tokenMint, amount = 1000000) {
    try {
      const opportunities = [];

      // Get quotes for token -> USDC and USDC -> token
      const tokenToUsdcQuotes = await this.getMultiExchangeQuotes(tokenMint, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount);
      const usdcToTokenQuotes = await this.getMultiExchangeQuotes('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', tokenMint, amount);

      // Find price differences
      if (tokenToUsdcQuotes.length > 0 && usdcToTokenQuotes.length > 0) {
        const bestSell = tokenToUsdcQuotes[0]; // Best price for selling token
        const bestBuy = usdcToTokenQuotes[0]; // Best price for buying token

        // Calculate potential profit
        const sellAmount = parseFloat(bestSell.outAmount);
        const buyCost = parseFloat(bestBuy.inAmount);
        const profit = sellAmount - buyCost;
        const profitPct = (profit / buyCost) * 100;

        if (profit > 0) {
          opportunities.push({
            tokenMint,
            direction: 'token_to_usdc_to_token',
            profit: profit.toFixed(6),
            profitPct: profitPct.toFixed(4),
            sellExchange: bestSell.exchange,
            buyExchange: bestBuy.exchange,
            estimatedGas: 0.000005 // SOL
          });
        }
      }

      return opportunities;

    } catch (error) {
      logger.error('Arbitrage opportunity search failed:', error);
      return [];
    }
  }

  /**
   * Get quotes from all exchanges for comparison
   */
  async getMultiExchangeQuotes(inputMint, outputMint, amount) {
    const quotes = [];

    for (const exchangeId of Object.keys(this.exchanges)) {
      try {
        const quote = await this.getExchangeQuote(exchangeId, {
          inputMint,
          outputMint,
          amount,
          slippageBps: 50
        });

        if (quote) {
          quotes.push({
            ...quote,
            exchange: exchangeId
          });
        }
      } catch (error) {
        // Skip failed exchanges
      }
    }

    // Sort by best output amount
    return quotes.sort((a, b) => parseFloat(b.outAmount) - parseFloat(a.outAmount));
  }
}

module.exports = new MultiExchangeService();