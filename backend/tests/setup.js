// Jest setup file
const envPath = require('path').resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

if (!process.env.JWT_SECRET) {
  // Allow tests to run with a deterministic default value.
  // This repository expects JWT_SECRET only for integration/runtime.
  process.env.JWT_SECRET = 'test-jwt-secret';
}

// Mock external dependencies
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Mock database connection
const mockDbState = {
  tables: {
    advanced_orders: [],
    liquidity_pools: [],
    limit_orders: [],
    pnl_snapshots: [],
    position_concentration: [],
    predictive_alerts: [],
    sentiment_scores: [],
    bridge_records: [],
    jito_bundles: [],
    cache_store: [],
    trade_search_index: [],
    cross_chain_transactions: [],
    risk_heatmap: []
  }
};

const normalizeSql = (sql) => sql.replace(/\s+/g, ' ').trim();

const generateId = () => `id_${Math.random().toString(36).slice(2, 12)}`;

const mockQuery = jest.fn().mockImplementation(async (sql, params = []) => {
  const normalized = normalizeSql(sql);

  if (/^SELECT table_name FROM information_schema.tables WHERE table_name = \$1/i.test(normalized)) {
    const table = params[0];
    const exists = Object.prototype.hasOwnProperty.call(mockDbState.tables, table);
    return { rows: exists ? [{ table_name: table }] : [] };
  }

  const insertMatch = normalized.match(/^INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)\s*RETURNING\s+(.+)$/i);
  if (insertMatch) {
    const table = insertMatch[1];
    const columns = insertMatch[2].split(',').map(col => col.trim());
    const returning = insertMatch[4].trim().split(',')[0].trim();
    const row = {};
    columns.forEach((column, index) => {
      row[column] = params[index];
    });

    const generatedId = generateId();
    row.id = row.id || generatedId;
    if (returning && !Object.prototype.hasOwnProperty.call(row, returning)) {
      row[returning] = generatedId;
      if (returning === 'snapshot_id') {
        row.snapshot_id = generatedId;
      }
      if (returning === 'order_id') {
        row.order_id = generatedId;
      }
      if (returning === 'pool_id') {
        row.pool_id = generatedId;
      }
    }

    if (!row.snapshot_id && table === 'pnl_snapshots') {
      row.snapshot_id = row.id;
    }
    if (!row.concentration_id && table === 'position_concentration') {
      row.concentration_id = row.id;
    }
    if (!row.bundle_id && table === 'jito_bundles') {
      row.bundle_id = params[1] || generatedId;
    }

    if (!mockDbState.tables[table]) {
      mockDbState.tables[table] = [];
    }
    mockDbState.tables[table].push(row);
    return { rows: [row] };
  }

  const selectMatch = normalized.match(/^SELECT \* FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\$1/i);
  if (selectMatch) {
    const table = selectMatch[1];
    const column = selectMatch[2];
    const value = params[0];
    const rows = (mockDbState.tables[table] || []).filter((row) => row[column] === value);
    return { rows };
  }

  return {
    rows: [{ daily_pnl: 0, trade_count: 0, current_balance: 0, portfolio_value_usd: 1000, token_exposure_usd: 50, created_at: new Date(), status: 'completed' }]
  };
});

jest.mock('../db/connection', () => ({
  query: mockQuery,
  getClient: jest.fn(),
  pool: {
    connect: jest.fn(),
    end: jest.fn()
  },
  testConnection: jest.fn().mockResolvedValue(true)
}));

// Global test utilities
global.testUtils = {
  // Helper to create mock request/response objects
  createMockReq: (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query,
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('test-user-agent')
  }),

  createMockRes: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
    return res;
  },

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to mock database responses
  mockDbResponse: (rows = []) => ({
    rows,
    rowCount: rows.length
  })
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(async () => {
  // Close any open connections
  const { pool } = require('../db/connection');
  if (pool && pool.end) {
    await pool.end();
  }
});