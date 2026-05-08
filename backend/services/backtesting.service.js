const logger = require('../utils/logger');
const cacheService = require('./cache.service');
const jupiterService = require('../integrations/jupiter.service');

class BacktestingService {
  constructor() {
    this.supportedStrategies = [
      'buy_and_hold',
      'moving_average_crossover',
      'dollar_cost_average'
    ];
  }

  async runBacktest({ tokenMint, strategy = 'buy_and_hold', startCapital = 10000, startDate, endDate, parameters = {}, feeBps = 25 }) {
    try {
      if (!tokenMint) {
        throw new Error('Token mint is required for backtesting');
      }

      if (!this.supportedStrategies.includes(strategy)) {
        throw new Error(`Unsupported strategy '${strategy}'. Supported strategies: ${this.supportedStrategies.join(', ')}`);
      }

      const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      const end = endDate ? new Date(endDate) : new Date();
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Invalid startDate or endDate');
      }
      if (end <= start) {
        throw new Error('End date must be after start date');
      }

      const cacheKey = `backtest:${tokenMint}:${strategy}:${start.toISOString().slice(0, 10)}:${end.toISOString().slice(0, 10)}:${JSON.stringify(parameters)}:${startCapital}:${feeBps}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('Backtest result retrieved from cache');
        return cached;
      }

      const priceSeries = await this.generateHistoricalPrices(tokenMint, start, end);
      const trades = this.simulateStrategy(strategy, priceSeries, startCapital, parameters, feeBps);
      const analytics = this.calculateAnalytics(priceSeries, trades, startCapital, feeBps);

      const result = {
        success: true,
        tokenMint,
        strategy,
        parameters,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        startCapital,
        feeBps,
        priceSeries,
        trades,
        analytics,
        generatedAt: Date.now()
      };

      await cacheService.set(cacheKey, result, 1800);
      return result;
    } catch (error) {
      logger.error('Backtesting error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateHistoricalPrices(tokenMint, startDate, endDate) {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const cacheKey = `historical_prices:${tokenMint}:${startDate.toISOString().slice(0, 10)}:${endDate.toISOString().slice(0, 10)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const priceResponse = await jupiterService.getTokenPrice(tokenMint);
    const basePrice = (priceResponse && priceResponse.price) ? priceResponse.price : 1;
    const prices = [];
    let price = basePrice;

    for (let i = 0; i < days; i += 1) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const drift = 0.0002;
      const volatility = 0.02;
      const randomChange = (Math.random() * 2 - 1) * volatility;
      const growth = 1 + drift + randomChange;
      price = Math.max(0.01, price * growth);

      prices.push({
        date: date.toISOString().slice(0, 10),
        price: Number(price.toFixed(6))
      });
    }

    await cacheService.set(cacheKey, prices, 3600);
    return prices;
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

module.exports = new BacktestingService();