module.exports = {
  TradeHistoryAggregationModel: class TradeHistoryAggregationModel {
    constructor() {
      this.name = 'Trade History Aggregation'
      this.version = '1.0.0'
      this.aggregationPeriods = [
        'daily',
        'weekly',
        'monthly',
        'custom_range'
      ]
    }
  }
}