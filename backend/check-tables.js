require('dotenv').config({ path: __dirname + '/../.env' });

const { query } = require('./db/connection');

(async () => {
  try {
    const res = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('trading_alerts', 'user_notifications', 'notification_preferences')
    `);
    console.log('Tables found:', res.rows.map(r => r.table_name));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
