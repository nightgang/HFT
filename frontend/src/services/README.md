# Frontend Services Documentation

Dokumentasi lengkap untuk semua service layer di frontend aplikasi HFT.

## Overview

Struktur `frontend/src/services/` menyediakan abstraksi HTTP client dan berbagai service modules yang menangani komunikasi dengan backend API. Setiap service diorganisir berdasarkan domain fungsionalitas.

## Base API Client

### `api.js`

Base HTTP client yang menangani semua request HTTP ke backend.

**Features:**
- Automatic token management (localStorage)
- Authorization header injection
- Error handling dan response formatting
- Support untuk GET, POST, PUT, PATCH, DELETE methods

**Usage:**
```javascript
import api from './services/api';

// GET request
const data = await api.get('/endpoint');

// POST request
const result = await api.post('/endpoint', { data: 'value' });

// PUT request
const updated = await api.put('/endpoint', { updates });

// DELETE request
await api.delete('/endpoint');
```

## Core Services

### `auth.service.js` - Authentication
Menangani registrasi, login, logout, dan manajemen session user.

**Methods:**
- `register(username, email, password, firstName, lastName, phone)`
- `login(identifier, password)`
- `logout()`
- `getProfile()`
- `updateProfile(updates)`
- `changePassword(currentPassword, newPassword)`
- `isAuthenticated()`
- `getToken()`

### `user.service.js` - User Management
Menangani profil user dan preferensi.

**Methods:**
- `getAllUsers(limit, offset)` - Admin only
- `getUserById(userId)`
- `getCurrentProfile()`
- `updateProfile(updates)`
- `updatePreferences(preferences)`
- `getPreferences()`
- `deleteAccount(password)`
- `requestPasswordReset(email)`
- `resetPassword(token, newPassword)`

### `wallet.service.js` - Wallet Management
Menangani operasi dompet dan manajemen asset.

**Methods:**
- `getAllWallets(filters)`
- `getWalletById(walletId)`
- `createWallet(name, description, walletType)`
- `importWallet(name, privateKey, description)`
- `connectWallet(publicKey, walletType)`
- `updateWallet(walletId, updates)`
- `deleteWallet(walletId)`
- `getWalletBalance(walletId)`
- `getWalletHistory(walletId, limit, offset)`
- `setActiveWallet(walletId)`
- `getWalletDetails(walletId)`

## Trading Services

### `trading.service.js` - Trading Operations
Menangani operasi trading dan market data.

**Methods:**
- `createTrade(tradeData)`
- `getAllTrades(filters)`
- `getTradeById(tradeId)`
- `cancelTrade(tradeId)`
- `updateTrade(tradeId, updates)`
- `executeTrade(tradeId)`
- `getMarketData(tokenMint)`
- `getTWAP(tokenMint, timewindow)`
- `getExecutionAnalytics(tradeId)`
- `backtestStrategy(strategyData)`
- `getPortfolioCorrelation()`
- `createWallet(name, deterministic)`
- `getTradingStats()`

### `orders.service.js` - Order Management
Menangani pembuatan dan manajemen order.

**Methods:**
- `createOrder(orderData)`
- `getAllOrders(filters)`
- `getOrderById(orderId)`
- `cancelOrder(orderId)`
- `updateOrder(orderId, updates)`
- `getActiveOrders(walletId)`
- `getCompletedOrders(walletId, limit, offset)`
- `getOrderStats(walletId)`

### `advanced-orders.service.js` - Advanced Order Types
Menangani order types lanjutan (OCO, Conditional, Limit).

**Methods:**
- `createAdvancedOrder(orderData)`
- `getAllAdvancedOrders(filters)`
- `getAdvancedOrderById(orderId)`
- `cancelAdvancedOrder(orderId)`
- `updateAdvancedOrder(orderId, updates)`
- `getOCOOrders()`
- `getConditionalOrders()`
- `getLimitOrders()`
- `getStatistics()`

### `trading-strategies.service.js` - Strategy Management
Menangani pembuatan dan manajemen strategi trading.

**Methods:**
- `getAllStrategies(filters)`
- `getStrategyById(strategyId)`
- `createStrategy(strategyData)`
- `updateStrategy(strategyId, updates)`
- `deleteStrategy(strategyId)`
- `activateStrategy(strategyId)`
- `deactivateStrategy(strategyId)`
- `getStrategyPerformance(strategyId)`
- `backtestStrategy(strategyData)`
- `cloneStrategy(strategyId)`

