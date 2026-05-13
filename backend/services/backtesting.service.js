const logger = require('../utils/logger');
const cacheService = require('./cache.service');
const jupiterService = require('../integrations/jupiter.service');
const { query } = require('../db/connection');

class AdvancedBacktestingService {
  constructor() {
    this.supportedStrategies = [
      'buy_and_hold',
      'moving_average_crossover',
      'rsi_divergence',
      'bollinger_bands',
      'macd_crossover',
      'mean_reversion',
      'momentum',
      'dollar_cost_average',
      'martingale',
      'anti_martingale'
    ];

    this.riskMetrics = {
      maxDrawdown: true,
      sharpeRatio: true,
      sortinoRatio: true,
      calmarRatio: true,
      winRate: true,
      profitFactor: true,
      expectancy: true,
      recoveryFactor: true
    };
  }

  async runBacktest({
    tokenMint,
    strategy = 'moving_average_crossover',
    startCapital = 10000,
    startDate,
    endDate,
    parameters = {},
    feeBps = 25,
    slippageBps = 10,
    positionSizePercent = 100,
    enableRiskManagement = true,
    stopLossPercent = 5,
    takeProfitPercent = 20
  }) {
    try {
      if (!tokenMint) {
        throw new Error('Token mint is required for backtesting');
      }

      if (!this.supportedStrategies.includes(strategy)) {
        throw new Error(`Unsupported strategy '${strategy}'. Supported strategies: ${this.supportedStrategies.join(', ')}`);
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      if (end <= start) {
        throw new Error('End date must be after start date');
      }

      const cacheKey = `backtest_v2:${tokenMint}:${strategy}:${start.toISOString()}:${end.toISOString()}:${JSON.stringify(parameters)}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('Advanced backtest result retrieved from cache');
        return cached;
      }

      // Get historical price data
      const priceSeries = await this.getHistoricalPrices(tokenMint, start, end);

      if (priceSeries.length < 2) {
        throw new Error('Insufficient historical data for backtesting');
      }

      if (priceSeries.length < 30 && strategy !== 'buy_and_hold') {
        throw new Error('Insufficient historical data for backtesting');
      }

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(priceSeries);

      // Simulate strategy
      const trades = await this.simulateAdvancedStrategy(
        strategy,
        priceSeries,
        indicators,
        startCapital,
        parameters,
        {
          feeBps,
          slippageBps,
          positionSizePercent,
          enableRiskManagement,
          stopLossPercent,
          takeProfitPercent
        }
      );

      // Calculate comprehensive analytics
      const analytics = this.calculateAdvancedAnalytics(priceSeries, trades, startCapital, feeBps);

      // Calculate risk metrics
      const riskMetrics = this.calculateRiskMetrics(priceSeries, trades, analytics);

      // Generate performance chart data
      const chartData = this.generateChartData(priceSeries, trades, analytics);

      const result = {
        success: true,
        tokenMint,
        strategy,
        parameters,
        config: {
          startCapital,
          feeBps,
          slippageBps,
          positionSizePercent,
          enableRiskManagement,
          stopLossPercent,
          takeProfitPercent
        },
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
          days: priceSeries.length
        },
        priceSeries: priceSeries.slice(-100), // Last 100 days for chart
        trades,
        analytics,
        riskMetrics,
        chartData,
        generatedAt: new Date().toISOString()
      };

      await cacheService.set(cacheKey, result, 3600); // Cache for 1 hour
      return result;

    } catch (error) {
      logger.error('Advanced backtesting error:', error);
      return {
        success: false,
        error: error.message,
        tokenMint,
        strategy
      };
    }
  }

  async getHistoricalPrices(tokenMint, startDate, endDate) {
    try {
      // Try to get real historical data from database first
      const result = await query(`
        SELECT
          DATE(created_at) as date,
          AVG(price_usd) as price,
          MIN(price_usd) as low,
          MAX(price_usd) as high,
          SUM(volume) as volume
        FROM price_history
        WHERE token_mint = $1
          AND created_at >= $2
          AND created_at <= $3
          AND price_usd > 0
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [tokenMint, startDate, endDate]);

      if (result.rows.length > 10) {
        return result.rows.map(row => ({
          date: row.date,
          price: parseFloat(row.price),
          low: parseFloat(row.low),
          high: parseFloat(row.high),
          volume: parseInt(row.volume) || 0
        }));
      }
    } catch (error) {
      logger.warn('Failed to get historical prices from database:', error);
    }

    // Fallback to synthetic data generation
    return this.generateSyntheticPrices(tokenMint, startDate, endDate);
  }

