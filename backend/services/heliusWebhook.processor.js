const logger = require('../utils/logger');
const heliusService = require('../integrations/helius.service');
const sniperEngine = require('./engines/sniper.engine');
const { tokenDetectionSchema } = require('../utils/validator');

class HeliusWebhookProcessor {
  async processWebhook(payload) {
    const tokenMints = this.extractTokenMints(payload);
    if (tokenMints.length === 0) {
      logger.warn('Helius webhook received with no token mint data');
      return { processed: 0 };
    }

    let processed = 0;
    for (const tokenMint of tokenMints) {
      try {
        const metadata = await heliusService.getTokenMetadata(tokenMint);
        if (!metadata) {
          logger.warn(`No metadata found for mint ${tokenMint}`);
          continue;
        }

        const tokenData = {
          mint: tokenMint,
          name: metadata.name || metadata.symbol || 'UNKNOWN',
          symbol: metadata.symbol || metadata.name || 'TOKEN',
          decimals: metadata.decimals != null ? metadata.decimals : 0,
          supply: metadata.supply?.toString() || '0',
          creator: metadata.creator || '',
          timestamp: Date.now(),
        };

        tokenDetectionSchema.parse(tokenData);
        await sniperEngine.processTokenDetection(tokenData);
        processed++;
      } catch (error) {
        logger.error('Helius webhook processing error:', error.message);
      }
    }

    return { processed };
  }

  extractTokenMints(payload) {
    const mints = new Set();
    this.findTokenMints(payload).forEach((mint) => mints.add(mint));
    return Array.from(mints);
  }

  findTokenMints(item) {
    if (Array.isArray(item)) {
      return item.flatMap((entry) => this.findTokenMints(entry));
    }

    if (item && typeof item === 'object') {
      const found = [];

      if (typeof item.mint === 'string' && item.mint.length >= 32 && item.mint.length <= 44) {
        found.push(item.mint);
      }

      for (const value of Object.values(item)) {
        found.push(...this.findTokenMints(value));
      }

      return found;
    }

    return [];
  }
}

module.exports = new HeliusWebhookProcessor();