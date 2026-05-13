const sniperRoutes = require('./sniperRoutes');
const tradingRoutes = require('./tradingRoutes');
const smartMoneyRoutes = require('./smartMoneyRoutes');
const arbitrageRoutes = require('./arbitrageRoutes');
const katanaRoutes = require('./katanaRoutes');
const systemRoutes = require('./systemRoutes');
const aiRoutes = require('./aiRoutes');
const walletRoutes = require('./wallet.routes');
const userRoutes = require('./user.routes');
const jitoBundleRoutes = require('./jito-bundle-routes');
const advancedFeaturesRoutes = require('./advanced-features.routes');
const tradingStrategiesRoutes = require('./trading-strategies.routes');
const alertsRoutes = require('./alerts.routes');
const notificationsRoutes = require('./notifications.routes');

const routeDefinitions = [
  { path: ['/api/trading', '/trading'], router: tradingRoutes },
  { path: ['/api/sniper', '/sniper'], router: sniperRoutes },
  { path: ['/api/smart-money', '/smart-money'], router: smartMoneyRoutes },
  { path: ['/api/arbitrage', '/arbitrage'], router: arbitrageRoutes },
  { path: ['/api/katana', '/katana'], router: katanaRoutes },
  { path: ['/api/system', '/system'], router: systemRoutes },
  { path: ['/api/ai', '/ai'], router: aiRoutes },
  { path: ['/api/jito-bundle', '/jito-bundle'], router: jitoBundleRoutes },
  { path: ['/api/trading-strategies', '/trading-strategies'], router: tradingStrategiesRoutes },
  { path: '/api/users', router: userRoutes },
  { path: '/api/wallets', router: walletRoutes },
  { path: '/api/alerts', router: alertsRoutes },
  { path: '/api/notifications', router: notificationsRoutes },
  { path: '/api', router: advancedFeaturesRoutes },
];

function registerRoutes(app) {
  routeDefinitions.forEach(({ path, router }) => app.use(path, router));

  // Legacy routes: preserve older frontend/CLI paths
  app.get('/sniper/status', (req, res) => res.redirect('/api/sniper/status'));
}

module.exports = registerRoutes;
