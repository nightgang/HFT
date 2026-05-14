-- Migration 008: Advanced Trading Features
-- Creates tables for grid trading, DCA, scalping, arbitrage, rebalancing, SL/TP, position cloning, and options/futures

-- Grid Trading Configurations
CREATE TABLE IF NOT EXISTS grid_trading_configs (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  token_mint VARCHAR(255) NOT NULL,
  base_token_mint VARCHAR(255) NOT NULL,
  grid_levels INT NOT NULL DEFAULT 10,
  grid_type VARCHAR(50) NOT NULL DEFAULT 'linear', -- linear, geometric
  lower_price DECIMAL(20, 8) NOT NULL,
  upper_price DECIMAL(20, 8) NOT NULL,
  investment_amount DECIMAL(20, 8) NOT NULL,
  take_profit_price DECIMAL(20, 8),
  stop_loss_price DECIMAL(20, 8),
  auto_refill BOOLEAN DEFAULT TRUE,
  refill_threshold DECIMAL(5, 2) DEFAULT 50.00,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_grid_trading_wallet ON grid_trading_configs(wallet_id);
CREATE INDEX IF NOT EXISTS idx_grid_trading_status ON grid_trading_configs(status);
CREATE INDEX IF NOT EXISTS idx_grid_trading_token ON grid_trading_configs(token_mint);

-- Grid Orders
CREATE TABLE IF NOT EXISTS grid_orders (
  id SERIAL PRIMARY KEY,
  grid_config_id INT NOT NULL REFERENCES grid_trading_configs(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  price_level DECIMAL(20, 8) NOT NULL,
  order_type VARCHAR(50) NOT NULL DEFAULT 'limit', -- limit, market
  side VARCHAR(10) NOT NULL, -- buy, sell
  quantity DECIMAL(20, 8) NOT NULL,
  filled_quantity DECIMAL(20, 8) DEFAULT 0,
  average_fill_price DECIMAL(20, 8),
  status VARCHAR(50) DEFAULT 'pending', -- pending, partially_filled, filled, cancelled
  profit_loss DECIMAL(20, 8),
  on_chain_order_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  filled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(grid_config_id, order_index)
);

CREATE INDEX idx_grid_orders_config ON grid_orders(grid_config_id);
CREATE INDEX idx_grid_orders_status ON grid_orders(status);

-- DCA Configurations
CREATE TABLE IF NOT EXISTS dca_configurations (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  token_mint VARCHAR(255) NOT NULL,
  base_token_mint VARCHAR(255) NOT NULL,
  investment_amount DECIMAL(20, 8) NOT NULL,
  frequency VARCHAR(50) NOT NULL DEFAULT 'daily', -- hourly, daily, weekly, monthly
  frequency_value INT NOT NULL DEFAULT 1, -- e.g., every 1 day
  total_orders INT NOT NULL DEFAULT 12,
  executed_orders INT DEFAULT 0,
  next_execution_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, failed
  average_buy_price DECIMAL(20, 8),
  total_spent DECIMAL(20, 8) DEFAULT 0,
  total_accumulated DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dca_wallet ON dca_configurations(wallet_id);
CREATE INDEX idx_dca_status ON dca_configurations(status);
CREATE INDEX idx_dca_next_execution ON dca_configurations(next_execution_time);

-- DCA Executions
CREATE TABLE IF NOT EXISTS dca_executions (
  id SERIAL PRIMARY KEY,
  dca_config_id INT NOT NULL REFERENCES dca_configurations(id) ON DELETE CASCADE,
  execution_number INT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  on_chain_tx_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, executed, failed
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dca_executions_config ON dca_executions(dca_config_id);
CREATE INDEX idx_dca_executions_status ON dca_executions(status);

-- Scalping Bot Configurations
CREATE TABLE IF NOT EXISTS scalping_bots (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  token_mint VARCHAR(255) NOT NULL,
  base_token_mint VARCHAR(255) NOT NULL,
  entry_point DECIMAL(5, 2) NOT NULL, -- e.g., 0.5% above support
  exit_profit_percent DECIMAL(5, 2) NOT NULL, -- e.g., 2.0% profit
  exit_loss_percent DECIMAL(5, 2) NOT NULL, -- e.g., -1.0% loss
  position_size DECIMAL(20, 8) NOT NULL,
  max_positions INT DEFAULT 5,
  check_interval INT DEFAULT 5, -- seconds
  status VARCHAR(50) DEFAULT 'active', -- active, paused, stopped
  trades_executed INT DEFAULT 0,
  profit_loss DECIMAL(20, 8) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scalping_wallet ON scalping_bots(wallet_id);
CREATE INDEX idx_scalping_status ON scalping_bots(status);

-- Scalping Trades
CREATE TABLE IF NOT EXISTS scalping_trades (
  id SERIAL PRIMARY KEY,
  bot_id INT NOT NULL REFERENCES scalping_bots(id) ON DELETE CASCADE,
  entry_price DECIMAL(20, 8) NOT NULL,
  exit_price DECIMAL(20, 8),
  quantity DECIMAL(20, 8) NOT NULL,
  profit_loss DECIMAL(20, 8),
  profit_loss_percent DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'open', -- open, closed, cancelled
  exit_reason VARCHAR(100), -- profit_target, stop_loss, manual
  entry_tx_hash VARCHAR(255),
  exit_tx_hash VARCHAR(255),
  entry_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scalping_trades_bot ON scalping_trades(bot_id);
CREATE INDEX idx_scalping_trades_status ON scalping_trades(status);

-- Arbitrage Opportunities
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  token_mint VARCHAR(255) NOT NULL,
  exchange_a VARCHAR(100) NOT NULL,
  exchange_b VARCHAR(100) NOT NULL,
  price_a DECIMAL(20, 8) NOT NULL,
  price_b DECIMAL(20, 8) NOT NULL,
  price_difference_percent DECIMAL(5, 2) NOT NULL,
  profit_potential DECIMAL(20, 8) NOT NULL,
  volume_available DECIMAL(20, 8) NOT NULL,
  confidence_score DECIMAL(5, 2) DEFAULT 0, -- 0-100
  status VARCHAR(50) DEFAULT 'pending', -- pending, executing, executed, failed, expired
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_arbitrage_wallet ON arbitrage_opportunities(wallet_id);
CREATE INDEX idx_arbitrage_status ON arbitrage_opportunities(status);
CREATE INDEX idx_arbitrage_detected ON arbitrage_opportunities(detected_at);

-- Arbitrage Executions
CREATE TABLE IF NOT EXISTS arbitrage_executions (
  id SERIAL PRIMARY KEY,
  opportunity_id INT NOT NULL REFERENCES arbitrage_opportunities(id) ON DELETE CASCADE,
  buy_exchange VARCHAR(100) NOT NULL,
  sell_exchange VARCHAR(100) NOT NULL,
  buy_price DECIMAL(20, 8) NOT NULL,
  sell_price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  buy_tx_hash VARCHAR(255),
  sell_tx_hash VARCHAR(255),
  bridge_tx_hash VARCHAR(255),
  actual_profit DECIMAL(20, 8),
  profit_percent DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'executing', -- executing, completed, failed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_arbitrage_exec_opportunity ON arbitrage_executions(opportunity_id);
CREATE INDEX idx_arbitrage_exec_status ON arbitrage_executions(status);

-- Portfolio Rebalancing Events
CREATE TABLE IF NOT EXISTS rebalancing_events (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  rebalancing_type VARCHAR(50) NOT NULL, -- threshold, scheduled, manual
  target_allocation_percent DECIMAL(5, 2) NOT NULL, -- e.g., 50 for 50%
  threshold_deviation DECIMAL(5, 2), -- e.g., 5 for 5% deviation trigger
  total_value DECIMAL(20, 8) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed', -- pending, executing, completed, failed
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rebalancing_wallet ON rebalancing_events(wallet_id);
CREATE INDEX idx_rebalancing_status ON rebalancing_events(status);

-- Rebalancing Allocations
CREATE TABLE IF NOT EXISTS rebalancing_allocations (
  id SERIAL PRIMARY KEY,
  rebalancing_event_id INT NOT NULL REFERENCES rebalancing_events(id) ON DELETE CASCADE,
  token_mint VARCHAR(255) NOT NULL,
  previous_allocation DECIMAL(5, 2) NOT NULL,
  target_allocation DECIMAL(5, 2) NOT NULL,
  previous_value DECIMAL(20, 8) NOT NULL,
  target_value DECIMAL(20, 8) NOT NULL,
  actual_value DECIMAL(20, 8),
  transaction_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' -- pending, executed, failed
);

CREATE INDEX idx_rebalancing_alloc_event ON rebalancing_allocations(rebalancing_event_id);

-- Stop Loss & Take Profit Orders
CREATE TABLE IF NOT EXISTS stop_loss_take_profit_orders (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  position_id INT, -- Reference to open position
  token_mint VARCHAR(255) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  stop_loss_price DECIMAL(20, 8),
  stop_loss_percent DECIMAL(5, 2),
  take_profit_price DECIMAL(20, 8),
  take_profit_percent DECIMAL(5, 2),
  take_profit_levels INT DEFAULT 1, -- For multiple TP levels
  triggered_type VARCHAR(50), -- stop_loss, take_profit_1, take_profit_2
  triggered_price DECIMAL(20, 8),
  status VARCHAR(50) DEFAULT 'active', -- active, triggered, cancelled
  total_pnl DECIMAL(20, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  triggered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sltp_wallet ON stop_loss_take_profit_orders(wallet_id);
CREATE INDEX idx_sltp_status ON stop_loss_take_profit_orders(status);
CREATE INDEX idx_sltp_token ON stop_loss_take_profit_orders(token_mint);

-- Position Cloning Configuration
CREATE TABLE IF NOT EXISTS position_clones (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  source_wallet_address VARCHAR(255) NOT NULL,
  source_wallet_label VARCHAR(255),
  clone_mode VARCHAR(50) NOT NULL DEFAULT '1to1', -- 1to1, scaled, percentage
  scale_factor DECIMAL(5, 2) DEFAULT 1.0, -- For scaling mode (e.g., 0.5 to trade 50%)
  copy_type VARCHAR(50) DEFAULT 'instant', -- instant, delayed (with delay_minutes)
  delay_minutes INT DEFAULT 0,
  max_copy_value DECIMAL(20, 8), -- Maximum value to copy per transaction
  min_position_size DECIMAL(20, 8), -- Minimum position to copy
  status VARCHAR(50) DEFAULT 'active', -- active, paused, stopped
  total_trades_copied INT DEFAULT 0,
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  copy_success_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_position_clone_wallet ON position_clones(wallet_id);
CREATE INDEX idx_position_clone_source ON position_clones(source_wallet_address);
CREATE INDEX idx_position_clone_status ON position_clones(status);

-- Clone Executions
CREATE TABLE IF NOT EXISTS clone_executions (
  id SERIAL PRIMARY KEY,
  clone_config_id INT NOT NULL REFERENCES position_clones(id) ON DELETE CASCADE,
  source_tx_hash VARCHAR(255) NOT NULL,
  source_entry_price DECIMAL(20, 8) NOT NULL,
  source_quantity DECIMAL(20, 8) NOT NULL,
  cloned_quantity DECIMAL(20, 8) NOT NULL,
  cloned_price DECIMAL(20, 8) NOT NULL,
  clone_tx_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, executed, failed, skipped
  skip_reason VARCHAR(100), -- position_too_small, exceeds_max_value, etc.
  source_pnl DECIMAL(20, 8),
  cloned_pnl DECIMAL(20, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clone_exec_config ON clone_executions(clone_config_id);
CREATE INDEX idx_clone_exec_status ON clone_executions(status);

-- Options/Futures Positions
CREATE TABLE IF NOT EXISTS options_futures_positions (
  id SERIAL PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  underlying_token VARCHAR(255) NOT NULL,
  position_type VARCHAR(50) NOT NULL, -- call, put, future
  contract_type VARCHAR(50) NOT NULL, -- american, european, perpetual
  strike_price DECIMAL(20, 8),
  expiry_date TIMESTAMP WITH TIME ZONE,
  quantity DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  current_value DECIMAL(20, 8),
  mark_to_market_pnl DECIMAL(20, 8),
  margin_used DECIMAL(20, 8),
  leverage DECIMAL(5, 2) DEFAULT 1.0,
  funding_rate DECIMAL(5, 6), -- For perpetuals
  status VARCHAR(50) DEFAULT 'open', -- open, closed, expired
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_options_futures_wallet ON options_futures_positions(wallet_id);
CREATE INDEX idx_options_futures_status ON options_futures_positions(status);
CREATE INDEX idx_options_futures_expiry ON options_futures_positions(expiry_date);

-- Options/Futures Orders
CREATE TABLE IF NOT EXISTS options_futures_orders (
  id SERIAL PRIMARY KEY,
  position_id INT REFERENCES options_futures_positions(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
  order_type VARCHAR(50) NOT NULL, -- limit, market
  side VARCHAR(50) NOT NULL, -- buy_call, sell_call, buy_put, sell_put, long, short
  quantity DECIMAL(20, 8) NOT NULL,
  filled_quantity DECIMAL(20, 8) DEFAULT 0,
  price DECIMAL(20, 8) NOT NULL,
  average_fill_price DECIMAL(20, 8),
  status VARCHAR(50) DEFAULT 'pending', -- pending, partially_filled, filled, cancelled
  on_chain_order_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  filled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_options_futures_order_position ON options_futures_orders(position_id);
CREATE INDEX idx_options_futures_order_wallet ON options_futures_orders(wallet_id);
CREATE INDEX idx_options_futures_order_status ON options_futures_orders(status);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grid_trading_configs_timestamp
BEFORE UPDATE ON grid_trading_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dca_configurations_timestamp
BEFORE UPDATE ON dca_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scalping_bots_timestamp
BEFORE UPDATE ON scalping_bots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_position_clones_timestamp
BEFORE UPDATE ON position_clones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
