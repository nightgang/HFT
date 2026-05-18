jest.mock('../routes/sniperRoutes', () => require('express').Router());
jest.mock('../routes/tradingRoutes', () => require('express').Router());
jest.mock('../routes/smartMoneyRoutes', () => require('express').Router());
jest.mock('../routes/arbitrageRoutes', () => require('express').Router());
jest.mock('../routes/katanaRoutes', () => require('express').Router());
jest.mock('../routes/systemRoutes', () => require('express').Router());
jest.mock('../routes/aiRoutes', () => require('express').Router());
jest.mock('../routes/wallet.routes', () => require('express').Router());
jest.mock('../routes/user.routes', () => require('express').Router());
jest.mock('../routes/jito-bundle-routes', () => require('express').Router());
jest.mock('../routes/advanced-features.routes', () => require('express').Router());
jest.mock('../routes/trading-strategies.routes', () => require('express').Router());
jest.mock('../routes/alerts.routes', () => require('express').Router());
jest.mock('../routes/notifications.routes', () => require('express').Router());

const { getVersionedPath, registerRoutes } = require('../routes/index');

describe('API route versioning helper', () => {
  it('should generate /api/v1 for /api', () => {
    expect(getVersionedPath('/api')).toBe('/api/v1');
  });

  it('should generate /api/v1/trading for /api/trading', () => {
    expect(getVersionedPath('/api/trading')).toBe('/api/v1/trading');
  });

  it('should generate /api/v1/users for /api/users', () => {
    expect(getVersionedPath('/api/users')).toBe('/api/v1/users');
  });

  it('should register legacy and versioned route paths', () => {
    const app = {
      use: jest.fn()
    };

    registerRoutes(app);

    expect(app.use).toHaveBeenCalledWith('/api/trading', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/api/v1/trading', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/api/users', expect.any(Object));
    expect(app.use).toHaveBeenCalledWith('/api/v1/users', expect.any(Object));
  });
});
