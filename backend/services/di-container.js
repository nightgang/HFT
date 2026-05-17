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

const eventPoller = require('./eventPoller');
const realtimeStateService = require('./realtime-state.service');

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
// New trading strategy services
const { GridTradingService, DCAService, ScalpingBotService} = require('./trading-strategies.service');
const { ArbitrageService, RebalancingService, SLTPService } = require('./advanced-trading.service');
const { PositionCloningService, OptionsFuturesService } = require('./cloning-derivatives.service');
const KatanaEngine = require('./engines/katana.engine');

const katanaEngine = new KatanaEngine();

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
// New trading strategy services
container.register('gridTradingService', new GridTradingService());
container.register('dcaService', new DCAService());
container.register('scalpingBotService', new ScalpingBotService());
container.register('arbitrageService', new ArbitrageService());
container.register('rebalancingService', new RebalancingService());
container.register('slTPService', new SLTPService());
container.register('positionCloningService', new PositionCloningService());
container.register('optionsFuturesService', new OptionsFuturesService());
// Katana Engine — registered here and used by both server and katanaRoutes
container.register('katanaEngine', katanaEngine);
// Shared Realtime Data Layer — Single Source of Truth
container.register('realtimeStateService', realtimeStateService);

module.exports = container;
