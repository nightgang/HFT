require('dotenv').config({ path: '/workspaces/HFT/.env' });

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'hft_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'hft_trading'
});

(async () => {
  try {
    const res = await pool.query('SELECT * FROM schema_migrations ORDER BY executed_at DESC LIMIT 5');
    console.log('Last 5 migrations in schema_migrations table:');
    console.log(res.rows);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
