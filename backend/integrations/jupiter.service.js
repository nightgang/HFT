const axios = require('axios');
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const logger = require('../utils/logger');

class JupiterService {
  constructor() {
    this.apiUrl = process.env.JUPITER_API_URL;
    this.rpcUrl = process.env.RPC_URL;
    this.connection = new Connection(this.rpcUrl);
    this.maxRetries = 2;
    this.timeout = 30000; // 30 seconds
  }

  async getQuote(inputMint, outputMint, amount, slippageBps = 1500) {
    try {
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
        return response.data.data[0]; // Best quote
      }
      throw new Error('No quote available');
    } catch (error) {
      logger.error('Jupiter quote error:', error.message);
      throw error;
    }
  }

  async executeSwap(quoteResponse, userPublicKey, signTransaction) {
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
}

module.exports = new JupiterService();