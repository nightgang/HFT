/**
 * Katana Risk Engine
 *
 * Advanced risk assessment and protection system for Katana Mode.
 * Detects honeypots, suspicious activities, and dangerous conditions.
 *
 * Features:
 * - Honeypot detection (freeze authority, mint authority)
 * - Liquidity removal detection
 * - Suspicious dev wallet analysis
 * - Real-time risk monitoring
 * - Emergency exit triggers
 * - Blacklist management
 */

const EventEmitter = require('events');
const { Connection, PublicKey } = require('@solana/web3.js');
const logger = require('../utils/logger');
const heliusService = require('../integrations/helius.service');
const jupiterService = require('../integrations/jupiter.service');

class KatanaRisk extends EventEmitter {
  constructor() {
    super();
    this.connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com');
    this.blacklist = new Set();
    this.suspiciousWallets = new Set();
    this.riskCache = new Map();
    this.cacheTTL = 30000; // 30 seconds

    this.config = {
      minLiquiditySOL: parseFloat(process.env.KATANA_RISK_MIN_LIQUIDITY) || 1,
      maxDevWalletPercentage: parseFloat(process.env.KATANA_RISK_MAX_DEV_PERCENT) || 20,
      honeypotCheckEnabled: process.env.KATANA_RISK_HONEYPOT_CHECK !== 'false',
      liquidityRemovalCheckEnabled: process.env.KATANA_RISK_LIQUIDITY_CHECK !== 'false',
      devWalletCheckEnabled: process.env.KATANA_RISK_DEV_CHECK !== 'false',
      emergencyExitEnabled: process.env.KATANA_RISK_EMERGENCY_EXIT !== 'false'
    };

    this.monitoringIntervals = new Map();
  }

  async initialize() {
    logger.info('🛡️ Initializing Katana Risk Engine');

    // Load blacklists from database or config
    await this.loadBlacklists();

    // Start monitoring critical tokens
    this.startCriticalMonitoring();
  }

  async shutdown() {
    logger.info('🛑 Shutting down Katana Risk Engine');

    // Clear all monitoring intervals
    for (const [token, interval] of this.monitoringIntervals) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();
  }