## Bot Services

### `sniper.service.js` - Token Sniping
Menangani token sniping functionality.

**Methods:**
- `getStatus()`
- `start(config)`
- `stop()`
- `getStats()`
- `getDetectedTokens(limit)`
- `executeSnipe(tokenMint)`
- `getHistory(limit, offset)`
- `configure(config)`

### `arbitrage.service.js` - Arbitrage Trading
Menangani peluang arbitrage dan bot execution.

**Methods:**
- `getOpportunities(filters)`
- `executeTrade(opportunityId)`
- `getHistory(limit, offset)`
- `getStats()`
- `configure(config)`
- `getStatus()`
- `start(config)`
- `stop()`

### `smart-money.service.js` - Smart Money Tracking
Menangani tracking wallet smart money dan sinyal.

**Methods:**
- `getTrackedWallets(filters)`
- `getWalletDetails(walletAddress)`
- `getWalletTransactions(walletAddress, limit, offset)`
- `getSmartMoneySignals()`
- `getSmartWalletHoldings(tokenMint)`
- `followWallet(walletAddress)`
- `unfollowWallet(walletAddress)`
- `getFollowedWallets()`
- `getStatistics()`

### `jito-bundle.service.js` - Jito MEV Bundles
Menangani Jito bundle operations.

**Methods:**
- `createBundle(bundleData)`
- `getAllBundles(filters)`
- `getBundleById(bundleId)`
- `getBundleStatus(bundleId)`
- `cancelBundle(bundleId)`
- `getStats()`
- `getMevStats()`
- `simulateBundle(bundleData)`

## Analytics & Portfolio Services

### `portfolio.service.js` - Portfolio Tracking
Menangani tracking dan manajemen portfolio.

**Methods:**
- `getPortfolioOverview()`
- `getHoldings(filters)`
- `getAllocation()`
- `getPerformance(timeframe)`
- `getHistory(limit, offset)`
- `rebalancePortfolio(targetAllocation)`
- `getRiskMetrics()`
- `exportPortfolio(format)`

### `analytics.service.js` - Performance Analytics
Menangani analytics dan metrik performance.

**Methods:**
- `getPerformanceAnalytics(timeframe)`
- `getTradeAnalytics(filters)`
- `getReturnsAnalysis(timeframe)`
- `getDrawdownAnalysis()`
- `getSharpeRatio(timeframe)`
- `getWinRate()`
- `getPerformanceAttribution()`
- `exportAnalyticsReport(format, timeframe)`

### `trade-history.service.js` - Trade History
Menangani riwayat trading dan statistik.

**Methods:**
- `getAllTrades(filters)`
- `getTradeById(tradeId)`
- `getStatistics(timeframe)`
- `exportHistory(format, filters)`
- `getTradingPairs(limit)`
- `getProfitLossByPair()`
- `getTaxReport(year)`

### `pnl-dashboard.service.js` - P&L Dashboard
Menangani data P&L untuk dashboard.

**Methods:**
- `getOverallPnL()`
- `getPnLByTimeframe(timeframe)`
- `getPnLByWallet(walletId)`
- `getPnLByToken(tokenMint)`
- `getChartData(timeframe)`
- `getRealizedPnL()`
- `getUnrealizedPnL()`
- `getDailyBreakdown(date)`

## Market Analysis Services

### `market-screener.service.js` - Market Screening
Menangani screening token dan market data.

**Methods:**
- `screenTokens(filters)`
- `getTokenDetails(tokenMint)`
- `getTrendingTokens(limit)`
- `getTopGainers(timeframe, limit)`
- `getTopLosers(timeframe, limit)`
- `saveWatchlist(name, tokens)`
- `getWatchlists()`
- `getChartData(tokenMint, timeframe, limit)`

### `sentiment-analysis.service.js` - Sentiment Analysis
Menangani analisis sentimen pasar.

**Methods:**
- `getMarketSentiment()`
- `getTokenSentiment(tokenMint)`
- `getSocialSignals(tokenMint)`
- `getInfluencerSentiment(tokenMint)`
- `getCommunitySentiment(tokenMint)`
- `getSentimentTrends(tokenMint, timeframe)`
- `getTrendingTopics(limit)`
- `analyzeTextSentiment(text)`

