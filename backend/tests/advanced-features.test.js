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
        'advanced_orders', 'liquidity_pools', 'liquidity_positions',
        'limit_orders', 'pnl_snapshots', 'strategy_performance',
        'token_attribution', 'position_concentration', 'correlation_matrix',
        'predictive_alerts', 'anomaly_logs', 'sentiment_scores',
        'social_signals', 'cross_chain_transactions', 'bridge_records',
        'jito_bundles', 'trade_search_index', 'cache_store'
      ];

      for (const table of tables) {
        const result = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = $1
          )
        `, [table]);

        expect(result.rows[0].exists).toBe(true);
      }
    });
  });

  describe('Advanced Order Model', () => {
    test('should create and retrieve advanced orders', async () => {
      const orderData = {
        wallet_id: testData.wallet_id,
        order_type: 'stop_loss',
        token_mint: testData.token_mint_sol,
        amount: 1000000,
        trigger_price: 100.0,
        limit_price: 95.0,
        status: 'pending'
      };

      // Test create
      const createResult = await query(`
        INSERT INTO advanced_orders (
          wallet_id, order_type, token_mint, amount,
          trigger_price, limit_price, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id
      `, [
        orderData.wallet_id, orderData.order_type, orderData.token_mint,
        orderData.amount, orderData.trigger_price, orderData.limit_price, orderData.status
      ]);

      expect(createResult.rows.length).toBe(1);
      const orderId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM advanced_orders WHERE id = $1', [orderId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].order_type).toBe('stop_loss');
    });
  });

  describe('Liquidity Pool Model', () => {
    test('should create and retrieve liquidity pools', async () => {
      const poolData = {
        pool_address: 'test-pool-address-123',
        token_a_mint: testData.token_mint_sol,
        token_b_mint: testData.token_mint_usdc,
        liquidity: 1000000,
        fee_rate: 0.003,
        protocol: 'raydium'
      };

      // Test create
      const createResult = await query(`
        INSERT INTO liquidity_pools (
          pool_address, token_a_mint, token_b_mint, liquidity,
          fee_rate, protocol, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `, [
        poolData.pool_address, poolData.token_a_mint, poolData.token_b_mint,
        poolData.liquidity, poolData.fee_rate, poolData.protocol
      ]);

      expect(createResult.rows.length).toBe(1);
      const poolId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM liquidity_pools WHERE id = $1', [poolId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].protocol).toBe('raydium');
    });
  });

  describe('Limit Order Model', () => {
    test('should create and retrieve limit orders', async () => {
      const orderData = {
        wallet_id: testData.wallet_id,
        token_mint: testData.token_mint_sol,
        side: 'buy',
        amount: 500000,
        price: 98.5,
        status: 'open'
      };

      // Test create
      const createResult = await query(`
        INSERT INTO limit_orders (
          wallet_id, token_mint, side, amount, price, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `, [
        orderData.wallet_id, orderData.token_mint, orderData.side,
        orderData.amount, orderData.price, orderData.status
      ]);

      expect(createResult.rows.length).toBe(1);
      const orderId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM limit_orders WHERE id = $1', [orderId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].side).toBe('buy');
    });
  });

  describe('PnL Dashboard Models', () => {
    test('should create and retrieve PnL snapshots', async () => {
      const snapshotData = {
        wallet_id: testData.wallet_id,
        total_pnl: 1250.75,
        realized_pnl: 850.50,
        unrealized_pnl: 400.25,
        period: 'daily'
      };

      // Test create
      const createResult = await query(`
        INSERT INTO pnl_snapshots (
          wallet_id, total_pnl, realized_pnl, unrealized_pnl,
          period, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, [
        snapshotData.wallet_id, snapshotData.total_pnl, snapshotData.realized_pnl,
        snapshotData.unrealized_pnl, snapshotData.period
      ]);

      expect(createResult.rows.length).toBe(1);
      const snapshotId = createResult.rows[0].id;

      // Test retrieve
      const retrieveResult = await query('SELECT * FROM pnl_snapshots WHERE id = $1', [snapshotId]);
      expect(retrieveResult.rows.length).toBe(1);
      expect(retrieveResult.rows[0].total_pnl).toBe(1250.75);
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