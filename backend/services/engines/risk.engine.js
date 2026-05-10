const { Connection, PublicKey } = require('@solana/web3.js');
const logger = require('../../utils/logger');
const heliusService = require('../../integrations/helius.service');

const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';

class RiskEngine {
  constructor() {
    const rpcUrl = process.env.RPC_URL || DEFAULT_RPC_URL;
    if (!process.env.RPC_URL) {
      logger.warn(`RPC_URL environment variable is not set. Falling back to default RPC endpoint: ${rpcUrl}`);
    }
    this.connection = new Connection(rpcUrl);
    this.minLiquidity = 1000; // Minimum SOL liquidity
    this.maxWalletConcentration = 0.5; // Max 50% in one wallet
    this.blacklist = new Set(); // Would be loaded from database
  }

  async evaluateTokenRisk(tokenMint) {
    try {
      logger.info(`Evaluating risk for token: ${tokenMint}`);

      const metadata = await heliusService.getTokenMetadata(tokenMint);
      if (!metadata) {
        logger.warn(`Risk evaluation: UNSAFE - Unable to fetch token metadata for ${tokenMint}`);
        return 'UNSAFE';
      }

      // Check mint authority
      const mintInfo = await this.connection.getAccountInfo(new PublicKey(tokenMint));
      if (!mintInfo) {
        logger.warn(`Risk evaluation: UNSAFE - Token account not found for ${tokenMint}`);
        return 'UNSAFE';
      }

      // Parse mint data (simplified)
      const mintData = mintInfo.data;
      const mintAuthority = mintData.slice(0, 32);
      const freezeAuthority = mintData.slice(32, 64);

      // Check if authorities are revoked (null)
      const mintAuthorityRevoked = mintAuthority.every(byte => byte === 0);
      const freezeAuthorityRevoked = freezeAuthority.every(byte => byte === 0);

      if (!mintAuthorityRevoked && !freezeAuthorityRevoked) {
        logger.warn(`Risk evaluation: UNSAFE - Mint and freeze authorities not revoked for ${tokenMint}`);
        return 'UNSAFE';
      }

      // Check blacklist
      if (this.blacklist.has(tokenMint)) {
        logger.warn(`Risk evaluation: UNSAFE - Token ${tokenMint} is blacklisted`);
        return 'UNSAFE';
      }

      // Check liquidity (simplified - would need better DEX integration)
      const liquidity = await this.checkLiquidity(tokenMint);
      if (liquidity < this.minLiquidity) {
        logger.warn(`Risk evaluation: UNSAFE - Insufficient liquidity: ${liquidity} SOL for ${tokenMint}`);
        return 'UNSAFE';
      }

      // Check wallet concentration
      const concentration = await this.checkWalletConcentration(tokenMint);
      if (concentration > this.maxWalletConcentration) {
        logger.warn(`Risk evaluation: UNSAFE - High wallet concentration: ${(concentration * 100).toFixed(2)}% for ${tokenMint}`);
        return 'UNSAFE';
      }

      // Basic contract pattern check (simplified)
      const suspicious = this.checkSuspiciousPatterns(metadata);
      if (suspicious) {
        logger.warn(`Risk evaluation: UNSAFE - Suspicious contract patterns detected for ${tokenMint}`);
        return 'UNSAFE';
      }

      logger.info(`Risk evaluation: SAFE - Token ${tokenMint} passed all checks`);
      return 'SAFE';
    } catch (error) {
      logger.error(`Risk evaluation error for ${tokenMint}:`, error);
      // On error, default to UNSAFE for safety
      return 'UNSAFE';
    }
  }

  async checkLiquidity(tokenMint) {
    // Simplified liquidity check - in production, integrate with DEX APIs
    try {
      // This is a placeholder - real implementation would query Raydium/Jupiter pools
      const pools = await this.connection.getProgramAccounts(
        new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'), // Raydium AMM
        {
          filters: [
            {
              memcmp: {
                offset: 8 + 32, // After discriminator and authority
                bytes: tokenMint,
              },
            },
          ],
        }
      );

      // Estimate liquidity from pool size
      let totalLiquidity = 0;
      for (const pool of pools.slice(0, 5)) { // Check first 5 pools
        // Parse pool data (simplified)
        const data = pool.account.data;
        // This would need proper parsing of Raydium pool structure
        totalLiquidity += 100; // Placeholder
      }

      return totalLiquidity;
    } catch (error) {
      logger.error('Liquidity check error:', error);
      return 0;
    }
  }

  async checkWalletConcentration(tokenMint) {
    try {
      // Get top holders (simplified)
      const accounts = await this.connection.getTokenLargestAccounts(new PublicKey(tokenMint));
      if (accounts.value.length === 0) return 0;

      const totalSupply = accounts.value.reduce((sum, acc) => sum + parseInt(acc.amount), 0);
      const largestHolder = parseInt(accounts.value[0].amount);

      return largestHolder / totalSupply;
    } catch (error) {
      logger.error('Wallet concentration check error:', error);
      return 1; // Assume high concentration on error
    }
  }

  checkSuspiciousPatterns(metadata) {
    // Basic heuristics
    const name = metadata.name || '';
    const symbol = metadata.symbol || '';

    // Check for suspicious keywords
    const suspiciousKeywords = ['rug', 'scam', 'fake', 'test'];
    const combined = (name + symbol).toLowerCase();

    for (const keyword of suspiciousKeywords) {
      if (combined.includes(keyword)) {
        return true;
      }
    }

    // Check for excessive special characters
    const specialChars = combined.match(/[^a-zA-Z0-9\s]/g);
    if (specialChars && specialChars.length > name.length * 0.3) {
      return true;
    }

    return false;
  }

  addToBlacklist(tokenMint) {
    this.blacklist.add(tokenMint);
    logger.info(`Added ${tokenMint} to blacklist`);
  }

  removeFromBlacklist(tokenMint) {
    this.blacklist.delete(tokenMint);
    logger.info(`Removed ${tokenMint} from blacklist`);
  }
}

module.exports = new RiskEngine();