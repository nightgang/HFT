const { query } = require('../db/connection');
const logger = require('../utils/logger');

class CrossChainModel {
  // Create a new cross-chain transaction
  static async create(txData) {
    const {
      wallet_id,
      bridge_direction,
      bridge_program,
      source_chain,
      source_tx_signature,
      source_token_mint,
      source_token_symbol,
      source_amount,
      target_chain,
      target_token_address,
      target_amount,
      target_recipient_address,
      bridge_fee_usd,
      gas_fee_usd
    } = txData;

    const sql = `
      INSERT INTO cross_chain_transactions (
        wallet_id, bridge_direction, bridge_program, source_chain,
        source_tx_signature, source_token_mint, source_token_symbol, source_amount,
        target_chain, target_token_address, target_amount, target_recipient_address,
        bridge_fee_usd, gas_fee_usd
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      wallet_id, bridge_direction, bridge_program, source_chain,
      source_tx_signature, source_token_mint, source_token_symbol, source_amount,
      target_chain, target_token_address, target_amount, target_recipient_address,
      bridge_fee_usd, gas_fee_usd
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Cross-chain transaction created: ${result.rows[0].bridge_tx_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating cross-chain transaction:', error);
      throw error;
    }
  }

  // Update cross-chain transaction status
  static async updateStatus(bridge_tx_id, status, target_tx_signature = null) {
    const updateField = status === 'confirmed' ? 'confirmed_at' : `${status}_at`;
    const sql = `
      UPDATE cross_chain_transactions
      SET status = $1, ${updateField} = CURRENT_TIMESTAMP, target_tx_signature = COALESCE($2, target_tx_signature)
      WHERE bridge_tx_id = $3
      RETURNING *
    `;
    try {
      const result = await query(sql, [status, target_tx_signature, bridge_tx_id]);
      logger.info(`Cross-chain transaction status updated: ${bridge_tx_id} -> ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating cross-chain transaction status:', error);
      throw error;
    }
  }

  // Get pending transactions
  static async getPendingTransactions() {
    const sql = `
      SELECT * FROM cross_chain_transactions
      WHERE status IN ('initiated', 'locked', 'minted')
      ORDER BY initiated_at ASC
    `;
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching pending transactions:', error);
      throw error;
    }
  }

  // Get transactions for wallet
  static async getTransactionsByWallet(wallet_id) {
    const sql = `
      SELECT * FROM cross_chain_transactions
      WHERE wallet_id = $1
      ORDER BY initiated_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching wallet transactions:', error);
      throw error;
    }
  }

  // Retry failed transaction
  static async retryTransaction(bridge_tx_id) {
    const sql = `
      UPDATE cross_chain_transactions
      SET status = 'initiated', failed_at = NULL, error_message = NULL, 
          retry_count = retry_count + 1, initiated_at = CURRENT_TIMESTAMP
      WHERE bridge_tx_id = $1 AND status = 'failed'
      RETURNING *
    `;
    try {
      const result = await query(sql, [bridge_tx_id]);
      if (result.rows.length === 0) {
        throw new Error('Transaction not found or cannot be retried');
      }
      logger.info(`Cross-chain transaction retry initiated: ${bridge_tx_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error retrying transaction:', error);
      throw error;
    }
  }

  static async getById(bridge_tx_id) {
    const sql = 'SELECT * FROM cross_chain_transactions WHERE bridge_tx_id = $1';
    try {
      const result = await query(sql, [bridge_tx_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching transaction:', error);
      throw error;
    }
  }
}

class BridgeRecordModel {
  // Create a bridge event record
  static async recordEvent(recordData) {
    const {
      bridge_tx_id,
      event_type,
      event_chain,
      event_tx_signature,
      event_data
    } = recordData;

    const sql = `
      INSERT INTO bridge_records (
        bridge_tx_id, event_type, event_chain, event_tx_signature, event_data
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [bridge_tx_id, event_type, event_chain, event_tx_signature, event_data];

    try {
      const result = await query(sql, values);
      logger.info(`Bridge event recorded: ${event_type}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording bridge event:', error);
      throw error;
    }
  }

  // Get bridge events
  static async getEventsByBridgeTx(bridge_tx_id) {
    const sql = `
      SELECT * FROM bridge_records
      WHERE bridge_tx_id = $1
      ORDER BY recorded_at ASC
    `;
    try {
      const result = await query(sql, [bridge_tx_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching bridge events:', error);
      throw error;
    }
  }
}

module.exports = { CrossChainModel, BridgeRecordModel };