  async generateSyntheticPrices(tokenMint, startDate, endDate) {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Get current price as base
    let basePrice = 0.01; // Default
    try {
      const priceResponse = await jupiterService.getTokenPrice(tokenMint);
      if (priceResponse && priceResponse.price) {
        basePrice = priceResponse.price;
      }
    } catch (error) {
      logger.warn('Failed to get current price, using default');
    }

    const prices = [];
    let price = basePrice;
    let trend = 0.0001; // Slight upward trend
    let volatility = 0.03; // 3% daily volatility

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Add seasonal effects (weekend lower volume)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const volumeMultiplier = isWeekend ? 0.3 : 1.0;

      // Generate price movement with mean reversion
      const randomShock = (Math.random() - 0.5) * 2 * volatility;
      const meanReversion = (basePrice - price) * 0.01; // 1% mean reversion
      const growth = trend + randomShock + meanReversion;

      price = Math.max(0.000001, price * (1 + growth));

      // Generate OHLC
      const dailyVolatility = volatility * Math.sqrt(1/252); // Annualized to daily
      const open = price;
      const close = price * (1 + (Math.random() - 0.5) * dailyVolatility * 2);
      const high = Math.max(open, close) * (1 + Math.random() * dailyVolatility);
      const low = Math.min(open, close) * (1 - Math.random() * dailyVolatility);
      const volume = Math.floor(Math.random() * 1000000 * volumeMultiplier) + 10000;

      prices.push({
        date: date.toISOString().slice(0, 10),
        price: close,
        open: open,
        high: high,
        low: low,
        volume: volume
      });

      // Update base price for mean reversion
      basePrice = price;
    }

