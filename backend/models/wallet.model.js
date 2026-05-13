const { query, getClient } = require('../db/connection');
const logger = require('../utils/logger');
const keyService = require('../services/security/key.service');

class WalletModel {
  // Create a new wallet
  static async create(walletData) {
    const {
      wallet_address,
      wallet_name,
      wallet_type = 'standard',
      parent_wallet_id = null,
      spending_limit_usd = 0,
      daily_spending_usd = 0,
      multisig_signers = null,
      multisig_threshold = null,
      multisig_address = null,
      metadata = null,
      private_key, // Plain private key
      key_derivation_path,
      notes
    } = walletData;

    // Encrypt private key
    let encrypted_private_key = null;
    if (private_key) {
      encrypted_private_key = await keyService.encryptPrivateKey(private_key);
    }

    const sql = `
      INSERT INTO wallets (
        wallet_address, wallet_name, wallet_type,
        parent_wallet_id, spending_limit_usd, daily_spending_usd,
        multisig_signers, multisig_threshold,
        multisig_address, metadata,
        encrypted_private_key, key_derivation_path, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_address,
        wallet_name,
        wallet_type,
        parent_wallet_id,
        spending_limit_usd,
        daily_spending_usd,
        multisig_signers,
        multisig_threshold,
        multisig_address,
        metadata,
        encrypted_private_key,
        key_derivation_path,
        notes
      ]);
      logger.info(`Wallet created: ${wallet_address}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating wallet:', error);
      throw error;
    }
  }

  // Get wallet by address
  static async getByAddress(walletAddress) {
    const sql = 'SELECT * FROM wallets WHERE wallet_address = $1 AND is_active = true';
    try {
      const result = await query(sql, [walletAddress]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting wallet by address:', error);
      throw error;
    }
  }

  // Get decrypted private key for a wallet
  static async getDecryptedPrivateKey(walletId) {
    const sql = 'SELECT encrypted_private_key FROM wallets WHERE wallet_id = $1 AND is_active = true';
    try {
      const result = await query(sql, [walletId]);
      if (!result.rows[0] || !result.rows[0].encrypted_private_key) {
        throw new Error('Wallet or private key not found');
      }

      const decrypted = await keyService.decryptPrivateKey(result.rows[0].encrypted_private_key);

      // Audit key access
      await keyService.logKeyAccess(walletId, 'decrypt_private_key', true);

      return decrypted;
    } catch (error) {
      logger.error('Error decrypting private key:', error);
      await keyService.logKeyAccess(walletId, 'decrypt_private_key', false);
      throw error;
    }
  }

  static async createMultisigWallet(walletData) {
    return this.create({ ...walletData, wallet_type: 'multisig' });
  }

  // Get all active wallets
  static async getAllActive() {
    const sql = 'SELECT * FROM wallets WHERE is_active = true ORDER BY created_at DESC';
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      logger.error('Error getting all active wallets:', error);
      throw error;
    }
  }

  static async getChildWallets(parentWalletId) {
    const sql = 'SELECT * FROM wallets WHERE parent_wallet_id = $1 AND is_active = true ORDER BY created_at DESC';
    try {
      const result = await query(sql, [parentWalletId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting child wallets:', error);
      throw error;
    }
  }

  static async getMultisigWallets() {
    const sql = 'SELECT * FROM wallets WHERE wallet_type = $1 AND is_active = true ORDER BY created_at DESC';
    try {
      const result = await query(sql, ['multisig']);
      return result.rows;
    } catch (error) {
      logger.error('Error getting multisig wallets:', error);
      throw error;
    }
  }

  // Update wallet
  static async update(walletId, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(walletId);
    const sql = `
      UPDATE wallets
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await query(sql, values);
      logger.info(`Wallet updated: ${walletId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating wallet:', error);
      throw error;
    }
  }

  // Deactivate wallet
  static async deactivate(walletId) {
    const sql = 'UPDATE wallets SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $1 RETURNING *';
    try {
      const result = await query(sql, [walletId]);
      logger.info(`Wallet deactivated: ${walletId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deactivating wallet:', error);
      throw error;
    }
  }

  // Get wallet balance
  static async getBalance(walletId, tokenMint) {
    const sql = 'SELECT * FROM wallet_balances WHERE wallet_id = $1 AND token_mint = $2';
    try {
      const result = await query(sql, [walletId, tokenMint]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  // Update wallet balance
  static async updateBalance(walletId, tokenMint, newBalance, reservedBalance = 0) {
    const sql = `
      INSERT INTO wallet_balances (wallet_id, token_mint, balance, reserved_balance)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (wallet_id, token_mint)
      DO UPDATE SET
        balance = EXCLUDED.balance,
        reserved_balance = EXCLUDED.reserved_balance,
        recorded_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await query(sql, [walletId, tokenMint, newBalance, reservedBalance]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating wallet balance:', error);
      throw error;
    }
  }

  // Get wallet performance
  static async getPerformance(walletId) {
    const sql = 'SELECT * FROM wallet_performance WHERE wallet_id = $1';
    try {
      const result = await query(sql, [walletId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting wallet performance:', error);
      throw error;
    }
  }

  // Update wallet performance
  static async updatePerformance(walletId, performanceData) {
    const {
      total_trades,
      successful_trades,
      failed_trades,
      total_pnl,
      roi_percent,
      win_rate_percent,
      last_trade_at
    } = performanceData;

    const sql = `
      INSERT INTO wallet_performance (
        wallet_id, total_trades, successful_trades, failed_trades,
        total_pnl, roi_percent, win_rate_percent, last_trade_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (wallet_id)
      DO UPDATE SET
        total_trades = EXCLUDED.total_trades,
        successful_trades = EXCLUDED.successful_trades,
        failed_trades = EXCLUDED.failed_trades,
        total_pnl = EXCLUDED.total_pnl,
        roi_percent = EXCLUDED.roi_percent,
        win_rate_percent = EXCLUDED.win_rate_percent,
        last_trade_at = EXCLUDED.last_trade_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        walletId, total_trades, successful_trades, failed_trades,
        total_pnl, roi_percent, win_rate_percent, last_trade_at
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating wallet performance:', error);
      throw error;
    }
  }
}

module.exports = WalletModel;