### `risk-heatmap.service.js` - Risk Assessment
Menangani penilaian risiko dan visualisasi.

**Methods:**
- `getPortfolioRiskHeatmap()`
- `getTokenRiskHeatmap()`
- `getTokenRisk(tokenMint)`
- `getCorrelationHeatmap()`
- `getVolatility(tokenMint)`
- `getValueAtRisk(timeframe)`
- `getConditionalValueAtRisk(timeframe)`
- `getRiskMetrics()`

### `predictive-alerts.service.js` - Predictive Alerts
Menangani alert prediktif dan anomaly detection.

**Methods:**
- `createPredictiveAlert(alertData)`
- `getAllAlerts(filters)`
- `getAlertById(alertId)`
- `getAnomalies(filters)`
- `getPricePredictions(tokenMint, timeframe)`
- `getTrendPredictions(tokenMint)`
- `deleteAlert(alertId)`
- `getPredictionAccuracy()`

## Alert & Notification Services

### `alerts.service.js` - Trading Alerts
Menangani alert trading dan notifikasi.

**Methods:**
- `createAlert(alertData)`
- `getAllAlerts(filters)`
- `getAlertById(alertId)`
- `updateAlert(alertId, updates)`
- `deleteAlert(alertId)`
- `enableAlert(alertId)`
- `disableAlert(alertId)`
- `getAlertHistory(alertId, limit, offset)`
- `getAlertStats()`

### `notifications.service.js` - Notifications
Menangani notifikasi user.

**Methods:**
- `getAllNotifications(limit, offset)`
- `getUnreadCount()`
- `markAsRead(notificationId)`
- `markAllAsRead()`
- `deleteNotification(notificationId)`
- `deleteAllNotifications()`
- `getPreferences()`
- `updatePreferences(preferences)`
- `sendTestNotification()`

## DEX & Cross-Chain Services

### `liquidity-pool.service.js` - Liquidity Pools
Menangani operasi liquidity pool.

**Methods:**
- `getAllPools(filters)`
- `getPoolDetails(poolId)`
- `getPoolStats(poolId)`
- `addLiquidity(poolId, liquidityData)`
- `removeLiquidity(poolId, liquidityData)`
- `getLiquidityPositions(walletId)`
- `getPoolHistory(poolId, limit, offset)`
- `getYieldOpportunities()`

### `cross-chain-bridge.service.js` - Cross-Chain Bridge
Menangani operasi cross-chain bridging.

**Methods:**
- `getSupportedChains()`
- `getSupportedTokens()`
- `getBridgeRoutes(tokenMint, fromChain, toChain)`
- `initiateBridge(bridgeData)`
- `getBridgeStatus(bridgeId)`
- `getBridgeHistory(limit, offset)`
- `getBridgeFees(tokenMint, fromChain, toChain, amount)`
- `getStatistics()`

## System & Monitoring Services

### `monitoring.service.js` - System Monitoring
Menangani monitoring sistem dan status.

**Methods:**
- `getSystemStatus()`
- `getHealthCheck()`
- `getActiveTrades()`
- `getConnectedBots()`
- `getPerformanceMetrics()`
- `getErrorLogs(limit, offset)`
- `getSystemLogs(limit, offset)`
- `getLiveFeed(limit)`
- `clearLogs()`

### `system.service.js` - System Configuration
Menangani konfigurasi sistem.

**Methods:**
- `getSystemConfig()`
- `getSystemStats()`
- `getVersionInfo()`
- `getAPIKeys()`
- `createAPIKey(name, permissions)`
- `deleteAPIKey(keyId)`
- `regenerateAPIKey(keyId)`
- `getWebhooks()`
- `createWebhook(webhookData)`
- `deleteWebhook(webhookId)`
- `testWebhook(webhookId)`

### `katana.service.js` - Katana Terminal
Menangani Katana CLI operations.

**Methods:**
- `getTerminalStatus()`
- `executeCommand(command)`
- `getCommandHistory(limit)`
- `getAvailableCommands()`
- `getTerminalLogs(limit)`
- `clearTerminal()`

### `ai.service.js` - AI Features
Menangani AI-powered features.

**Methods:**
- `getRecommendations()`
- `getTokenAnalysis(tokenMint)`
- `getPortfolioRecommendations()`
- `getMarketInsights()`
- `generateTradingSignal(tokenMint, timeframe)`
- `getPricePrediction(tokenMint, timeframe)`
- `getModelPerformance()`
- `chat(message)`

