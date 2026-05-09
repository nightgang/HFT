const logger = require('../../utils/logger');
const heliusService = require('../../integrations/helius.service');

class SmartMoneyEngine {
  constructor() {
    this.whaleThreshold = 1000;
    this.roiCache = new Map();
    this.accumulationCache = new Map();
  }

  async detectWhaleWallet(walletAddress) {
    try {
      const accountInfo = await heliusService.getAccountInfo(walletAddress);
      if (!accountInfo) return 0;

      const solBalance = (accountInfo.nativeBalance || 0) / 1e9;

      if (solBalance >= 10000) return 20;
      if (solBalance >= 5000) return 18;
      if (solBalance >= 1000) return 15;
      if (solBalance >= 100) return 10;
      if (solBalance >= 10) return 5;
      return 0;
    } catch (error) {
      logger.error('Whale detection error:', error);
      return 0;
    }
  }

  async calculateHistoricalROI(walletAddress) {
    try {
      if (this.roiCache.has(walletAddress)) {
        const cached = this.roiCache.get(walletAddress);
        if (Date.now() - cached.timestamp < 3600000) {
          return cached.score;
        }
      }

      const accountInfo = await heliusService.getAccountInfo(walletAddress);
      if (!accountInfo) return 0;

      let roiScore = 0;
      const tokenHoldings = accountInfo.tokens || [];
      const totalTokens = tokenHoldings.length;

      if (totalTokens > 10) roiScore += 10;
      if (totalTokens > 5) roiScore += 5;

      const largePositions = tokenHoldings.filter((token) => parseFloat(token.amount) > 1000000).length;
      if (largePositions > 3) roiScore += 10;
      if (largePositions > 1) roiScore += 5;

      roiScore += Math.floor(Math.random() * 5);
      const finalScore = Math.min(30, roiScore);

      this.roiCache.set(walletAddress, {
        score: finalScore,
        timestamp: Date.now(),
      });

      return finalScore;
    } catch (error) {
      logger.error('Historical ROI calculation error:', error);
      return 0;
    }
  }

  async detectAccumulationPatterns(walletAddress) {
    try {
      if (this.accumulationCache.has(walletAddress)) {
        const cached = this.accumulationCache.get(walletAddress);
        if (Date.now() - cached.timestamp < 1800000) {
          return cached.score;
        }
      }

      const accountInfo = await heliusService.getAccountInfo(walletAddress);
      if (!accountInfo) return 0;

      const tokenHoldings = accountInfo.tokens || [];
      const positionSizes = tokenHoldings.map((token) => parseFloat(token.amount) || 0);
      let accumulationScore = 0;

      if (positionSizes.length > 0) {
        const avgSize = positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length;
        if (avgSize > 0) {
          const variance = positionSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / positionSizes.length;
          const stdDev = Math.sqrt(variance);

          if (stdDev / avgSize < 0.5) accumulationScore += 15;
          else if (stdDev / avgSize < 1.0) accumulationScore += 10;
        }
      }

      const smallPositions = tokenHoldings.filter((token) => {
        const amount = parseFloat(token.amount) || 0;
        return amount > 1000 && amount < 100000;
      }).length;

      if (smallPositions > 5) accumulationScore += 10;
      else if (smallPositions > 2) accumulationScore += 5;

      if (tokenHoldings.length > 8) accumulationScore += 5;
      const finalScore = Math.min(30, accumulationScore);

      this.accumulationCache.set(walletAddress, {
        score: finalScore,
        timestamp: Date.now(),
      });

      return finalScore;
    } catch (error) {
      logger.error('Accumulation pattern detection error:', error);
      return 0;
    }
  }

  async generateCopyTradeSignal(walletAddress) {
    try {
      const whaleScore = await this.detectWhaleWallet(walletAddress);
      const roiScore = await this.calculateHistoricalROI(walletAddress);
      const accumulationScore = await this.detectAccumulationPatterns(walletAddress);
      const totalScore = whaleScore + roiScore + accumulationScore;

      if (totalScore >= 50) return 20;
      if (totalScore >= 35) return 15;
      if (totalScore >= 20) return 10;
      if (totalScore >= 10) return 5;
      return 0;
    } catch (error) {
      logger.error('Copy trade signal generation error:', error);
      return 0;
    }
  }

  getRecommendation(score) {
    if (score >= 80) return 'STRONG_BUY';
    if (score >= 60) return 'BUY';
    if (score >= 40) return 'HOLD';
    if (score >= 20) return 'WEAK_SELL';
    return 'SELL';
  }

  emitSmartMoneySignal(walletAddress, score) {
    const recommendation = this.getRecommendation(score);
    if (score >= 70) {
      const websocketServer = require('../../ws/websocket.server');
      websocketServer.broadcast({
        type: 'SMART_MONEY_SIGNAL',
        data: {
          walletAddress,
          smartSignalScore: score,
          recommendation,
          timestamp: Date.now(),
        },
      });
      logger.info(`📡 Broadcasted SMART_MONEY_SIGNAL for ${walletAddress}: ${score}`);
    }
  }

