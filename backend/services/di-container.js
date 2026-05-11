class DIContainer {
  constructor() {
    this.services = new Map();
  }

  register(name, service) {
    this.services.set(name, service);
  }

  get(name) {
    return this.services.get(name);
  }

  has(name) {
    return this.services.has(name);
  }
}

// Import all services
const advancedOrdersService = require('./advanced-orders.service');
const liquidityPoolService = require('./liquidity-pool.service');
const limitOrderBookService = require('./limit-order-book.service');
const { PnLDashboardService, PerformanceAttributionService, TokenAttributionService } = require('./pnl-dashboard.service');
const { RiskHeatmapService, CorrelationAnalysisService } = require('./risk-heatmap.service');
const { PredictiveAlertService, AnomalyDetectionService } = require('./predictive-alerts.service');
const { SentimentAnalysisService, SocialSignalService } = require('./sentiment-analysis.service');
const crossChainBridgeService = require('./cross-chain-bridge.service');
const jitoBundleService = require('./jito-bundle.service');
const advancedCacheService = require('./advanced-cache.service');
const tradeHistoryAggregationService = require('./trade-history-aggregation.service');

// Register all services
const container = new DIContainer();

container.register('advancedOrdersService', advancedOrdersService);
container.register('liquidityPoolService', liquidityPoolService);
container.register('limitOrderBookService', limitOrderBookService);
container.register('pnlDashboardService', PnLDashboardService);
container.register('performanceAttributionService', PerformanceAttributionService);
container.register('tokenAttributionService', TokenAttributionService);
container.register('riskHeatmapService', RiskHeatmapService);
container.register('correlationAnalysisService', CorrelationAnalysisService);
container.register('predictiveAlertService', PredictiveAlertService);
container.register('anomalyDetectionService', AnomalyDetectionService);
container.register('sentimentAnalysisService', SentimentAnalysisService);
container.register('socialSignalService', SocialSignalService);
container.register('crossChainBridgeService', crossChainBridgeService);
container.register('jitoBundleService', jitoBundleService);
container.register('advancedCacheService', advancedCacheService);
container.register('tradeHistoryAggregationService', tradeHistoryAggregationService);

module.exports = container;
