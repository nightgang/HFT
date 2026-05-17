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
          logger.warn(`No metadata found for mint ${tokenMint}, using fallback values`);
        }

        const tokenData = {
          mint: tokenMint,
          name: metadata?.name || metadata?.symbol || `TOKEN_${tokenMint.slice(0, 6)}`,
          symbol: metadata?.symbol || metadata?.name || tokenMint.slice(0, 5),
          decimals: metadata?.decimals != null ? metadata.decimals : 0,
          supply: metadata?.supply?.toString() || '0',
          creator: metadata?.creator || '',
          timestamp: Date.now(),
        };

        tokenDetectionSchema.parse(tokenData);
        await sniperEngine.processTokenDetection(tokenData);

        // Publish token detection event to the EventBus (shared realtime layer)
        const eventBus = require('./event-bus.service');
        await eventBus.publish('token.detected', {
          type: 'TOKEN_DETECTED',
          data: tokenData,
        });

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
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    if (Array.isArray(item)) {
      return item.flatMap((entry) => this.findTokenMints(entry));
    }

    if (item && typeof item === 'object') {
      const found = [];

      const candidateFields = [
        'mint',
        'tokenMint',
        'address',
        'tokenAddress',
        'account',
      ];

      for (const field of candidateFields) {
        if (typeof item[field] === 'string' && base58Regex.test(item[field])) {
          found.push(item[field]);
        }
      }

      for (const value of Object.values(item)) {
        found.push(...this.findTokenMints(value));
      }

      return found;
    }

    if (typeof item === 'string' && base58Regex.test(item)) {
      return [item];
    }

    return [];
  }
}

module.exports = new HeliusWebhookProcessor();