    return prices;
  }

  calculateTechnicalIndicators(priceSeries) {
    const prices = priceSeries.map(p => p.price);
    const indicators = {};

    // Simple Moving Averages
    indicators.sma_20 = this.calculateSMA(prices, 20);
    indicators.sma_50 = this.calculateSMA(prices, 50);
    indicators.sma_200 = this.calculateSMA(prices, 200);

    // Exponential Moving Averages
    indicators.ema_12 = this.calculateEMA(prices, 12);
    indicators.ema_26 = this.calculateEMA(prices, 26);

    // RSI
    indicators.rsi_14 = this.calculateRSI(prices, 14);

    // MACD
    const macdResult = this.calculateMACD(prices);
    indicators.macd = macdResult.macd;
    indicators.macd_signal = macdResult.signal;
    indicators.macd_histogram = macdResult.histogram;

    // Bollinger Bands
    const bbResult = this.calculateBollingerBands(prices, 20, 2);
    indicators.bb_upper = bbResult.upper;
    indicators.bb_middle = bbResult.middle;
    indicators.bb_lower = bbResult.lower;

    // ATR (Average True Range)
    indicators.atr_14 = this.calculateATR(priceSeries, 14);

    // Volume indicators
    const volumes = priceSeries.map(p => p.volume || 0);
    indicators.volume_sma_20 = this.calculateSMA(volumes, 20);

    return indicators;
  }

  calculateSMA(prices, period) {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  calculateEMA(prices, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        ema.push(prices[0]);
      } else {
        const value = (prices[i] - (ema[i - 1] || prices[i])) * multiplier + (ema[i - 1] || prices[i]);
        ema.push(value);
      }
    }
    return ema;
  }

  calculateRSI(prices, period) {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(null);
      } else {
        const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
    return rsi;
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = [];
    const signal = [];
    const histogram = [];

    // Calculate MACD line
    for (let i = 0; i < prices.length; i++) {
      if (ema12[i] !== null && ema26[i] !== null) {
        macd.push(ema12[i] - ema26[i]);
      } else {
        macd.push(null);
      }
    }

    // Calculate signal line (9-period EMA of MACD)
    const macdValues = macd.filter(v => v !== null);
    const signalLine = this.calculateEMA(macdValues, 9);

    // Align signal line with macd array
    let signalIndex = 0;
    for (let i = 0; i < macd.length; i++) {
      if (macd[i] !== null) {
        signal.push(signalIndex < signalLine.length ? signalLine[signalIndex] : null);
        signalIndex++;
      } else {
        signal.push(null);
      }
    }

    // Calculate histogram
    for (let i = 0; i < macd.length; i++) {
      if (macd[i] !== null && signal[i] !== null) {
        histogram.push(macd[i] - signal[i]);
      } else {
        histogram.push(null);
      }
    }

    return { macd, signal, histogram };
  }

  calculateBollingerBands(prices, period, stdDev) {
    const sma = this.calculateSMA(prices, period);
    const upper = [];
    const lower = [];
    const middle = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        lower.push(null);
        middle.push(null);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const std = Math.sqrt(variance);

        upper.push(mean + (stdDev * std));
        lower.push(mean - (stdDev * std));
        middle.push(mean);
      }
    }

    return { upper, lower, middle };
  }

  calculateATR(priceSeries, period) {
    const tr = [];
    const atr = [];

    // Calculate True Range
    for (let i = 0; i < priceSeries.length; i++) {
      if (i === 0) {
        tr.push(priceSeries[i].high - priceSeries[i].low);
      } else {
        const high = priceSeries[i].high;
        const low = priceSeries[i].low;
        const prevClose = priceSeries[i - 1].price;

        const tr1 = high - low;
        const tr2 = Math.abs(high - prevClose);
        const tr3 = Math.abs(low - prevClose);

        tr.push(Math.max(tr1, tr2, tr3));
      }
    }

    // Calculate ATR
    for (let i = 0; i < tr.length; i++) {
      if (i < period - 1) {
        atr.push(null);
      } else if (i === period - 1) {
        const sum = tr.slice(0, period).reduce((a, b) => a + b, 0);
        atr.push(sum / period);
      } else {
        const prevATR = atr[i - 1];
        atr.push((prevATR * (period - 1) + tr[i]) / period);
      }
    }

    return atr;
  }

  async simulateAdvancedStrategy(strategy, priceSeries, indicators, startCapital, parameters, config) {
    const trades = [];
    let capital = startCapital;
    let position = 0; // Token amount
    let entryPrice = 0;
    let stopLossPrice = 0;
    let takeProfitPrice = 0;

    const positionSize = (capital * config.positionSizePercent) / 100;
    const startIndex = strategy === 'buy_and_hold' ? 0 : 50;

    for (let i = startIndex; i < priceSeries.length; i++) {
      const currentPrice = priceSeries[i].price;
      const currentDate = priceSeries[i].date;

      let signal = null;

      // Strategy logic
      switch (strategy) {
        case 'moving_average_crossover':
          signal = this.checkMACrossover(indicators, i, parameters);
          break;
        case 'rsi_divergence':
          signal = this.checkRSIDivergence(indicators, i, parameters);
          break;
        case 'bollinger_bands':
          signal = this.checkBollingerBands(indicators, i, parameters);
          break;
        case 'macd_crossover':
          signal = this.checkMACDCrossover(indicators, i, parameters);
          break;
        case 'mean_reversion':
          signal = this.checkMeanReversion(indicators, i, parameters);
          break;
        case 'momentum':
          signal = this.checkMomentum(priceSeries, i, parameters);
          break;
        case 'buy_and_hold':
          if (position === 0) signal = 'BUY';
          break;
        case 'dollar_cost_average':
          if (i % 7 === 0) signal = 'BUY'; // Weekly DCA
          break;
      }

      // Execute trades
      if (signal === 'BUY' && position === 0) {
        const feePct = config.feeBps / 10000;
        const slippagePct = config.slippageBps / 10000;
        const maxAllocatable = capital / (1 + feePct + slippagePct);
        const tradeAmount = Math.min(positionSize, maxAllocatable);
        const feeAmount = (tradeAmount * config.feeBps) / 10000;
        const slippageAmount = (tradeAmount * config.slippageBps) / 10000;
        const totalCost = tradeAmount + feeAmount + slippageAmount;

        if (tradeAmount > 0 && totalCost <= capital + 1e-6) {
          position = tradeAmount / currentPrice;
          entryPrice = currentPrice;
          capital -= totalCost;

          if (config.enableRiskManagement) {
            stopLossPrice = entryPrice * (1 - config.stopLossPercent / 100);
            takeProfitPrice = entryPrice * (1 + config.takeProfitPercent / 100);
          }

          trades.push({
            type: 'BUY',
            date: currentDate,
            price: currentPrice,
            amount: position,
            value: positionSize,
            fee: feeAmount,
            slippage: slippageAmount,
            capital: capital,
            reason: signal
          });
        }
      } else if (signal === 'SELL' && position > 0) {
        const grossValue = position * currentPrice;
        const feeAmount = (grossValue * config.feeBps) / 10000;
        const slippageAmount = (grossValue * config.slippageBps) / 10000;
        const netValue = grossValue - feeAmount - slippageAmount;

        capital += netValue;

        trades.push({
          type: 'SELL',
          date: currentDate,
          price: currentPrice,
          amount: position,
          value: netValue,
          fee: feeAmount,
          slippage: slippageAmount,
          capital: capital,
          pnl: netValue - (position * entryPrice),
          pnlPercent: ((netValue - (position * entryPrice)) / (position * entryPrice)) * 100,
          reason: signal
        });

        position = 0;
        entryPrice = 0;
        stopLossPrice = 0;
        takeProfitPrice = 0;
      }

      // Risk management checks
      if (config.enableRiskManagement && position > 0) {
        if (currentPrice <= stopLossPrice) {
          // Stop loss triggered
          const grossValue = position * currentPrice;
          const feeAmount = (grossValue * config.feeBps) / 10000;
          const netValue = grossValue - feeAmount;

          capital += netValue;

          trades.push({
            type: 'SELL',
            date: currentDate,
            price: currentPrice,
            amount: position,
            value: netValue,
            fee: feeAmount,
            slippage: 0,
            capital: capital,
            pnl: netValue - (position * entryPrice),
            pnlPercent: ((netValue - (position * entryPrice)) / (position * entryPrice)) * 100,
            reason: 'STOP_LOSS'
          });

          position = 0;
          entryPrice = 0;
          stopLossPrice = 0;
          takeProfitPrice = 0;
        } else if (currentPrice >= takeProfitPrice) {
          // Take profit triggered
          const grossValue = position * currentPrice;
          const feeAmount = (grossValue * config.feeBps) / 10000;
          const netValue = grossValue - feeAmount;

          capital += netValue;

          trades.push({
            type: 'SELL',
            date: currentDate,
            price: currentPrice,
            amount: position,
            value: netValue,
            fee: feeAmount,
            slippage: 0,
            capital: capital,
            pnl: netValue - (position * entryPrice),
            pnlPercent: ((netValue - (position * entryPrice)) / (position * entryPrice)) * 100,
            reason: 'TAKE_PROFIT'
          });

          position = 0;
          entryPrice = 0;
          stopLossPrice = 0;
          takeProfitPrice = 0;
        }
      }
    }

    // Close any remaining position at the end
    if (position > 0) {
      const currentPrice = priceSeries[priceSeries.length - 1].price;
      const currentDate = priceSeries[priceSeries.length - 1].date;
      const grossValue = position * currentPrice;
      const feeAmount = (grossValue * config.feeBps) / 10000;
      const netValue = grossValue - feeAmount;

      capital += netValue;

      trades.push({
        type: 'SELL',
        date: currentDate,
        price: currentPrice,
        amount: position,
        value: netValue,
        fee: feeAmount,
        slippage: 0,
        capital: capital,
        pnl: netValue - (position * entryPrice),
        pnlPercent: ((netValue - (position * entryPrice)) / (position * entryPrice)) * 100,
        reason: 'END_OF_PERIOD'
      });
    }

    return trades;
  }

  checkMACrossover(indicators, index, params) {
    const fastPeriod = params.fastPeriod || 20;
    const slowPeriod = params.slowPeriod || 50;

    const fastMA = indicators[`sma_${fastPeriod}`][index];
    const slowMA = indicators[`sma_${slowPeriod}`][index];
    const prevFastMA = indicators[`sma_${fastPeriod}`][index - 1];
    const prevSlowMA = indicators[`sma_${slowPeriod}`][index - 1];

    if (!fastMA || !slowMA || !prevFastMA || !prevSlowMA) return null;

    if (prevFastMA <= prevSlowMA && fastMA > slowMA) return 'BUY';
    if (prevFastMA >= prevSlowMA && fastMA < slowMA) return 'SELL';

    return null;
  }

  checkRSIDivergence(indicators, index, params) {
    const rsi = indicators.rsi_14[index];
    const prevRSI = indicators.rsi_14[index - 1];
    const oversold = params.oversold || 30;
    const overbought = params.overbought || 70;

    if (!rsi || !prevRSI) return null;

    if (prevRSI >= overbought && rsi < overbought) return 'SELL';
    if (prevRSI <= oversold && rsi > oversold) return 'BUY';

    return null;
  }

  checkBollingerBands(indicators, index, params) {
    const upper = indicators.bb_upper[index];
    const lower = indicators.bb_lower[index];
    const price = indicators.bb_middle[index]; // Using middle as proxy for price

    if (!upper || !lower || !price) return null;

    const position = (price - lower) / (upper - lower);

    if (position < 0.1) return 'BUY'; // Near lower band
    if (position > 0.9) return 'SELL'; // Near upper band

    return null;
  }

  checkMACDCrossover(indicators, index, params) {
    const macd = indicators.macd[index];
    const signal = indicators.macd_signal[index];
    const prevMACD = indicators.macd[index - 1];
    const prevSignal = indicators.macd_signal[index - 1];

    if (!macd || !signal || !prevMACD || !prevSignal) return null;

    if (prevMACD <= prevSignal && macd > signal) return 'BUY';
    if (prevMACD >= prevSignal && macd < signal) return 'SELL';

    return null;
  }

  checkMeanReversion(indicators, index, params) {
    const sma = indicators.sma_20[index];
    const price = indicators.sma_20[index]; // Proxy
    const deviation = params.deviation || 0.05;

    if (!sma || !price) return null;

    const percentDiff = (price - sma) / sma;

    if (percentDiff < -deviation) return 'BUY';
    if (percentDiff > deviation) return 'SELL';

    return null;
  }

  checkMomentum(priceSeries, index, params) {
    const lookback = params.lookback || 10;
    const threshold = params.threshold || 0.05;

    if (index < lookback) return null;

    const currentPrice = priceSeries[index].price;
    const pastPrice = priceSeries[index - lookback].price;

    const momentum = (currentPrice - pastPrice) / pastPrice;

    if (momentum > threshold) return 'BUY';
    if (momentum < -threshold) return 'SELL';

    return null;
  }

  calculateAdvancedAnalytics(priceSeries, trades, startCapital, feeBps) {
    const buyTrades = trades.filter(t => t.type === 'BUY');
    const sellTrades = trades.filter(t => t.type === 'SELL');
    const winningTrades = sellTrades.filter(t => t.pnl > 0);
    const losingTrades = sellTrades.filter(t => t.pnl < 0);

    const totalTrades = sellTrades.length;
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const totalPnl = sellTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalReturn = (totalPnl / startCapital) * 100;

    const avgWin = winningTrades.length > 0 ?
      winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ?
      losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;

    const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : 0;

    const totalFees = trades.reduce((sum, t) => sum + (t.fee || 0), 0);
    const maxCapital = Math.max(...trades.map(t => t.capital));
    const finalCapital = trades.length > 0 ? trades[trades.length - 1].capital : startCapital;

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      totalPnl,
      totalReturn: Math.round(totalReturn * 100) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      maxCapital: Math.round(maxCapital * 100) / 100,
      finalCapital: Math.round(finalCapital * 100) / 100,
      buyAndHoldReturn: this.calculateBuyAndHoldReturn(priceSeries, startCapital, feeBps)
    };
  }

  calculateBuyAndHoldReturn(priceSeries, startCapital, feeBps) {
    if (priceSeries.length < 2) return 0;

    const startPrice = priceSeries[0].price;
    const endPrice = priceSeries[priceSeries.length - 1].price;
    const priceReturn = (endPrice - startPrice) / startPrice;

    // Account for one buy and one sell fee
    const feeImpact = (feeBps * 2) / 10000;

    return ((priceReturn - feeImpact) * 100);
  }

  calculateRiskMetrics(priceSeries, trades, analytics) {
    const capitalSeries = trades.map(t => t.capital);
    const returns = [];

    for (let i = 1; i < capitalSeries.length; i++) {
      const dailyReturn = (capitalSeries[i] - capitalSeries[i - 1]) / capitalSeries[i - 1];
      returns.push(dailyReturn);
    }

    // Maximum Drawdown
    let maxDrawdown = 0;
    let peak = capitalSeries[0] || analytics.finalCapital;

    for (const capital of capitalSeries) {
      if (capital > peak) peak = capital;
      const drawdown = (peak - capital) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Sharpe Ratio (assuming 0% risk-free rate)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdReturn = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdReturn > 0 ? avgReturn / stdReturn : 0;

    // Sortino Ratio (downside deviation)
    const negativeReturns = returns.filter(r => r < 0);
    const downsideStd = negativeReturns.length > 0 ?
      Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length) : 0;
    const sortinoRatio = downsideStd > 0 ? avgReturn / downsideStd : 0;

    // Calmar Ratio
    const calmarRatio = maxDrawdown > 0 ? avgReturn / maxDrawdown : 0;

    // Recovery Factor
    const recoveryFactor = maxDrawdown > 0 ? analytics.totalReturn / (maxDrawdown * 100) : 0;

    // Expectancy
    const winRate = analytics.winRate / 100;
    const avgWin = analytics.avgWin;
    const avgLoss = Math.abs(analytics.avgLoss);
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    return {
      maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      calmarRatio: Math.round(calmarRatio * 100) / 100,
      recoveryFactor: Math.round(recoveryFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      volatility: stdReturn ? Math.round(stdReturn * 10000) / 100 : 0
    };
  }

  generateChartData(priceSeries, trades, analytics) {
    // Generate equity curve
    const equityCurve = [];
    let capital = analytics.startCapital;

    equityCurve.push({
      date: priceSeries[0].date,
      capital: capital,
      price: priceSeries[0].price
    });

    for (const trade of trades) {
      capital = trade.capital;
      equityCurve.push({
        date: trade.date,
        capital: Math.round(capital * 100) / 100,
        price: trade.price
      });
    }

    return {
      equityCurve,
      drawdownPeriods: this.calculateDrawdownPeriods(equityCurve),
      tradeMarkers: trades.map(t => ({
        date: t.date,
        type: t.type,
        price: t.price,
        pnl: t.pnl || 0
      }))
    };
  }

  calculateDrawdownPeriods(equityCurve) {
    const drawdowns = [];
    let peak = equityCurve[0].capital;
    let currentDrawdown = 0;
    let drawdownStart = null;

    for (let i = 0; i < equityCurve.length; i++) {
      const capital = equityCurve[i].capital;

      if (capital > peak) {
        if (currentDrawdown > 0) {
          drawdowns.push({
            start: drawdownStart,
            end: equityCurve[i - 1].date,
            maxDrawdown: currentDrawdown,
            recovery: equityCurve[i].date
          });
        }
        peak = capital;
        currentDrawdown = 0;
        drawdownStart = null;
      } else {
        const drawdown = (peak - capital) / peak;
        if (drawdown > currentDrawdown) {
          currentDrawdown = drawdown;
          if (!drawdownStart) {
            drawdownStart = equityCurve[i].date;
          }
        }
      }
    }

    return drawdowns;
  }

  async runPortfolioBacktest({ tokens, strategy, startCapital, startDate, endDate, parameters = {} }) {
    // Multi-token portfolio backtesting
    const results = [];

    for (const token of tokens) {
      const result = await this.runBacktest({
        tokenMint: token.mint,
        strategy,
        startCapital: startCapital / tokens.length,
        startDate,
        endDate,
        parameters
      });

      if (result.success) {
        results.push({
          token: token.symbol,
          analytics: result.analytics,
          riskMetrics: result.riskMetrics
        });
      }
    }

    // Aggregate portfolio results
    const totalReturn = results.reduce((sum, r) => sum + r.analytics.totalReturn, 0) / results.length;
    const avgSharpe = results.reduce((sum, r) => sum + r.riskMetrics.sharpeRatio, 0) / results.length;

    return {
      portfolioReturn: Math.round(totalReturn * 100) / 100,
      avgSharpeRatio: Math.round(avgSharpe * 100) / 100,
      tokenResults: results
    };
  }

  simulateStrategy(strategy, priceSeries, startCapital, parameters, feeBps) {
    switch (strategy) {
      case 'buy_and_hold':
        return this.simulateBuyAndHold(priceSeries, startCapital, feeBps);
      case 'moving_average_crossover':
        return this.simulateMovingAverageCrossover(priceSeries, startCapital, parameters, feeBps);
      case 'dollar_cost_average':
        return this.simulateDollarCostAverage(priceSeries, startCapital, parameters, feeBps);
      default:
        return [];
    }
  }

  simulateBuyAndHold(priceSeries, capital, feeBps) {
    if (priceSeries.length === 0) return [];

    const entry = priceSeries[0];
    const fee = (capital * feeBps) / 10000;
    const investable = capital - fee;
    const units = investable / entry.price;

    return [
      {
        timestamp: entry.date,
        type: 'BUY',
        price: entry.price,
        units: Number(units.toFixed(6)),
        cost: Number(capital.toFixed(2)),
        fee: Number(fee.toFixed(2)),
        remainingCash: 0
      }
    ];
  }

  simulateMovingAverageCrossover(priceSeries, capital, parameters = {}, feeBps) {
    const fast = parameters.fastDays || 10;
    const slow = parameters.slowDays || 30;
    const trades = [];
    let cash = capital;
    let position = 0;
    const history = [];

    for (let index = 0; index < priceSeries.length; index += 1) {
      const window = priceSeries.slice(0, index + 1);
      const fastAvg = this.simpleMovingAverage(window, fast);
      const slowAvg = this.simpleMovingAverage(window, slow);
      const pricePoint = priceSeries[index];
      const signal = fastAvg > slowAvg ? 'BUY' : 'SELL';

      history.push({ date: pricePoint.date, price: pricePoint.price, fastAvg, slowAvg });

      if (index === 0) {
        continue;
      }

      const previousPoint = history[index - 1];
      if (previousPoint.fastAvg <= previousPoint.slowAvg && signal === 'BUY' && cash > 0) {
        const fee = (cash * feeBps) / 10000;
        const investable = cash - fee;
        const units = investable / pricePoint.price;
        position += units;
        cash = 0;
        trades.push({
          timestamp: pricePoint.date,
          type: 'BUY',
          price: pricePoint.price,
          units: Number(units.toFixed(6)),
          cost: Number((investable + fee).toFixed(2)),
          fee: Number(fee.toFixed(2)),
          remainingCash: Number(cash.toFixed(2))
        });
      }

      if (previousPoint.fastAvg >= previousPoint.slowAvg && signal === 'SELL' && position > 0) {
        const proceeds = position * pricePoint.price;
        const fee = (proceeds * feeBps) / 10000;
        const cashProceeds = proceeds - fee;
        trades.push({
          timestamp: pricePoint.date,
          type: 'SELL',
          price: pricePoint.price,
          units: Number(position.toFixed(6)),
          proceeds: Number(proceeds.toFixed(2)),
          fee: Number(fee.toFixed(2)),
          remainingCash: Number(cashProceeds.toFixed(2))
        });
        cash += cashProceeds;
        position = 0;
      }
    }

    const finalPrice = priceSeries[priceSeries.length - 1].price;
    if (position > 0) {
      const proceeds = position * finalPrice;
      const fee = (proceeds * feeBps) / 10000;
      const cashProceeds = proceeds - fee;
      trades.push({
        timestamp: priceSeries[priceSeries.length - 1].date,
        type: 'SELL',
        price: finalPrice,
        units: Number(position.toFixed(6)),
        proceeds: Number(proceeds.toFixed(2)),
        fee: Number(fee.toFixed(2)),
        remainingCash: Number(cashProceeds.toFixed(2))
      });
      cash += cashProceeds;
      position = 0;
    }

    if (cash > 0 && trades.length === 0) {
      const entry = priceSeries[0];
      const fee = (cash * feeBps) / 10000;
      const investable = cash - fee;
      const units = investable / entry.price;
      trades.push({
        timestamp: entry.date,
        type: 'BUY',
        price: entry.price,
        units: Number(units.toFixed(6)),
        cost: Number((investable + fee).toFixed(2)),
        fee: Number(fee.toFixed(2)),
        remainingCash: 0
      });
      const finalProceeds = units * finalPrice;
      const finalFee = (finalProceeds * feeBps) / 10000;
      trades.push({
        timestamp: priceSeries[priceSeries.length - 1].date,
        type: 'SELL',
        price: finalPrice,
        units: Number(units.toFixed(6)),
        proceeds: Number(finalProceeds.toFixed(2)),
        fee: Number(finalFee.toFixed(2)),
        remainingCash: Number((finalProceeds - finalFee).toFixed(2))
      });
    }

    return trades;
  }

  simulateDollarCostAverage(priceSeries, capital, parameters = {}, feeBps) {
    const intervalDays = parameters.intervalDays || 7;
    const allocation = parameters.allocationPerPeriod || capital / Math.max(1, Math.ceil(priceSeries.length / intervalDays));
    const trades = [];
    let cash = capital;
    let position = 0;

    for (let index = 0; index < priceSeries.length; index += 1) {
      if (index % intervalDays !== 0) {
        continue;
      }

      const pricePoint = priceSeries[index];
      if (cash <= 0) {
        break;
      }

      const amount = Math.min(allocation, cash);
      const fee = (amount * feeBps) / 10000;
      const investable = amount - fee;
      const units = investable / pricePoint.price;
      cash -= amount;
      position += units;

      trades.push({
        timestamp: pricePoint.date,
        type: 'BUY',
        price: pricePoint.price,
        units: Number(units.toFixed(6)),
        cost: Number(amount.toFixed(2)),
        fee: Number(fee.toFixed(2)),
        remainingCash: Number(cash.toFixed(2))
      });
    }

    const finalPrice = priceSeries[priceSeries.length - 1].price;
    if (position > 0) {
      const proceeds = position * finalPrice;
      const fee = (proceeds * feeBps) / 10000;
      const cashProceeds = proceeds - fee;
      trades.push({
        timestamp: priceSeries[priceSeries.length - 1].date,
        type: 'SELL',
        price: finalPrice,
        units: Number(position.toFixed(6)),
        proceeds: Number(proceeds.toFixed(2)),
        fee: Number(fee.toFixed(2)),
        remainingCash: Number(cashProceeds.toFixed(2))
      });
      cash += cashProceeds;
    }

    return trades;
  }

  simpleMovingAverage(series, window) {
    if (series.length < window) return null;
    const windowSlice = series.slice(series.length - window);
    const sum = windowSlice.reduce((total, item) => total + item.price, 0);
    return sum / windowSlice.length;
  }

  calculateAnalytics(priceSeries, trades, startCapital, feeBps) {
    const equityCurve = [];
    let cash = startCapital;
    let position = 0;
    let lastTrade = null;
    let tradeVolume = 0;
    let wins = 0;
    let losses = 0;
    let closedTrades = [];

    const tradeQueue = [...trades];
    const sortedTrades = tradeQueue.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    priceSeries.forEach(pricePoint => {
      while (sortedTrades.length > 0 && sortedTrades[0].timestamp === pricePoint.date) {
        const trade = sortedTrades.shift();
        if (trade.type === 'BUY') {
          const units = trade.units || 0;
          position += units;
          cash = trade.remainingCash;
          lastTrade = trade;
        }
        if (trade.type === 'SELL') {
          const proceeds = trade.proceeds || 0;
          const units = trade.units || 0;
          const entry = lastTrade;
          if (entry) {
            const pnl = proceeds - (entry.cost || 0);
            closedTrades.push({ ...trade, pnl: Number(pnl.toFixed(2)) });
            if (pnl >= 0) wins += 1;
            else losses += 1;
          }
          position = 0;
          cash = trade.remainingCash;
        }
      }
      const holdingValue = position * pricePoint.price;
      equityCurve.push({
        date: pricePoint.date,
        equity: Number((cash + holdingValue).toFixed(2)),
        cash: Number(cash.toFixed(2)),
        holdings: Number(holdingValue.toFixed(2)),
        price: pricePoint.price
      });
    });

    const finalEquity = equityCurve.length ? equityCurve[equityCurve.length - 1].equity : startCapital;
    const totalReturn = finalEquity / startCapital - 1;
    const durationYears = (priceSeries.length - 1) / 365;
    const cagr = durationYears > 0 ? Math.pow(1 + totalReturn, 1 / durationYears) - 1 : 0;
    const returns = equityCurve.map((point, index) => {
      if (index === 0) return 0;
      const prev = equityCurve[index - 1].equity;
      return prev > 0 ? (point.equity - prev) / prev : 0;
    }).slice(1);
    const volatility = returns.length > 1 ? this.standardDeviation(returns) * Math.sqrt(252) : 0;
    const sharpe = volatility > 0 ? (this.mean(returns) * 252) / volatility : 0;
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve.map(point => point.equity));

    const avgTradePnL = closedTrades.length > 0 ? closedTrades.reduce((sum, t) => sum + t.pnl, 0) / closedTrades.length : 0;

    return {
      finalEquity: Number(finalEquity.toFixed(2)),
      totalReturn: Number((totalReturn * 100).toFixed(2)),
      cagr: Number((cagr * 100).toFixed(2)),
      sharpeRatio: Number(sharpe.toFixed(2)),
      maxDrawdown: Number((maxDrawdown * 100).toFixed(2)),
      totalTrades: trades.length,
      completedTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? Number((wins / closedTrades.length * 100).toFixed(2)) : 0,
      averageTradePnl: Number(avgTradePnL.toFixed(2)),
      totalFees: Number(trades.reduce((sum, t) => sum + (t.fee || 0), 0).toFixed(2)),
      equityCurve,
      peakEquity: Number(Math.max(...equityCurve.map(p => p.equity), startCapital).toFixed(2)),
      worstDrawdownDate: this.getWorstDrawdownDate(equityCurve),
    };
  }

  mean(array) {
    if (!array.length) return 0;
    return array.reduce((sum, value) => sum + value, 0) / array.length;
  }

  standardDeviation(array) {
    if (!array.length) return 0;
    const meanValue = this.mean(array);
    const variance = array.reduce((sum, value) => sum + Math.pow(value - meanValue, 2), 0) / array.length;
    return Math.sqrt(variance);
  }

  calculateMaxDrawdown(equitySeries) {
    let peak = -Infinity;
    let maxDrawdown = 0;

    equitySeries.forEach(value => {
      if (value > peak) peak = value;
      const drawdown = peak > 0 ? (peak - value) / peak : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    return maxDrawdown;
  }

  getWorstDrawdownDate(equityCurve) {
    let peak = -Infinity;
    let worstDate = null;
    let maxDrawdown = 0;

    equityCurve.forEach(point => {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const drawdown = peak > 0 ? (peak - point.equity) / peak : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        worstDate = point.date;
      }
    });

    return worstDate;
  }

  getSupportedStrategies() {
    return this.supportedStrategies;
  }
}

module.exports = new AdvancedBacktestingService();