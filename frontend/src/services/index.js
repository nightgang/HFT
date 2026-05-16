/**
 * Central index for all services
 * Exports all service modules for easy access
 */

// Core services
export { default as api } from './api';
export { default as authService } from './auth.service';
export { default as userService } from './user.service';

// Trading services
export { default as tradingService } from './trading.service';
export { default as walletService } from './wallet.service';
export { default as ordersService } from './orders.service';
export { default as advancedOrdersService } from './advanced-orders.service';
export { default as tradingStrategiesService } from './trading-strategies.service';

// Bot services
export { default as sniperService } from './sniper.service';
export { default as arbitrageService } from './arbitrage.service';
export { default as smartMoneyService } from './smart-money.service';
export { default as jitoBundle } from './jito-bundle.service';

// Analytics and portfolio services
export { default as analyticsService } from './analytics.service';
export { default as portfolioService } from './portfolio.service';
export { default as tradeHistoryService } from './trade-history.service';
export { default as pnlDashboardService } from './pnl-dashboard.service';

// Market and analysis services
export { default as marketScreenerService } from './market-screener.service';
export { default as sentimentAnalysisService } from './sentiment-analysis.service';
export { default as predictiveAlertsService } from './predictive-alerts.service';
export { default as riskHeatmapService } from './risk-heatmap.service';

// Alert and notification services
export { default as alertsService } from './alerts.service';
export { default as notificationsService } from './notifications.service';

// Liquidity and DEX services
export { default as liquidityPoolService } from './liquidity-pool.service';
export { default as crossChainBridgeService } from './cross-chain-bridge.service';

// System and monitoring services
export { default as monitoringService } from './monitoring.service';
export { default as systemService } from './system.service';
export { default as katanaService } from './katana.service';
export { default as aiService } from './ai.service';

// Re-export all as a namespace
import * as auth from './auth.service';
import * as user from './user.service';
import * as trading from './trading.service';
import * as wallet from './wallet.service';
import * as orders from './orders.service';
import * as portfolio from './portfolio.service';
import * as analytics from './analytics.service';
import * as alerts from './alerts.service';
import * as notifications from './notifications.service';

export const services = {
  auth,
  user,
  trading,
  wallet,
  orders,
  portfolio,
  analytics,
  alerts,
  notifications,
};
