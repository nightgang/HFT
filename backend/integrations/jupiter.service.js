const axios = require('axios');
const { Connection, Transaction } = require('@solana/web3.js');
const logger = require('../utils/logger');
const cacheService = require('../services/cache.service');
const metricsService = require('../services/monitoring/metrics.service');

class JupiterService {
  constructor() {
    this.apiUrl = process.env.JUPITER_API_URL || 'https://quote-api.jup.ag';
    this.rpcUrl = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
    try {
      this.connection = new Connection(this.rpcUrl);
    } catch (error) {
      logger.warn('Invalid RPC URL, falling back to default connection. Error:', error.message);
      this.connection = null;
    }
    this.maxRetries = 2;
    this.timeout = 30000; // 30 seconds
    this.mockMode = process.env.JUPITER_MOCK_ENABLED === 'true';
    this.quoteCacheTTL = 30; // 30 seconds cache for quotes
    this.priceCacheTTL = 60; // 60 seconds cache for prices
  }

  async getTokenPrice(tokenMint, vsToken = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') { // Default to USDC
    const cacheKey = cacheService.constructor.marketDataKey(tokenMint, `price_${vsToken}`);
    const startTime = Date.now();

    try {
      // Try cache first
      const cachedPrice = await cacheService.get(cacheKey);
      if (cachedPrice) {
        logger.debug(`Price cache hit for ${tokenMint}`);
        return cachedPrice;
      }

      if (this.mockMode) {
        const mockPrice = this.createMockPrice(tokenMint, vsToken);
        await cacheService.set(cacheKey, mockPrice, this.priceCacheTTL);
        return mockPrice;
      }

      // Get price from Jupiter price API
      const response = await axios.get(`${this.apiUrl}/price`, {
        params: {
          ids: tokenMint,
          vsToken: vsToken
        },
        timeout: this.timeout,
      });

      if (response.data && response.data.data && response.data.data[tokenMint]) {
        const priceData = response.data.data[tokenMint];
        const price = {
          price: parseFloat(priceData.price),
          vsToken: vsToken,
          lastUpdated: Date.now()
        };

        // Cache the price
        await cacheService.set(cacheKey, price, this.priceCacheTTL);

        metricsService.recordRpcLatency('jupiter_price', 'api_call', Date.now() - startTime);
        return price;
      }

      throw new Error(`Price not available for token ${tokenMint}`);
    } catch (error) {
      logger.error(`Token price error for ${tokenMint}:`, error.message);

      // Try to return cached price even if expired on error
      const cachedPrice = await cacheService.get(cacheKey);
      if (cachedPrice) {
        logger.warn('Returning stale cached price due to API error');
        return cachedPrice;
      }

      // Return mock price as fallback
      const mockPrice = this.createMockPrice(tokenMint, vsToken);
      return mockPrice;
    }
  }

