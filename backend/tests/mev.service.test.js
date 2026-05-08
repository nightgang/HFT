const { MEVProtectionService } = require('../services/mev/mev.service');
const axios = require('axios');
// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getRecentBlockhash: jest.fn(),
    getConfirmedBlock: jest.fn()
  })),
  PublicKey: jest.fn(),
  Transaction: jest.fn(),
  SystemProgram: {},
  LAMPORTS_PER_SOL: 1000000000
}));
const logger = require('../utils/logger');
const metricsService = require('../services/monitoring/metrics.service');

jest.mock('axios');
jest.mock('../utils/logger');
jest.mock('../services/monitoring/metrics.service');

describe('MEVProtectionService', () => {
  let mevService;

  beforeEach(() => {
    jest.clearAllMocks();
    mevService = new MEVProtectionService();
  });

  describe('calculatePriorityFee', () => {
    it('should calculate priority fee based on Jito tip floor and network congestion', async () => {
      const mockConnection = {};
      const mockRecentBlockhash = {};

      mevService.getJitoTipFloor = jest.fn().mockResolvedValue(2000);
      mevService.getNetworkPriorityFees = jest.fn().mockResolvedValue({
        average: 5000,
        max: 10000
      });

      const result = await mevService.calculatePriorityFee(mockConnection, mockRecentBlockhash);

      expect(result).toBe(6000); // Max of 2000 and 5000 * 1.2
      expect(mevService.getJitoTipFloor).toHaveBeenCalled();
      expect(mevService.getNetworkPriorityFees).toHaveBeenCalledWith(mockConnection);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Calculated priority fee: 6000 lamports')
      );
    });

    it('should use minimum fee when calculations fail', async () => {
      mevService.getJitoTipFloor = jest.fn().mockRejectedValue(new Error('API error'));

      const result = await mevService.calculatePriorityFee({}, {});

      expect(result).toBe(mevService.minPriorityFee);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to calculate priority fee, using minimum:',
        'API error'
      );
    });

    it('should cap priority fee at maximum limit', async () => {
      mevService.getJitoTipFloor = jest.fn().mockResolvedValue(500000);
      mevService.getNetworkPriorityFees = jest.fn().mockResolvedValue({
        average: 2000000,
        max: 2000000
      });

      const result = await mevService.calculatePriorityFee({}, {});

      expect(result).toBe(mevService.maxPriorityFee);
    });
  });

  describe('getJitoTipFloor', () => {
    it('should return tip floor from Jito API', async () => {
      axios.get.mockResolvedValue({
        data: [3000, 2500, 2000]
      });

      const result = await mevService.getJitoTipFloor();

      expect(result).toBe(3000);
      expect(axios.get).toHaveBeenCalledWith(mevService.tipsEndpoint, { timeout: 5000 });
    });

    it('should return default tip floor when API fails', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await mevService.getJitoTipFloor();

      expect(result).toBe(1000);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to get Jito tip floor:',
        'Network error'
      );
    });

    it('should return default tip floor when API returns empty data', async () => {
      axios.get.mockResolvedValue({ data: [] });

      const result = await mevService.getJitoTipFloor();

      expect(result).toBe(1000);
    });
  });

  describe('getNetworkPriorityFees', () => {
    it('should calculate network priority fees from recent blocks', async () => {
      const mockConnection = {
        getRecentBlockhash: jest.fn().mockResolvedValue({
          feeCalculator: {}
        }),
        getConfirmedBlock: jest.fn().mockResolvedValue({
          transactions: [
            { meta: { fee: 1000 } },
            { meta: { fee: 2000 } },
            { meta: { fee: 3000 } },
            { meta: {} } // No fee
          ]
        })
      };

      const result = await mevService.getNetworkPriorityFees(mockConnection);

      expect(result.average).toBe(2000); // (1000 + 2000 + 3000) / 3
      expect(result.max).toBe(3000);
    });

    it('should return default fees when block data is unavailable', async () => {
      const mockConnection = {
        getRecentBlockhash: jest.fn().mockRejectedValue(new Error('RPC error'))
      };

      const result = await mevService.getNetworkPriorityFees(mockConnection);

      expect(result.average).toBe(5000);
      expect(result.max).toBe(50000);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to get network priority fees:',
        'RPC error'
      );
    });

    it('should handle empty transaction list', async () => {
      const mockConnection = {
        getRecentBlockhash: jest.fn().mockResolvedValue({
          feeCalculator: {}
        }),
        getConfirmedBlock: jest.fn().mockResolvedValue({
          transactions: []
        })
      };

      const result = await mevService.getNetworkPriorityFees(mockConnection);

      expect(result.average).toBe(5000);
      expect(result.max).toBe(5000);
    });
  });

  describe('simulateSlippage', () => {
    const mockTokenIn = 'SOL123';
    const mockTokenOut = 'USDC456';
    const mockAmountIn = 100;
    const mockRoute = { liquidity: 10000 };

    it('should simulate slippage successfully', async () => {
      mevService.getCurrentPrice = jest.fn().mockResolvedValue(0.00001);
      mevService.calculatePriceImpact = jest.fn().mockReturnValue(0.5);

      const result = await mevService.simulateSlippage(
        mockTokenIn,
        mockTokenOut,
        mockAmountIn,
        mockRoute
      );

      expect(result.tokenIn).toBe(mockTokenIn);
      expect(result.tokenOut).toBe(mockTokenOut);
      expect(result.amountIn).toBe(mockAmountIn);
      expect(result.currentPrice).toBe(0.00001);
      expect(result.priceImpactPercent).toBe(0.5);
      expect(result.slippageProtection).toBe(true);
      expect(metricsService.recordRpcLatency).toHaveBeenCalledWith(
        'slippage_simulation',
        'simulation',
        expect.any(Number)
      );
      expect(logger.debug).toHaveBeenCalledWith('Slippage simulation completed:', result);
    });

    it('should detect high slippage risk', async () => {
      mevService.getCurrentPrice = jest.fn().mockResolvedValue(0.00001);
      mevService.calculatePriceImpact = jest.fn().mockReturnValue(2.0); // Above max slippage

      const result = await mevService.simulateSlippage(
        mockTokenIn,
        mockTokenOut,
        mockAmountIn,
        mockRoute
      );

      expect(result.slippageProtection).toBe(false);
      expect(result.priceImpactPercent).toBe(2.0);
    });

    it('should handle simulation errors', async () => {
      mevService.getCurrentPrice = jest.fn().mockRejectedValue(new Error('Price fetch failed'));

      await expect(mevService.simulateSlippage(
        mockTokenIn,
        mockTokenOut,
        mockAmountIn,
        mockRoute
      )).rejects.toThrow('Price fetch failed');

      expect(logger.error).toHaveBeenCalledWith('Slippage simulation failed:', expect.any(Error));
    });
  });

  describe('calculatePriceImpact', () => {
    it('should calculate price impact correctly', () => {
      expect(mevService.calculatePriceImpact(100, 1000)).toBe(10);
      expect(mevService.calculatePriceImpact(50, 1000)).toBe(5);
    });

    it('should cap price impact at 50%', () => {
      expect(mevService.calculatePriceImpact(1000, 1000)).toBe(50);
    });

    it('should return 100% impact when liquidity is zero', () => {
      expect(mevService.calculatePriceImpact(100, 0)).toBe(100);
    });

    it('should handle undefined liquidity', () => {
      expect(mevService.calculatePriceImpact(100, undefined)).toBe(100);
    });
  });

  describe('detectSandwichAttack', () => {
    const mockTokenAddress = 'SOL123';

    it('should not detect sandwich attack with insufficient trades', async () => {
      mevService.getRecentTrades = jest.fn().mockResolvedValue([]);

      const result = await mevService.detectSandwichAttack(mockTokenAddress);

      expect(result.detected).toBe(false);
    });

    it('should not detect sandwich attack with normal trading pattern', async () => {
      const mockTrades = [
        { amount: 10, timestamp: Date.now() - 10000, price: 1.0 },
        { amount: 12, timestamp: Date.now() - 5000, price: 1.01 }
      ];

      mevService.getRecentTrades = jest.fn().mockResolvedValue(mockTrades);
      mevService.calculateAverageTradeSize = jest.fn().mockReturnValue(8);

      const result = await mevService.detectSandwichAttack(mockTokenAddress);

      expect(result.detected).toBe(false);
    });

    it('should detect sandwich attack with suspicious pattern', async () => {
      const mockTrades = [
        { amount: 50, timestamp: Date.now() - 2000, price: 1.0 },
        { amount: 50, timestamp: Date.now() - 1000, price: 1.01 }
      ];

      mevService.getRecentTrades = jest.fn().mockResolvedValue(mockTrades);
      mevService.calculateAverageTradeSize = jest.fn().mockReturnValue(10);

      const result = await mevService.detectSandwichAttack(mockTokenAddress);

      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(logger.warn).toHaveBeenCalledWith(
        'Potential sandwich attack detected:',
        expect.objectContaining({
          token: mockTokenAddress,
          trades: mockTrades
        })
      );
    });

    it('should handle detection errors gracefully', async () => {
      mevService.getRecentTrades = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await mevService.detectSandwichAttack(mockTokenAddress);

      expect(result.detected).toBe(false);
      expect(result.error).toBe('Database error');
      expect(logger.error).toHaveBeenCalledWith('Sandwich attack detection failed:', expect.any(Error));
    });
  });

  describe('calculateAverageTradeSize', () => {
    it('should calculate average trade size correctly', () => {
      const trades = [
        { amount: 10 },
        { amount: 20 },
        { amount: 30 }
      ];

      const result = mevService.calculateAverageTradeSize(trades);

      expect(result).toBe(20);
    });

    it('should return 0 for empty trades array', () => {
      const result = mevService.calculateAverageTradeSize([]);

      expect(result).toBe(0);
    });
  });

  describe('submitJitoBundle', () => {
    const mockTransactions = [
      { serialize: jest.fn().mockReturnValue(Buffer.from('mock-tx-data')) }
    ];
    const mockTipAmount = 15000;

    it('should submit bundle successfully', async () => {
      const mockBundleId = 'bundle-123';
      axios.post.mockResolvedValue({
        data: { bundleId: mockBundleId }
      });
      mevService.getRandomJitoTipAccount = jest.fn().mockReturnValue('tip-account-123');

      const result = await mevService.submitJitoBundle(mockTransactions, mockTipAmount);

      expect(result.success).toBe(true);
      expect(result.bundleId).toBe(mockBundleId);
      expect(result.status).toBe('submitted');
      expect(axios.post).toHaveBeenCalledWith(
        mevService.bundleEndpoint,
        expect.objectContaining({
          transactions: [expect.any(String)],
          tipAccount: 'tip-account-123',
          tipAmount: mockTipAmount
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        })
      );
      expect(metricsService.recordTrade).toHaveBeenCalledWith('mev_protected', 'submitted', 'jito_bundle');
      expect(logger.info).toHaveBeenCalledWith(`Jito bundle submitted: ${mockBundleId}`);
    });

    it('should handle submission failure', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));
      mevService.getRandomJitoTipAccount = jest.fn().mockReturnValue('tip-account-123');

      const result = await mevService.submitJitoBundle(mockTransactions, mockTipAmount);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(metricsService.recordError).toHaveBeenCalledWith('jito_bundle', 'submission_failed');
      expect(logger.error).toHaveBeenCalledWith('Jito bundle submission failed:', expect.any(Error));
    });

    it('should handle invalid API response', async () => {
      axios.post.mockResolvedValue({ data: {} });
      mevService.getRandomJitoTipAccount = jest.fn().mockReturnValue('tip-account-123');

      const result = await mevService.submitJitoBundle(mockTransactions, mockTipAmount);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Jito bundle response');
    });
  });

  describe('getRandomJitoTipAccount', () => {
    it('should return a valid tip account', () => {
      const result = mevService.getRandomJitoTipAccount();

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return different accounts on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 10; i++) {
        results.add(mevService.getRandomJitoTipAccount());
      }

      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('checkBundleStatus', () => {
    const mockBundleId = 'bundle-123';

    it('should check bundle status successfully', async () => {
      const mockResponse = {
        status: 'confirmed',
        landedSlot: 12345,
        transactions: ['tx1', 'tx2']
      };

      axios.get.mockResolvedValue({ data: mockResponse });

      const result = await mevService.checkBundleStatus(mockBundleId);

      expect(result.bundleId).toBe(mockBundleId);
      expect(result.status).toBe('confirmed');
      expect(result.landedSlot).toBe(12345);
      expect(result.transactions).toEqual(['tx1', 'tx2']);
    });

    it('should handle status check failure', async () => {
      axios.get.mockRejectedValue(new Error('API error'));

      const result = await mevService.checkBundleStatus(mockBundleId);

      expect(result.bundleId).toBe(mockBundleId);
      expect(result.status).toBe('error');
      expect(result.error).toBe('API error');
      expect(logger.error).toHaveBeenCalledWith(
        `Failed to check bundle status for ${mockBundleId}:`,
        expect.any(Error)
      );
    });
  });

  describe('executeProtectedTrade', () => {
    const mockTradeParams = {
      wallet: 'wallet-123',
      tokenIn: { mint: 'SOL123' },
      tokenOut: { mint: 'USDC456' },
      amountIn: 100,
      slippageTolerance: 0.5,
      useJito: true
    };

    beforeEach(() => {
      // Mock Connection for each test
      const { Connection } = require('@solana/web3.js');
      Connection.mockImplementation(() => ({
        getRecentBlockhash: jest.fn().mockResolvedValue({}),
        getConfirmedBlock: jest.fn().mockResolvedValue({
          transactions: [{ meta: { fee: 5000 } }]
        })
      }));
    });

    it('should execute protected trade successfully', async () => {
      mevService.detectSandwichAttack = jest.fn().mockResolvedValue({ detected: false });
      mevService.simulateSlippage = jest.fn().mockResolvedValue({
        slippageProtection: true,
        expectedOutput: 95
      });
      mevService.calculatePriorityFee = jest.fn().mockResolvedValue(10000);

      const result = await mevService.executeProtectedTrade(mockTradeParams);

      expect(result.success).toBe(true);
      expect(result.priorityFee).toBe(10000);
      expect(result.slippageProtection).toBeDefined();
      expect(result.sandwichDetection).toBeDefined();
      expect(metricsService.recordTrade).toHaveBeenCalledWith(
        'mev_protected',
        'executed',
        mockTradeParams.wallet,
        expect.any(Number)
      );
    });

    it('should abort trade due to sandwich attack detection', async () => {
      mevService.detectSandwichAttack = jest.fn().mockResolvedValue({
        detected: true,
        confidence: 0.8
      });

      const result = await mevService.executeProtectedTrade(mockTradeParams);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('sandwich_attack_detected');
      expect(logger.warn).toHaveBeenCalledWith('Trade aborted due to sandwich attack detection');
    });

    it('should abort trade due to high slippage risk', async () => {
      mevService.detectSandwichAttack = jest.fn().mockResolvedValue({ detected: false });
      mevService.simulateSlippage = jest.fn().mockResolvedValue({
        slippageProtection: false,
        expectedOutput: 85
      });

      const result = await mevService.executeProtectedTrade(mockTradeParams);

      expect(result.success).toBe(false);
      expect(result.reason).toBe('high_slippage_risk');
      expect(logger.warn).toHaveBeenCalledWith('Trade aborted due to high slippage risk');
    });

    it('should handle execution errors', async () => {
      mevService.detectSandwichAttack = jest.fn().mockRejectedValue(new Error('Detection failed'));

      const result = await mevService.executeProtectedTrade(mockTradeParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Detection failed');
      expect(metricsService.recordTrade).toHaveBeenCalledWith(
        'mev_protected',
        'failed',
        mockTradeParams.wallet,
        expect.any(Number)
      );
      expect(logger.error).toHaveBeenCalledWith('Protected trade execution failed:', expect.any(Error));
    });
  });
});