## Usage Examples

### Basic Authentication Flow

```javascript
import { authService } from './services';

// Register
const regResult = await authService.register(
  'username',
  'email@example.com',
  'password123'
);

// Login
const loginResult = await authService.login('username', 'password123');

// Get profile
const profile = await authService.getProfile();

// Logout
authService.logout();
```

### Trading Operations

```javascript
import { tradingService, ordersService, walletService } from './services';

// Get wallets
const wallets = await walletService.getAllWallets();

// Get market data
const marketData = await tradingService.getMarketData('tokenMint');

// Create order
const order = await ordersService.createOrder({
  walletId: 'wallet-id',
  tokenMint: 'token-mint',
  amount: 100,
  price: 0.5,
  type: 'limit'
});

// Get active orders
const active = await ordersService.getActiveOrders('wallet-id');
```

### Portfolio Analytics

```javascript
import { portfolioService, analyticsService, pnlDashboardService } from './services';

// Get portfolio overview
const portfolio = await portfolioService.getPortfolioOverview();

// Get performance analytics
const perf = await analyticsService.getPerformanceAnalytics('1d');

// Get P&L data
const pnl = await pnlDashboardService.getOverallPnL();

// Get risk metrics
const risk = await portfolioService.getRiskMetrics();
```

### Smart Trading Features

```javascript
import { 
  sniperService,
  arbitrageService,
  smartMoneyService,
  predictiveAlertsService
} from './services';

// Start sniper
await sniperService.start({ tolerance: 5, slippage: 2 });

// Get arbitrage opportunities
const opps = await arbitrageService.getOpportunities({ minProfit: 2 });

// Get smart money signals
const signals = await smartMoneyService.getSmartMoneySignals();

// Get predictive alerts
const alerts = await predictiveAlertsService.getAllAlerts();
```

## Error Handling

Semua service methods menggunakan try-catch dan akan throw error jika request gagal:

```javascript
try {
  const data = await service.method();
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

## Environment Configuration

Untuk mengkonfigurasi base API URL, set environment variable:

```
VITE_API_URL=http://api.example.com/api
```

Default adalah `http://localhost:3000/api`

## Structure

```
frontend/src/services/
├── api.js                          # Base HTTP client
├── index.js                        # Central export
├── auth.service.js                 # Authentication
├── user.service.js                 # User management
├── wallet.service.js               # Wallet operations
├── trading.service.js              # Trading operations
├── orders.service.js               # Order management
├── advanced-orders.service.js      # Advanced order types
├── trading-strategies.service.js   # Strategy management
├── alerts.service.js               # Trading alerts
├── notifications.service.js        # User notifications
├── portfolio.service.js            # Portfolio tracking
├── analytics.service.js            # Performance analytics
├── trade-history.service.js        # Trade history
├── pnl-dashboard.service.js        # P&L dashboard
├── market-screener.service.js      # Market screening
├── sentiment-analysis.service.js   # Sentiment analysis
├── risk-heatmap.service.js         # Risk assessment
├── predictive-alerts.service.js    # Predictive alerts
├── sniper.service.js               # Token sniping
├── arbitrage.service.js            # Arbitrage trading
├── smart-money.service.js          # Smart money tracking
├── jito-bundle.service.js          # Jito bundles
├── liquidity-pool.service.js       # Liquidity pools
├── cross-chain-bridge.service.js   # Cross-chain bridge
├── monitoring.service.js           # System monitoring
├── system.service.js               # System config
├── katana.service.js               # Katana CLI
└── ai.service.js                   # AI features
```

## Best Practices

1. **Always handle errors** - Wrap service calls dalam try-catch
2. **Use filters** - Leverage filter parameters untuk query yang lebih efisien
3. **Cache data** - Consider caching frequently accessed data di component state atau context
4. **Batch requests** - Minimize API calls dengan batching related requests
5. **Token management** - Service automatically manages auth tokens
6. **Loading states** - Implement loading indicators saat menunggu response
7. **Error messages** - Display meaningful error messages kepada user

## Contributing

Ketika menambahkan service baru:
1. Create file baru dengan naming convention `feature.service.js`
2. Extend class dan export instance default
3. Add to `index.js` untuk centralized export
4. Update dokumentasi ini