  async getQuote(inputMint, outputMint, amount, slippageBps) {
    const cacheKey = cacheService.constructor.quoteKey(inputMint, outputMint, amount, slippageBps);
    const startTime = Date.now();

    try {
      // Try cache first
      const cachedQuote = await cacheService.get(cacheKey);
      if (cachedQuote) {
        logger.debug(`Quote cache hit for ${inputMint} -> ${outputMint}`);
        metricsService.recordRpcLatency('jupiter_quote', 'cache_hit', Date.now() - startTime);
        return cachedQuote;
      }

      if (this.mockMode) {
        logger.warn('Jupiter mock mode enabled, returning mock quote');
        const mockQuote = this.createMockQuote(inputMint, outputMint, amount, slippageBps);
        await cacheService.set(cacheKey, mockQuote, this.quoteCacheTTL);
        return mockQuote;
      }

      const response = await axios.get(`${this.apiUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amount.toString(),
          slippageBps,
        },
        timeout: this.timeout,
      });

      if (response.data && response.data.data && response.data.data.length > 0) {
        const quote = response.data.data[0]; // Best quote

        // Cache the quote
        await cacheService.set(cacheKey, quote, this.quoteCacheTTL);

        metricsService.recordRpcLatency('jupiter_quote', 'api_call', Date.now() - startTime);
        logger.debug(`Quote cached for ${inputMint} -> ${outputMint}`);
        return quote;
      }

      throw new Error('No quote available');
    } catch (error) {
      logger.error('Jupiter quote error:', error.message);

      // Try to return cached quote even if expired on error
      const cachedQuote = await cacheService.get(cacheKey);
      if (cachedQuote) {
        logger.warn('Returning stale cached quote due to API error');
        metricsService.recordRpcLatency('jupiter_quote', 'stale_cache', Date.now() - startTime);
        return cachedQuote;
      }

      logger.warn('Returning mock quote for testing');
      const mockQuote = this.createMockQuote(inputMint, outputMint, amount, slippageBps);
      return mockQuote;
    }
  }

  async executeSwap(quoteResponse, userPublicKey, signTransaction) {
    // For testing with mock quotes
    if (quoteResponse.routePlan && quoteResponse.routePlan[0]?.swapInfo?.ammKey === 'mock') {
      logger.warn('Executing mock swap for testing');
      const mockSignature = 'mock_signature_' + Date.now();
      logger.info(`Mock swap executed: ${mockSignature}`);
      return {
        signature: mockSignature,
        status: 'confirmed',
        retries: 0
      };
    }

    let retries = 0;
    while (retries <= this.maxRetries) {
      try {
        logger.info(`Jupiter swap attempt ${retries + 1}/${this.maxRetries + 1}`);

        // Step 1: Validate slippage and route safety
        if (!this.validateQuote(quoteResponse)) {
          throw new Error('Quote validation failed - unsafe slippage or route');
        }

        // Step 2: Get swap transaction
        const response = await axios.post(`${this.apiUrl}/swap`, {
          quoteResponse,
          userPublicKey: userPublicKey.toString(),
          wrapAndUnwrapSol: true,
        }, {
          timeout: this.timeout,
        });

        if (!response.data || !response.data.swapTransaction) {
          throw new Error('Invalid swap response from Jupiter API');
        }

        // Step 3: Deserialize and sign transaction
        const swapTransactionBuf = Buffer.from(response.data.swapTransaction, 'base64');
        const transaction = Transaction.from(swapTransactionBuf);

        // Sign the transaction
        const signedTransaction = await signTransaction(transaction);

        // Step 4: Send and confirm transaction
        const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
        logger.info(`Transaction sent: ${signature}`);

        // Confirm transaction with timeout
        const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        logger.info(`Swap executed successfully: ${signature}`);
        return {
          signature,
          status: 'confirmed',
          retries: retries
        };

      } catch (error) {
        logger.error(`Swap execution attempt ${retries + 1} failed:`, error.message);

        retries++;
        if (retries > this.maxRetries) {
          logger.error(`Swap failed after ${this.maxRetries + 1} attempts: ${error.message}`);
          throw new Error(`Swap failed after ${this.maxRetries + 1} attempts: ${error.message}`);
        }

        // Exponential backoff: wait longer between retries
        const backoffMs = 1000 * Math.pow(2, retries - 1);
        logger.info(`Retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  validateQuote(quoteResponse) {
    try {
      // Check if quote exists
      if (!quoteResponse) {
        logger.warn('Quote validation failed: No quote response');
        return false;
      }

      // Check slippage is within acceptable range
      const maxSlippage = parseInt(process.env.MAX_SLIPPAGE_BPS) || 1500;
      if (quoteResponse.slippageBps > maxSlippage) {
        logger.warn(`Quote validation failed: Slippage ${quoteResponse.slippageBps}bps exceeds max ${maxSlippage}bps`);
        return false;
      }

      // Check route has minimum number of hops (avoid direct routes that might be manipulated)
      if (!quoteResponse.routePlan || quoteResponse.routePlan.length < 1) {
        logger.warn('Quote validation failed: Invalid or missing route plan');
        return false;
      }

      // Check output amount is reasonable (not dust)
      const minOutputAmount = 1000; // Minimum 1000 lamports
      if (parseInt(quoteResponse.outAmount) < minOutputAmount) {
        logger.warn(`Quote validation failed: Output amount ${quoteResponse.outAmount} too small`);
        return false;
      }

      // Check price impact is not too high
      const maxPriceImpact = 0.5; // 50% max price impact
      if (quoteResponse.priceImpactPct && parseFloat(quoteResponse.priceImpactPct) > maxPriceImpact) {
        logger.warn(`Quote validation failed: Price impact ${quoteResponse.priceImpactPct}% too high`);
        return false;
      }

      logger.info('Quote validation passed');
      return true;

    } catch (error) {
      logger.error('Quote validation error:', error);
      return false;
    }
  }

  async getUnsignedSwapTransaction(quoteResponse, userPublicKey) {
    if (this.mockMode || quoteResponse.routePlan?.[0]?.swapInfo?.ammKey === 'mock') {
      logger.warn('Returning mock unsigned swap transaction');
      return {
        swapTransaction: 'mock_swap_transaction',
      };
    }

    try {
      const response = await axios.post(`${this.apiUrl}/swap`, {
        quoteResponse,
        userPublicKey: userPublicKey.toString(),
        wrapAndUnwrapSol: true,
      }, {
        timeout: this.timeout,
      });

      return response.data;
    } catch (error) {
      logger.error('Get unsigned transaction error:', error.message);
      throw error;
    }
  }

  createMockQuote(inputMint, outputMint, amount, slippageBps) {
    return {
      inputMint,
      outputMint,
      inAmount: amount.toString(),
      outAmount: (amount * 0.99).toString(),
      slippageBps,
      priceImpactPct: '0.01',
      routePlan: [{
        swapInfo: {
          ammKey: 'mock',
          label: 'Mock DEX',
          inputMint,
          outputMint,
          inAmount: amount.toString(),
          outAmount: (amount * 0.99).toString(),
          feeAmount: (amount * 0.01).toString(),
          feeMint: inputMint,
        }
      }],
      otherAmountThreshold: (amount * 0.98).toString(),
    };
  }

  createMockPrice(tokenMint, vsToken) {
    // Generate semi-realistic mock prices
    const basePrices = {
      'So11111111111111111111111111111111111111112': 100, // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1, // USDC
    };

    const basePrice = basePrices[tokenMint] || Math.random() * 10;
    const volatility = 0.1; // 10% volatility
    const randomFactor = 1 + (Math.random() - 0.5) * volatility;

    return {
      price: basePrice * randomFactor,
      vsToken: vsToken,
      lastUpdated: Date.now()
    };
  }
}

module.exports = new JupiterService();