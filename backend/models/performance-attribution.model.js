module.exports = {
  PerformanceAttributionModel: class PerformanceAttributionModel {
    constructor() {
      this.name = 'Performance Attribution'
      this.version = '1.0.0'
      this.metrics = [
        'Strategy Contribution',
        'Asset Contribution',
        'Timing Contribution',
        'Volatility Contribution',
        'Max Drawdown Contribution'
      ]
    }
  }
}