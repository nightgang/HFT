const { query } = require('../db/connection');
const logger = require('../utils/logger');

// Test data for all features
const testData = {
  wallet_id: 'test-wallet-uuid-123',
  token_mint_sol: 'So11111111111111111111111111111111111111112',
  token_mint_usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  token_mint_test: 'test-token-mint-123'
};

describe('Advanced Features Test Suite', () => {
  beforeAll(async () => {
    logger.info('Setting up Advanced Features Test Suite...');
  });

  afterAll(async () => {
    logger.info('Cleaning up Advanced Features Test Suite...');
  });

  describe('Database Migrations', () => {
    test('should have created all required tables', async () => {
      const tables = [
        'advanced_orders', 'limit_orders', 'cross_chain_transactions',
        'jito_bundles', 'liquidity_pools', 'predictive_alerts',
        'risk_heatmap', 'sentiment_scores', 'pnl_snapshots'
      ];

      for (const table of tables) {
        const result = await query(`
          SELECT table_name FROM information_schema.tables WHERE table_name = $1
        `, [table]);

        expect(result.rows.length).toBe(1);
      }
    });
  });

  describe('Advanced Order Model', () => {
    test('should create and retrieve advanced orders', async () => {
      const orderData = {
        wallet_id: testData.wallet_id,
        order_type: 'stop_loss',
        input_token_mint: testData.token_mint_sol,
        input_token_symbol: 'SOL',
        input_amount: 1000000,
        output_token_mint: testData.token_mint_usdc,
        output_token_symbol: 'USDC',
        trigger_price: 100.0,
        limit_price: 95.0
      };

      // Test create
      const createResult = await query(`
        INSERT INTO advanced_orders (
          wallet_id, order_type, input_token_mint, input_token_symbol, input_amount,
          output_token_mint, output_token_symbol, trigger_price, limit_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING order_id
      `, [
        orderData.wallet_id, orderData.order_type, orderData.input_token_mint,
        orderData.input_token_symbol, orderData.input_amount, orderData.output_token_mint,
        orderData.output_token_symbol, orderData.trigger_price, orderData.limit_price
      ]);

      expect(createResult.rows.length).toBe(1);
      const orderId = createResult.rows[0].order_id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM advanced_orders WHERE order_id = $1', [orderId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].order_type).toBe('stop_loss');
    });
  });

  describe('Liquidity Pool Model', () => {
    test('should create and retrieve liquidity pools', async () => {
      const poolData = {
        wallet_id: testData.wallet_id,
        pool_address: 'test-pool-address-123',
        amm_provider: 'raydium',
        token_a_mint: testData.token_mint_sol,
        token_a_symbol: 'SOL',
        token_a_amount: 1000000,
        token_b_mint: testData.token_mint_usdc,
        token_b_symbol: 'USDC',
        token_b_amount: 1000000000,
        total_liquidity_usd: 2000.0,
        pool_share_percent: 0.1
      };

      // Test create
      const createResult = await query(`
        INSERT INTO liquidity_pools (
          wallet_id, pool_address, amm_provider, token_a_mint, token_a_symbol,
          token_a_amount, token_b_mint, token_b_symbol, token_b_amount,
          total_liquidity_usd, pool_share_percent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING pool_id
      `, [
        poolData.wallet_id, poolData.pool_address, poolData.amm_provider,
        poolData.token_a_mint, poolData.token_a_symbol, poolData.token_a_amount,
        poolData.token_b_mint, poolData.token_b_symbol, poolData.token_b_amount,
        poolData.total_liquidity_usd, poolData.pool_share_percent
      ]);

      expect(createResult.rows.length).toBe(1);
      const poolId = createResult.rows[0].pool_id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM liquidity_pools WHERE pool_id = $1', [poolId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].amm_provider).toBe('raydium');
    });
  });

  describe('Limit Order Model', () => {
    test('should create and retrieve limit orders', async () => {
      const orderData = {
        wallet_id: testData.wallet_id,
        side: 'buy',
        input_token_mint: testData.token_mint_usdc,
        input_token_symbol: 'USDC',
        input_amount: 100000000, // 100 USDC
        output_token_mint: testData.token_mint_sol,
        output_token_symbol: 'SOL',
        limit_price: 98.5
      };

      // Test create
      const createResult = await query(`
        INSERT INTO limit_orders (
          wallet_id, side, input_token_mint, input_token_symbol, input_amount,
          output_token_mint, output_token_symbol, limit_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING order_id
      `, [
        orderData.wallet_id, orderData.side, orderData.input_token_mint,
        orderData.input_token_symbol, orderData.input_amount, orderData.output_token_mint,
        orderData.output_token_symbol, orderData.limit_price
      ]);

      expect(createResult.rows.length).toBe(1);
      const orderId = createResult.rows[0].order_id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM limit_orders WHERE order_id = $1', [orderId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].side).toBe('buy');
    });
  });

  describe('PnL Dashboard Models', () => {
    test('should create and retrieve PnL snapshots', async () => {
      const snapshotData = {
        wallet_id: testData.wallet_id,
        realized_pnl_usd: 850.50,
        unrealized_pnl_usd: 400.25,
        total_pnl_usd: 1250.75,
        total_portfolio_value_usd: 10000.0,
        total_invested_usd: 8750.0,
        daily_return_percent: 1.25
      };

      // Test create
      const createResult = await query(`
        INSERT INTO pnl_snapshots (
          wallet_id, realized_pnl_usd, unrealized_pnl_usd, total_pnl_usd,
          total_portfolio_value_usd, total_invested_usd, daily_return_percent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING snapshot_id
      `, [
        snapshotData.wallet_id, snapshotData.realized_pnl_usd, snapshotData.unrealized_pnl_usd,
        snapshotData.total_pnl_usd, snapshotData.total_portfolio_value_usd,
        snapshotData.total_invested_usd, snapshotData.daily_return_percent
      ]);

      expect(createResult.rows.length).toBe(1);
      const snapshotId = createResult.rows[0].snapshot_id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM pnl_snapshots WHERE id = $1', [snapshotId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].total_pnl_usd).toBe(1250.75);
    });
  });

  describe('Risk Heatmap Models', () => {
    test('should create and retrieve position concentration', async () => {
      const concentrationData = {
        wallet_id: testData.wallet_id,
        token_mint: testData.token_mint_sol,
        concentration_percentage: 45.2,
        risk_level: 'high'
      };

      // Test create
      const createResult = await query(`
        INSERT INTO position_concentration (
          wallet_id, token_mint, concentration_percentage, risk_level, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `, [
        concentrationData.wallet_id, concentrationData.token_mint,
        concentrationData.concentration_percentage, concentrationData.risk_level
      ]);

      expect(createResult.rows.length).toBe(1);
      const concentrationId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM position_concentration WHERE id = $1', [concentrationId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].risk_level).toBe('high');
    });
  });

  describe('Predictive Alert Models', () => {
    test('should create and retrieve predictive alerts', async () => {
      const alertData = {
        wallet_id: testData.wallet_id,
        alert_type: 'price_drop',
        token_mint: testData.token_mint_sol,
        threshold: 90.0,
        confidence_score: 0.85,
        status: 'active'
      };

      // Test create
      const createResult = await query(`
        INSERT INTO predictive_alerts (
          wallet_id, alert_type, token_mint, threshold,
          confidence_score, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `, [
        alertData.wallet_id, alertData.alert_type, alertData.token_mint,
        alertData.threshold, alertData.confidence_score, alertData.status
      ]);

      expect(createResult.rows.length).toBe(1);
      const alertId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM predictive_alerts WHERE id = $1', [alertId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].alert_type).toBe('price_drop');
    });
  });

  describe('Sentiment Analysis Models', () => {
    test('should create and retrieve sentiment scores', async () => {
      const sentimentData = {
        token_mint: testData.token_mint_sol,
        source: 'twitter',
        sentiment_score: 0.75,
        confidence: 0.92,
        volume: 1500
      };

      // Test create
      const createResult = await query(`
        INSERT INTO sentiment_scores (
          token_mint, source, sentiment_score, confidence, volume, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, [
        sentimentData.token_mint, sentimentData.source, sentimentData.sentiment_score,
        sentimentData.confidence, sentimentData.volume
      ]);

      expect(createResult.rows.length).toBe(1);
      const sentimentId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM sentiment_scores WHERE id = $1', [sentimentId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].source).toBe('twitter');
    });
  });

  describe('Cross-Chain Bridge Models', () => {
    test('should create and retrieve bridge records', async () => {
      const bridgeData = {
        wallet_id: testData.wallet_id,
        from_chain: 'solana',
        to_chain: 'ethereum',
        token_mint: testData.token_mint_sol,
        amount: 1000000,
        status: 'pending'
      };

      // Test create
      const createResult = await query(`
        INSERT INTO bridge_records (
          wallet_id, from_chain, to_chain, token_mint, amount, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `, [
        bridgeData.wallet_id, bridgeData.from_chain, bridgeData.to_chain,
        bridgeData.token_mint, bridgeData.amount, bridgeData.status
      ]);

      expect(createResult.rows.length).toBe(1);
      const bridgeId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM bridge_records WHERE id = $1', [bridgeId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].from_chain).toBe('solana');
    });
  });

  describe('Jito Bundle Models', () => {
    test('should create and retrieve Jito bundles', async () => {
      const bundleData = {
        wallet_id: testData.wallet_id,
        bundle_id: 'jito-bundle-test-123',
        transactions: JSON.stringify([{ tx: 'test-tx-1' }, { tx: 'test-tx-2' }]),
        status: 'submitted',
        tip_amount: 10000
      };

      // Test create
      const createResult = await query(`
        INSERT INTO jito_bundles (
          wallet_id, bundle_id, transactions, status, tip_amount, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id
      `, [
        bundleData.wallet_id, bundleData.bundle_id, bundleData.transactions,
        bundleData.status, bundleData.tip_amount
      ]);

      expect(createResult.rows.length).toBe(1);
      const bundleId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM jito_bundles WHERE id = $1', [bundleId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].bundle_id).toBe('jito-bundle-test-123');
    });
  });

  describe('Advanced Cache Models', () => {
    test('should create and retrieve cache entries', async () => {
      const cacheData = {
        key: 'test-cache-key',
        value: JSON.stringify({ data: 'test-value' }),
        ttl: 3600,
        tags: JSON.stringify(['test', 'advanced'])
      };

      // Test create
      const createResult = await query(`
        INSERT INTO cache_store (
          key, value, ttl, tags, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id
      `, [
        cacheData.key, cacheData.value, cacheData.ttl, cacheData.tags
      ]);

      expect(createResult.rows.length).toBe(1);
      const cacheId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM cache_store WHERE id = $1', [cacheId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].key).toBe('test-cache-key');
    });
  });

  describe('Trade History Aggregation Models', () => {
    test('should create and retrieve trade search index', async () => {
      const searchData = {
        trade_id: 'test-trade-123',
        wallet_id: testData.wallet_id,
        token_mint: testData.token_mint_sol,
        search_vector: 'test search vector data',
        metadata: JSON.stringify({ type: 'swap', amount: 1000000 })
      };

      // Test create
      const createResult = await query(`
        INSERT INTO trade_search_index (
          trade_id, wallet_id, token_mint, search_vector, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, [
        searchData.trade_id, searchData.wallet_id, searchData.token_mint,
        searchData.search_vector, searchData.metadata
      ]);

      expect(createResult.rows.length).toBe(1);
      const searchId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM trade_search_index WHERE id = $1', [searchId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].trade_id).toBe('test-trade-123');
    });
  });
});