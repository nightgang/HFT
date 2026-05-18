const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'hft_trading',
  user: process.env.DB_USER || 'hft_user',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(dbConfig);

// Event handlers for pool
pool.on('connect', (_client) => {
  logger.info('New client connected to database');
});

pool.on('error', (err, _client) => {
  logger.error('Unexpected error on idle client', err);
  // Don't exit process immediately - let graceful shutdown handle it
  // This allows proper cleanup of other services
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    logger.info('Database connected successfully');
    client.release();
    return true;
  } catch (err) {
    logger.error('Database connection failed:', err);
    return false;
  }
};

// Query helper with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query in ${duration}ms: ${text}`);
    return res;
  } catch (err) {
    logger.error('Query error:', err);
    throw err;
  }
};

// Transaction helper
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
    logger.error(`The last executed query on this client was: ${client.lastQuery}`);
  }, 5000);

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    // Set the methods back to their old un-monkey-patched version
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};