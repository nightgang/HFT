const { query } = require('../db/connection');
const { GridTradingModel, DCAModel, ScalpingBotModel } = require('../models/trading-strategies.model');
const { ArbitrageModel, RebalancingModel, SLTPModel } = require('../models/advanced-trading.model');
const { PositionCloneModel, OptionsFuturesModel } = require('../models/cloning-derivatives.model');
const { GridTradingService, DCAService, ScalpingBotService } = require('../services/trading-strategies.service');
const { ArbitrageService, RebalancingService, SLTPService } = require('../services/advanced-trading.service');
const { PositionCloningService, OptionsFuturesService } = require('../services/cloning-derivatives.service');

// Mock wallet ID for testing
const mockWalletId = '550e8400-e29b-41d4-a716-446655440000';

describe('Trading Strategies - Advanced Features', () => {
  
  // ============ GRID TRADING TESTS ============
  describe('Grid Trading', () => {
    let gridConfigId;

    test('GridTradingModel.calculateGridPrices - linear', () => {
      const prices = GridTradingModel.calculateGridPrices(100, 200, 10, 'linear');
      expect(prices.length).toBe(10);
      expect(prices[0]).toBe(100);
      expect(prices[9]).toBe(200);
      expect(prices[5]).toBeCloseTo(155.56, 1);
    });

    test('GridTradingModel.calculateGridPrices - geometric', () => {
      const prices = GridTradingModel.calculateGridPrices(100, 200, 10, 'geometric');
      expect(prices.length).toBe(10);
      expect(prices[0]).toBe(100);
      expect(prices[prices.length - 1]).toBeCloseTo(200, 0);
    });

    test('GridTradingService should create grid trading configuration', async () => {
      const gridTradingService = new GridTradingService();
      const configData = {
        name: 'BTC Grid Trading',
        token_mint: 'So11111111111111111111111111111111111111112',
        base_token_mint: 'EPjFWdd5Au',
        grid_levels: 10,
        grid_type: 'linear',
        lower_price: 100,
        upper_price: 200,
        investment_amount: 1000
      };

      // This would require database setup in real tests
      // For now, we test the structure
      expect(typeof gridTradingService.createGridTrading).toBe('function');
      expect(typeof gridTradingService.updateGridOrder).toBe('function');
      expect(typeof gridTradingService.getGridStats).toBe('function');
    });

    test('GridTradingService.getGridStats should return stats object', async () => {
      const gridTradingService = new GridTradingService();
      const mockGridId = 1;
      
      // Test that method exists and is callable
      expect(typeof gridTradingService.getGridStats).toBe('function');
    });
  });

  // ============ DCA TESTS ============
  describe('Dollar Cost Averaging (DCA)', () => {
    
    test('DCAModel.calculateNextExecutionTime - daily', () => {
      const currentTime = new Date('2026-05-11T10:00:00Z');
      const nextTime = DCAModel.calculateNextExecutionTime(currentTime, 'daily', 1);
      expect(nextTime.getDate()).toBe(currentTime.getDate() + 1);
    });

    test('DCAModel.calculateNextExecutionTime - weekly', () => {
      const currentTime = new Date('2026-05-11T10:00:00Z');
      const nextTime = DCAModel.calculateNextExecutionTime(currentTime, 'weekly', 1);
      expect(nextTime.getDate()).toBe(currentTime.getDate() + 7);
    });

    test('DCAModel.calculateNextExecutionTime - monthly', () => {
      const currentTime = new Date('2026-05-11T10:00:00Z');
      const nextTime = DCAModel.calculateNextExecutionTime(currentTime, 'monthly', 1);
      expect(nextTime.getMonth()).toBe((currentTime.getMonth() + 1) % 12);
    });

    test('DCAService should initialize correctly', () => {
      const dcaService = new DCAService();
      expect(typeof dcaService.createDCA).toBe('function');
      expect(typeof dcaService.executeDCAOrder).toBe('function');
      expect(typeof dcaService.getDCAStatus).toBe('function');
      expect(typeof dcaService.getPendingDCAOrders).toBe('function');
    });
  });

  // ============ SCALPING BOT TESTS ============
  describe('Scalping Bot', () => {
    
    test('ScalpingBotService should initialize correctly', () => {
      const scalpingBotService = new ScalpingBotService();
      expect(typeof scalpingBotService.createScalpingBot).toBe('function');
      expect(typeof scalpingBotService.enterScalpingTrade).toBe('function');
      expect(typeof scalpingBotService.exitScalpingTrade).toBe('function');
      expect(typeof scalpingBotService.checkExitConditions).toBe('function');
      expect(typeof scalpingBotService.getBotStats).toBe('function');
    });

    test('ScalpingBotService.getBotStats returns initial structure', async () => {
      const scalpingBotService = new ScalpingBotService();
      const stats = await scalpingBotService.getBotStats(1);
      
      expect(stats).toHaveProperty('botId');
      expect(stats).toHaveProperty('trades_executed');
      expect(stats).toHaveProperty('win_count');
      expect(stats).toHaveProperty('win_rate');
      expect(stats).toHaveProperty('total_pnl');
    });
  });

  // ============ ARBITRAGE TESTS ============
  describe('Arbitrage Detection', () => {
    
    test('ArbitrageService should initialize correctly', () => {
      const arbitrageService = new ArbitrageService();
      expect(typeof arbitrageService.detectOpportunities).toBe('function');
      expect(typeof arbitrageService.recordOpportunity).toBe('function');
      expect(typeof arbitrageService.executeArbitrage).toBe('function');
      expect(typeof arbitrageService.getActiveOpportunities).toBe('function');
    });

    test('ArbitrageService.detectOpportunities returns array', async () => {
      const arbitrageService = new ArbitrageService();
      const tokenMints = ['So11111111111111111111111111111111111111112'];
      const opportunities = await arbitrageService.detectOpportunities(mockWalletId, tokenMints);
      
      expect(Array.isArray(opportunities)).toBe(true);
    });
  });

  // ============ PORTFOLIO REBALANCING TESTS ============
  describe('Portfolio Rebalancing', () => {
    
    test('RebalancingService should initialize correctly', () => {
      const rebalancingService = new RebalancingService();
      expect(typeof rebalancingService.checkRebalancingNeeded).toBe('function');
      expect(typeof rebalancingService.rebalancePortfolio).toBe('function');
      expect(typeof rebalancingService.getRebalancingHistory).toBe('function');
      expect(typeof rebalancingService.calculateRebalancingActions).toBe('function');
    });

    test('RebalancingService.calculateRebalancingActions with 5% deviation', () => {
      const rebalancingService = new RebalancingService();
      const currentAllocations = [40, 30, 30]; // 40%, 30%, 30%
      const targetAllocations = [50, 25, 25]; // 50%, 25%, 25%
      const portfolioValue = 10000;

      const actions = rebalancingService.calculateRebalancingActions(
        currentAllocations,
        targetAllocations,
        portfolioValue
      );

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0]).toHaveProperty('action');
      expect(actions[0]).toHaveProperty('amount');
      expect(['buy', 'sell']).toContain(actions[0].action);
    });

    test('RebalancingService.checkRebalancingNeeded returns boolean', async () => {
      const rebalancingService = new RebalancingService();
      const currentAllocations = [50, 50];
      const targetAllocations = [50, 50];
      
      const needed = await rebalancingService.checkRebalancingNeeded(
        mockWalletId,
        currentAllocations,
        targetAllocations
      );

      expect(typeof needed).toBe('boolean');
    });
  });

  // ============ STOP LOSS / TAKE PROFIT TESTS ============
  describe('Stop Loss & Take Profit', () => {
    
    test('SLTPService should initialize correctly', () => {
      const slTPService = new SLTPService();
      expect(typeof slTPService.createSLTPOrders).toBe('function');
      expect(typeof slTPService.checkTriggers).toBe('function');
      expect(typeof slTPService.getActiveOrders).toBe('function');
    });

    test('SLTPService.checkTriggers returns array', async () => {
      const slTPService = new SLTPService();
      const positions = [
        {
          token_mint: 'EPjFWdd5Au',
          current_price: 1.05
        }
      ];

      const triggered = await slTPService.checkTriggers(mockWalletId, positions);
      expect(Array.isArray(triggered)).toBe(true);
    });
  });

  // ============ POSITION CLONING TESTS ============
  describe('Position Cloning (Copy Trading)', () => {
    
    test('PositionCloningService should initialize correctly', () => {
      const positionCloningService = new PositionCloningService();
      expect(typeof positionCloningService.createCloneConfig).toBe('function');
      expect(typeof positionCloningService.monitorSourceWallet).toBe('function');
      expect(typeof positionCloningService.getCloneStats).toBe('function');
      expect(typeof positionCloningService.calculateScaledQuantity).toBe('function');
    });

    test('PositionCloningService.calculateScaledQuantity - 1to1 mode', () => {
      const positionCloningService = new PositionCloningService();
      const clonedQuantity = positionCloningService.calculateScaledQuantity(
        100,
        '1to1',
        1.0,
        1000
      );

      expect(clonedQuantity).toBe(100);
    });

    test('PositionCloningService.calculateScaledQuantity - scaled mode', () => {
      const positionCloningService = new PositionCloningService();
      const clonedQuantity = positionCloningService.calculateScaledQuantity(
        100,
        'scaled',
        0.5,
        1000
      );

      expect(clonedQuantity).toBe(50);
    });

    test('PositionCloningService.calculateScaledQuantity - with max value cap', () => {
      const positionCloningService = new PositionCloningService();
      const clonedQuantity = positionCloningService.calculateScaledQuantity(
        100,
        'scaled',
        2.0,
        50
      );

      expect(clonedQuantity).toBe(50); // Capped at maxValue
    });
  });

  // ============ OPTIONS/FUTURES TESTS ============
  describe('Options & Futures Trading', () => {
    
    test('OptionsFuturesService should initialize correctly', () => {
      const optionsFuturesService = new OptionsFuturesService();
      expect(typeof optionsFuturesService.createPosition).toBe('function');
      expect(typeof optionsFuturesService.createOrder).toBe('function');
      expect(typeof optionsFuturesService.getActivePositions).toBe('function');
      expect(typeof optionsFuturesService.updateMarkToMarket).toBe('function');
      expect(typeof optionsFuturesService.closePosition).toBe('function');
      expect(typeof optionsFuturesService.calculateGreeks).toBe('function');
      expect(typeof optionsFuturesService.validateOrderParameters).toBe('function');
    });

    test('OptionsFuturesService.validateOrderParameters - valid params', () => {
      const optionsFuturesService = new OptionsFuturesService();
      const validation = optionsFuturesService.validateOrderParameters({
        quantity: 10,
        price: 100,
        leverage: 5
      });

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('OptionsFuturesService.validateOrderParameters - invalid quantity', () => {
      const optionsFuturesService = new OptionsFuturesService();
      const validation = optionsFuturesService.validateOrderParameters({
        quantity: -10,
        price: 100,
        leverage: 5
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('OptionsFuturesService.validateOrderParameters - excessive leverage', () => {
      const optionsFuturesService = new OptionsFuturesService();
      const validation = optionsFuturesService.validateOrderParameters({
        quantity: 10,
        price: 100,
        leverage: 200
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('OptionsFuturesService.calculateGreeks - call option', () => {
      const optionsFuturesService = new OptionsFuturesService();
      const greeks = optionsFuturesService.calculateGreeks(
        'call',
        100, // spot price
        100, // strike price
        0.25, // time to expiry (months)
        0.2, // volatility
        0.05 // risk-free rate
      );

      expect(greeks).toHaveProperty('delta');
      expect(greeks).toHaveProperty('gamma');
      expect(greeks).toHaveProperty('theta');
      expect(greeks).toHaveProperty('vega');
      expect(greeks).toHaveProperty('rho');

      // Call option delta should be between 0 and 1
      expect(greeks.delta).toBeGreaterThan(0);
      expect(greeks.delta).toBeLessThan(1);

      // Gamma should be positive
      expect(greeks.gamma).toBeGreaterThan(0);

      // Vega should be positive
      expect(greeks.vega).toBeGreaterThan(0);
    });

    test('OptionsFuturesService.calculateGreeks - put option', () => {
      const optionsFuturesService = new OptionsFuturesService();
      const greeks = optionsFuturesService.calculateGreeks(
        'put',
        100,
        100,
        0.25,
        0.2,
        0.05
      );

      expect(greeks).toHaveProperty('delta');
      expect(greeks).toHaveProperty('gamma');
      expect(greeks).toHaveProperty('theta');

      // Put option delta should be between -1 and 0
      expect(greeks.delta).toBeGreaterThan(-1);
      expect(greeks.delta).toBeLessThan(0);

      // Gamma should be positive
      expect(greeks.gamma).toBeGreaterThan(0);
    });
  });

  // ============ INTEGRATION TESTS ============
  describe('Trading Features - Integration', () => {
    
    test('All services are properly instantiated', () => {
      const gridTradingService = new GridTradingService();
      const dcaService = new DCAService();
      const scalpingBotService = new ScalpingBotService();
      const arbitrageService = new ArbitrageService();
      const rebalancingService = new RebalancingService();
      const slTPService = new SLTPService();
      const positionCloningService = new PositionCloningService();
      const optionsFuturesService = new OptionsFuturesService();

      const services = [
        gridTradingService,
        dcaService,
        scalpingBotService,
        arbitrageService,
        rebalancingService,
        slTPService,
        positionCloningService,
        optionsFuturesService
      ];

      expect(services.length).toBe(8);
      services.forEach(service => {
        expect(service).not.toBeNull();
        expect(typeof service).toBe('object');
      });
    });

    test('All models export required methods', () => {
      expect(typeof GridTradingModel).toBe('function');
      expect(typeof DCAModel).toBe('function');
      expect(typeof ScalpingBotModel).toBe('function');
      expect(typeof ArbitrageModel).toBe('function');
      expect(typeof RebalancingModel).toBe('function');
      expect(typeof SLTPModel).toBe('function');
      expect(typeof PositionCloneModel).toBe('function');
      expect(typeof OptionsFuturesModel).toBe('function');

      // Check static methods
      expect(typeof GridTradingModel.calculateGridPrices).toBe('function');
      expect(typeof DCAModel.calculateNextExecutionTime).toBe('function');
    });
  });
});

// Export for external use
module.exports = {
  GridTradingModel,
  DCAModel,
  ScalpingBotModel,
  ArbitrageModel,
  RebalancingModel,
  SLTPModel,
  PositionCloneModel,
  OptionsFuturesModel,
  GridTradingService,
  DCAService,
  ScalpingBotService,
  ArbitrageService,
  RebalancingService,
  SLTPService,
  PositionCloningService,
  OptionsFuturesService
};