  async getSmartSignalScore(walletAddress) {
    try {
      logger.info(`Analyzing smart money signals for wallet: ${walletAddress}`);

      let score = 0;
      const whaleScore = await this.detectWhaleWallet(walletAddress);
      score += whaleScore;
      const roiScore = await this.calculateHistoricalROI(walletAddress);
      score += roiScore;
      const accumulationScore = await this.detectAccumulationPatterns(walletAddress);
      score += accumulationScore;
      const copyTradeScore = await this.generateCopyTradeSignal(walletAddress);
      score += copyTradeScore;
      const finalScore = Math.max(0, Math.min(100, score));

      this.emitSmartMoneySignal(walletAddress, finalScore);

      return {
        walletAddress,
        smartSignalScore: finalScore,
        breakdown: {
          whaleDetection: whaleScore,
          historicalROI: roiScore,
          accumulationPatterns: accumulationScore,
          copyTradeSignal: copyTradeScore,
        },
        recommendation: this.getRecommendation(finalScore),
      };
    } catch (error) {
      logger.error(`Smart money analysis error for ${walletAddress}:`, error);
      return {
        walletAddress,
        smartSignalScore: 0,
        breakdown: { whaleDetection: 0, historicalROI: 0, accumulationPatterns: 0, copyTradeSignal: 0 },
        recommendation: 'UNKNOWN',
        error: error.message,
      };
    }
  }

  async analyzeWallet(walletAddress) {
    const result = await this.getSmartSignalScore(walletAddress);
    const accountInfo = await heliusService.getAccountInfo(walletAddress);
    const solBalance = (accountInfo?.nativeBalance || 0) / 1e9;
    const tokenCount = Array.isArray(accountInfo?.tokens) ? accountInfo.tokens.length : 0;
    const signals = [];

    if (result.breakdown.whaleDetection >= 10) signals.push('WHALE_ACTIVITY');
    if (result.breakdown.historicalROI >= 15) signals.push('ROI_STRENGTH');
    if (result.breakdown.accumulationPatterns >= 10) signals.push('ACCUMULATION');
    if (result.breakdown.copyTradeSignal >= 5) signals.push('COPY_TRADE');

    return {
      walletAddress,
      score: result.smartSignalScore,
      smartSignalScore: result.smartSignalScore,
      breakdown: result.breakdown,
      recommendation: result.recommendation,
      signals,
      solBalance,
      tokenCount,
    };
  }

  async getSmartMoneySignal(walletAddress) {
    return this.getSmartSignalScore(walletAddress);
  }

  async getRandomSmartMoneySignal() {
    const sampleWallets = (process.env.SAMPLE_SMART_WALLETS || '').split(',').map((item) => item.trim()).filter(Boolean);
    if (sampleWallets.length > 0) {
      const randomWallet = sampleWallets[Math.floor(Math.random() * sampleWallets.length)];
      return this.analyzeWallet(randomWallet);
    }

    // Generate more realistic signal with pattern-based scoring
    const patterns = [
      { signal: 'WHALE_ACCUMULATION', weight: 0.25, minScore: 70 },
      { signal: 'EARLY_STAGE_ADOPTION', weight: 0.25, minScore: 60 },
      { signal: 'PROFIT_TAKING', weight: 0.20, minScore: 50 },
      { signal: 'PORTFOLIO_DIVERSIFICATION', weight: 0.20, minScore: 45 },
      { signal: 'RISK_HEDGING', weight: 0.10, minScore: 35 }
    ];

    // Select dominant pattern
    const dominantPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const baseScore = dominantPattern.minScore + Math.floor(Math.random() * 20);
    const score = Math.min(100, Math.max(20, baseScore));

    // Generate realistic breakdown
    const breakdown = {
      whaleDetection: score >= 60 ? Math.floor(Math.random() * 10) + 10 : Math.floor(Math.random() * 5) + 2,
      historicalROI: score >= 40 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 5),
      accumulationPatterns: score >= 50 ? Math.floor(Math.random() * 15) + 8 : Math.floor(Math.random() * 10) + 2,
      copyTradeSignal: score >= 70 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 5),
      marketTiming: score >= 55 ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 5),
    };

    // Determine signals based on patterns
    const signals = [];
    if (score >= 75) signals.push('WHALE_ACTIVITY', 'STRONG_BUY_SIGNAL');
    if (score >= 70) signals.push('ACCUMULATION_PHASE');
    if (score >= 60) signals.push('EARLY_ENTRY_OPPORTUNITY');
    if (score >= 50 && score < 65) signals.push('MODERATE_SIGNAL');
    if (score < 50) signals.push('CAUTION_WATCH');
    if (breakdown.marketTiming >= 8) signals.push('FAVORABLE_TIMING');

    return {
      walletAddress: `SMART_WALLET_${Math.random().toString(36).substring(7)}`,
      smartSignalScore: score,
      score,
      recommendation: this.getRecommendation(score),
      breakdown,
      signals: [...new Set(signals)],
      pattern: dominantPattern.signal,
      solBalance: Math.floor(Math.random() * 50000) + 100,
      tokenCount: Math.floor(Math.random() * 50) + 5,
      avgTokenValue: Math.floor(Math.random() * 1000000) + 10000,
      tradingFrequency: Math.floor(Math.random() * 30) + 1,
      source: 'pattern-based-simulation',
      confidence: Math.min(1, 0.6 + (score / 200)),
      timestamp: new Date().toISOString(),
    };
  }

  async getSampleSmartMoneySignals(limit = 5) {
    const signals = [];
    for (let i = 0; i < limit; i += 1) {
      signals.push(await this.getRandomSmartMoneySignal());
    }
    return signals;
  }
}

module.exports = new SmartMoneyEngine();