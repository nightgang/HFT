const logger = require('../utils/logger');
const heliusService = require('../integrations/helius.service');
const heliusWebhookProcessor = require('./heliusWebhook.processor');

class EventPoller {
  constructor() {
    const rawAddresses = process.env.HELIUS_WATCH_ADDRESSES || '';
    this.watchAddresses = rawAddresses
      .split(',')
      .map((address) => address.split('#')[0].trim())
      .filter(Boolean);
    this.pollIntervalMs = 30000; // 30 seconds
    this.seenSignatures = new Set();
    this.timer = null;
  }

  start() {
    if (this.watchAddresses.length === 0) {
      logger.warn(
        'EventPoller disabled: no HELIUS_WATCH_ADDRESSES configured. ' +
          'Set HELIUS_WATCH_ADDRESSES as a comma-separated list of Helius watch addresses. ' +
          'Example: HELIUS_WATCH_ADDRESSES="addr1,addr2" (optional labels supported: addr#label).' 
      );
      return;
    }

    logger.info(`EventPoller started for ${this.watchAddresses.length} watch addresses`);
    this.timer = setInterval(() => this.poll(), this.pollIntervalMs);
    this.poll().catch((error) => logger.error('Initial event poll error:', error.message));
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('EventPoller stopped');
    }
  }

  async poll() {
    for (const address of this.watchAddresses) {
      try {
        const transactions = await heliusService.getRecentTransactions(address, 20);
        if (!Array.isArray(transactions)) {
          continue;
        }

        for (const transaction of transactions) {
          const signature = transaction.signature || transaction.txHash || transaction.transactionHash;
          if (!signature || this.seenSignatures.has(signature)) {
            continue;
          }

          this.seenSignatures.add(signature);
          await this.processTransaction(transaction);
        }
      } catch (error) {
        logger.error(`EventPoller poll error for ${address}:`, error.message);
      }
    }

    // Keep a limited memory footprint
    if (this.seenSignatures.size > 1000) {
      const keys = Array.from(this.seenSignatures).slice(500);
      keys.forEach((key) => this.seenSignatures.delete(key));
    }
  }

  async processTransaction(transaction) {
    try {
      const tokenMints = this.collectTokenMints(transaction);
      if (tokenMints.length === 0) {
        return;
      }

      const metadata = { tokenMints, transaction };
      await heliusWebhookProcessor.processWebhook(metadata);
    } catch (error) {
      logger.error('EventPoller processTransaction error:', error.message);
    }
  }

  collectTokenMints(payload) {
    if (!payload) {
      return [];
    }

    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    const candidateMints = new Set();
    const stack = [payload];

    while (stack.length > 0) {
      const item = stack.pop();
      if (item === null || item === undefined) continue;

      if (typeof item === 'string' && base58Regex.test(item)) {
        candidateMints.add(item);
        continue;
      }

      if (typeof item === 'object') {
        const candidateFields = [
          'mint',
          'tokenMint',
          'address',
          'tokenAddress',
          'account',
        ];

        for (const field of candidateFields) {
          if (typeof item[field] === 'string' && base58Regex.test(item[field])) {
            candidateMints.add(item[field]);
          }
        }

        for (const value of Object.values(item)) {
          stack.push(value);
        }
      }
    }

    return Array.from(candidateMints);
  }
}

module.exports = new EventPoller();