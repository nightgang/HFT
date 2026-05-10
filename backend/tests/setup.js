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
jest.mock('../db/connection', () => ({
  query: jest.fn().mockResolvedValue({
    rows: [{ daily_pnl: 0, trade_count: 0, current_balance: 0, portfolio_value_usd: 1000, token_exposure_usd: 50, created_at: new Date(), status: 'completed' }]
  }),
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