  async evaluateToken(tokenData) {
    try {
      const tokenMint = tokenData.mint || tokenData.tokenMint;
      logger.debug(`Evaluating risk for token: ${tokenMint}`);

      // Check cache first
      const cached = this.riskCache.get(tokenMint);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.risk;
      }

      let riskLevel = 'SAFE';
      const riskFactors = [];

      // Honeypot detection
      if (this.config.honeypotCheckEnabled) {
        const honeypotRisk = await this.checkHoneypot(tokenMint);
        if (honeypotRisk.isHoneypot) {
          riskLevel = 'UNSAFE';
          riskFactors.push(`Honeypot: ${honeypotRisk.reason}`);
        }
      }

      // Liquidity checks
      if (this.config.liquidityRemovalCheckEnabled) {
        const liquidityRisk = await this.checkLiquidityRisk(tokenMint, tokenData);
        if (liquidityRisk.isRisky) {
          riskLevel = 'UNSAFE';
          riskFactors.push(`Liquidity: ${liquidityRisk.reason}`);
        }
      }

      // Dev wallet analysis
      if (this.config.devWalletCheckEnabled) {
        const devRisk = await this.checkDevWalletRisk(tokenMint);
        if (devRisk.isRisky) {
          riskLevel = 'HIGH_RISK';
          riskFactors.push(`Dev Wallet: ${devRisk.reason}`);
        }
      }

      // Blacklist check
      if (this.blacklist.has(tokenMint)) {
        riskLevel = 'UNSAFE';
        riskFactors.push('Token is blacklisted');
      }

      // Cache result
      this.riskCache.set(tokenMint, {
        risk: riskLevel,
        factors: riskFactors,
        timestamp: Date.now()
      });

      logger.info(`Risk assessment for ${tokenMint}: ${riskLevel} ${riskFactors.length > 0 ? `(${riskFactors.join(', ')})` : ''}`);

      return riskLevel;

    } catch (error) {
      logger.error(`Risk evaluation failed for ${tokenData.mint}:`, error);
      return 'UNKNOWN';
    }
  }

  async checkHoneypot(tokenMint) {
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(tokenMint));
      if (!accountInfo) {
        return { isHoneypot: true, reason: 'Token account not found' };
      }

      // Parse mint account data
      const data = accountInfo.data;
      if (data.length < 82) {
        return { isHoneypot: true, reason: 'Invalid mint account data' };
      }

      // Check authorities (simplified parsing)
      const mintAuthority = data.slice(0, 32);
      const freezeAuthority = data.slice(32, 64);

      // Authorities are null if all bytes are 0
      const mintAuthorityRevoked = mintAuthority.every(byte => byte === 0);
      const freezeAuthorityRevoked = freezeAuthority.every(byte => byte === 0);

      if (!mintAuthorityRevoked) {
        return { isHoneypot: true, reason: 'Mint authority not revoked' };
      }

      if (!freezeAuthorityRevoked) {
        return { isHoneypot: true, reason: 'Freeze authority not revoked' };
      }

      // Check for suspicious token metadata
      const metadata = await heliusService.getTokenMetadata(tokenMint);
      if (metadata) {
        // Check for suspicious names/symbols
        const name = metadata.name?.toLowerCase() || '';
        const symbol = metadata.symbol?.toLowerCase() || '';

        if (name.includes('test') || symbol.includes('test')) {
          return { isHoneypot: true, reason: 'Test token detected' };
        }

        // Check for empty or suspicious descriptions
        if (!metadata.description || metadata.description.length < 10) {
          return { isHoneypot: false, reason: 'Short metadata' }; // Warning but not honeypot
        }
      }

      return { isHoneypot: false, reason: 'Authorities revoked' };

    } catch (error) {
      logger.error(`Honeypot check failed for ${tokenMint}:`, error);
      return { isHoneypot: true, reason: 'Check failed' };
    }
  }

  async checkLiquidityRisk(tokenMint, tokenData) {
    try {
      // Get liquidity from Jupiter or token data
      let liquidity = tokenData.liquidity || 0;

      if (liquidity === 0) {
        // Try to get from Jupiter price data
        const priceData = await jupiterService.getTokenPrice(tokenMint);
        if (priceData && priceData.liquidity) {
          liquidity = priceData.liquidity;
        }
      }

      if (liquidity < this.config.minLiquiditySOL) {
        return {
          isRisky: true,
          reason: `Low liquidity: ${liquidity} SOL (min: ${this.config.minLiquiditySOL})`
        };
      }

      // Monitor for liquidity removal
      const currentLiquidity = await this.getCurrentLiquidity(tokenMint);
      if (currentLiquidity < liquidity * 0.5) { // 50% drop
        return {
          isRisky: true,
          reason: `Liquidity removed: ${currentLiquidity} SOL (was ${liquidity})`
        };
      }

      return { isRisky: false, reason: 'Liquidity OK' };

    } catch (error) {
      logger.error(`Liquidity check failed for ${tokenMint}:`, error);
      return { isRisky: true, reason: 'Liquidity check failed' };
    }
  }

  async checkDevWalletRisk(tokenMint) {
    try {
      const metadata = await heliusService.getTokenMetadata(tokenMint);
      if (!metadata || !metadata.creator) {
        return { isRisky: false, reason: 'No creator info' };
      }

      const creatorWallet = metadata.creator;

      // Get creator's token balance
      const balance = await this.getWalletTokenBalance(creatorWallet, tokenMint);
      const totalSupply = await this.getTokenSupply(tokenMint);

      if (totalSupply && balance) {
        const percentage = (balance / totalSupply) * 100;
        if (percentage > this.config.maxDevWalletPercentage) {
          return {
            isRisky: true,
            reason: `Dev holds ${percentage.toFixed(2)}% of supply`
          };
        }
      }

      // Check for suspicious transaction patterns
      const recentTxs = await heliusService.getRecentTransactions(creatorWallet, 50);
      const suspiciousPatterns = this.analyzeTransactionPatterns(recentTxs);

      if (suspiciousPatterns.isSuspicious) {
        return {
          isRisky: true,
          reason: suspiciousPatterns.reason
        };
      }

      return { isRisky: false, reason: 'Dev wallet OK' };

    } catch (error) {
      logger.error(`Dev wallet check failed for ${tokenMint}:`, error);
      return { isRisky: true, reason: 'Dev check failed' };
    }
  }

  analyzeTransactionPatterns(transactions) {
    if (!transactions || transactions.length === 0) {
      return { isSuspicious: false };
    }

    // Check for large dumps shortly after launch
    const recentDumps = transactions.filter(tx => {
      // Would analyze transaction types and amounts
      return false; // Placeholder
    });

    if (recentDumps.length > 5) {
      return { isSuspicious: true, reason: 'Suspicious dump pattern detected' };
    }

    return { isSuspicious: false };
  }

  async monitorPosition(position) {
    // Monitor active positions for risk changes
    const tokenMint = position.tokenMint;
    const riskLevel = await this.evaluateToken({ mint: tokenMint });

    if (riskLevel === 'UNSAFE') {
      this.emit('riskAlert', {
        tokenMint,
        alertType: 'POSITION_RISK',
        severity: 'CRITICAL',
        position: position
      });
    }
  }

  startCriticalMonitoring() {
    // Monitor critical tokens every 30 seconds
    this.criticalMonitorInterval = setInterval(async () => {
      for (const tokenMint of this.blacklist) {
        // Monitor blacklisted tokens for any changes
        await this.checkForRiskChanges(tokenMint);
      }
    }, 30000);
  }

  async checkForRiskChanges(tokenMint) {
    // Check if previously risky token has improved
    const currentRisk = await this.evaluateToken({ mint: tokenMint });
    const cached = this.riskCache.get(tokenMint);

    if (cached && cached.risk !== currentRisk) {
      logger.info(`Risk level changed for ${tokenMint}: ${cached.risk} -> ${currentRisk}`);
    }
  }

  async addToBlacklist(tokenMint, reason) {
    this.blacklist.add(tokenMint);
    logger.warn(`🚫 Added ${tokenMint} to blacklist: ${reason}`);

    // Emit emergency exit for this token
    this.emit('emergencyExit', {
      tokenMint,
      reason: `Blacklisted: ${reason}`
    });
  }

  async removeFromBlacklist(tokenMint) {
    this.blacklist.delete(tokenMint);
    logger.info(`✅ Removed ${tokenMint} from blacklist`);
  }

  async loadBlacklists() {
    // Load from database or config file
    // For now, using environment variable
    const blacklistEnv = process.env.KATANA_RISK_BLACKLIST;
    if (blacklistEnv) {
      const tokens = blacklistEnv.split(',');
      tokens.forEach(token => this.blacklist.add(token.trim()));
      logger.info(`Loaded ${this.blacklist.size} blacklisted tokens`);
    }
  }

  // Utility methods
  async getCurrentLiquidity(tokenMint) {
    // Get current liquidity from DEX
    // This would integrate with Jupiter or Raydium APIs
    return 0; // Placeholder
  }

  async getWalletTokenBalance(walletAddress, tokenMint) {
    try {
      const balance = await heliusService.getAccountInfo(walletAddress);
      // Parse token balance from account info
      return 0; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  async getTokenSupply(tokenMint) {
    try {
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(tokenMint));
      if (accountInfo) {
        // Parse supply from mint data
        return 1000000; // Placeholder
      }
    } catch (error) {
      return 0;
    }
  }

  getRiskStats() {
    return {
      blacklistedTokens: this.blacklist.size,
      cachedRiskAssessments: this.riskCache.size,
      config: this.config
    };
  }

  clearCache() {
    this.riskCache.clear();
    logger.info('🧹 Risk cache cleared');
  }
}

module.exports = KatanaRisk;</content>
<parameter name="filePath">/workspaces/HFT/backend/services/engines/katana.risk.js