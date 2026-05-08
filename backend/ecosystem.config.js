module.exports = {
  apps: [{
    name: 'solana-hft-backend',
    script: 'index.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster', // Enable clustering
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Auto restart on crash
    autorestart: true,
    // Restart delay
    restart_delay: 4000,
    // Max memory usage before restart
    max_memory_restart: '1G',
    // Log configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Health check
    health_check: {
      enabled: true,
      max_restarts: 5,
      min_uptime: '10s'
    }
  }]
};