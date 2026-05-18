const sodium = require('libsodium-wrappers');
const crypto = require('crypto');
const bip39 = require('bip39');
const hdkey = require('hdkey');
const { Keypair } = require('@solana/web3.js');
const logger = require('../../utils/logger');
const secretsService = require('./secrets.service');
const { query } = require('../../db/connection');

class KeyService {
  constructor() {
    this.initialized = false;
    this.masterKey = null;
  }

  // Initialize sodium
  async initialize() {
    if (this.initialized) return;

    await sodium.ready;
    logger.info('Libsodium initialized for key encryption');

    // Generate or load master key for encryption
    this.masterKey = this.getMasterKey();
    this.initialized = true;
  }

  // Get master encryption key from environment or generate one
  getMasterKey() {
    const envKey = secretsService.getSecretSync('MASTER_ENCRYPTION_KEY') || process.env.MASTER_ENCRYPTION_KEY;
    if (envKey) {
      return Buffer.from(envKey, 'hex');
    }

    logger.warn('No MASTER_ENCRYPTION_KEY provided, generating temporary key');
    logger.warn('This is NOT secure for production - key will be lost on restart');
    return crypto.randomBytes(32);
  }

  // Encrypt private key
  async encryptPrivateKey(privateKey) {
    await this.initialize();

    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const keyUint8 = sodium.from_hex(this.masterKey.toString('hex'));
    const messageUint8 = sodium.from_string(privateKey);
    const encrypted = sodium.crypto_secretbox_easy(messageUint8, nonce, keyUint8);

    // Return as hex string: nonce + encrypted data
    return sodium.to_hex(nonce) + sodium.to_hex(encrypted);
  }

  // Decrypt private key
  async decryptPrivateKey(encryptedKey) {
    await this.initialize();

    try {
      const encryptedBytes = sodium.from_hex(encryptedKey);
      const nonce = encryptedBytes.slice(0, sodium.crypto_secretbox_NONCEBYTES);
      const ciphertext = encryptedBytes.slice(sodium.crypto_secretbox_NONCEBYTES);

      const keyUint8 = sodium.from_hex(this.masterKey.toString('hex'));
      const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, keyUint8);

      return sodium.to_string(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt private key:', error);
      throw new Error('Invalid encrypted key or wrong master key');
    }
  }

  // Generate new wallet with BIP39 mnemonic
  async generateWallet(derivationPath = "m/44'/501'/0'/0'") {
    const mnemonic = bip39.generateMnemonic();
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Use ed25519-hd-key for proper Solana key derivation
    const { derivePath } = await import('ed25519-hd-key');
    const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);

    const privateKey = Buffer.from(keypair.secretKey).toString('hex');
    const publicKey = keypair.publicKey.toBase58();

    return {
      mnemonic,
      privateKey,
      publicKey,
      derivationPath
    };
  }

  // Validate derivation path
  validateDerivationPath(path) {
    const bip44Regex = /^m\/44'\/501'\/\d+'\/\d+'$/;
    return bip44Regex.test(path);
  }

  // Rotate encryption key (for key rotation)
  async rotateMasterKey(newMasterKeyHex) {
    await this.initialize();

    logger.info('Starting key rotation...');

    // Get all wallets
    const wallets = await query('SELECT wallet_id, encrypted_private_key FROM wallets WHERE encrypted_private_key IS NOT NULL');

    for (const wallet of wallets.rows) {
      try {
        // Decrypt with old key
        const oldKey = this.decryptPrivateKey(wallet.encrypted_private_key);

        // Update master key
        this.masterKey = Buffer.from(newMasterKeyHex, 'hex');

        // Re-encrypt with new key
        const newEncrypted = await this.encryptPrivateKey(oldKey);

        // Update in database
        await query(
          'UPDATE wallets SET encrypted_private_key = $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2',
          [newEncrypted, wallet.wallet_id]
        );

        logger.info(`Rotated key for wallet ${wallet.wallet_id}`);
      } catch (error) {
        logger.error(`Failed to rotate key for wallet ${wallet.wallet_id}:`, error);
      }
    }

    // Update environment variable (in production, update secure storage)
    process.env.MASTER_ENCRYPTION_KEY = newMasterKeyHex;
    logger.info('Key rotation completed');
  }

  // Audit key access
  async logKeyAccess(walletId, action, success = true, ipAddress = null, userAgent = null) {
    try {
      // Check if audit_logs table exists, if not just log to console
      const auditLog = {
        action,
        resource_type: 'wallet_key',
        resource_id: walletId,
        success,
        details: { timestamp: new Date().toISOString() },
        ip_address: ipAddress,
        user_agent: userAgent
      };

      try {
        await query(`
          INSERT INTO audit_logs (action, resource_type, resource_id, success, details, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          action,
          'wallet_key',
          walletId,
          success,
          JSON.stringify({ timestamp: new Date().toISOString() }),
          ipAddress,
          userAgent
        ]);
      } catch (dbError) {
        if (dbError.code === '42P01') {
          logger.warn('audit_logs missing; fallback to mem log for stability');
        } else {
          throw dbError;
        }
      }

      logger.info(`Key access audit: ${action} on wallet ${walletId} - ${success ? 'SUCCESS' : 'FAILED'}`, auditLog);
    } catch (error) {
      logger.error('Failed to audit key access:', error);
    }
  }

  // Backup key material (for disaster recovery)
  async createKeyBackup(walletId) {
    const wallet = await query('SELECT * FROM wallets WHERE wallet_id = $1', [walletId]);

    if (!wallet.rows[0]) {
      throw new Error('Wallet not found');
    }

    const backup = {
      wallet_id: wallet.rows[0].wallet_id,
      wallet_address: wallet.rows[0].wallet_address,
      key_derivation_path: wallet.rows[0].key_derivation_path,
      encrypted_private_key: wallet.rows[0].encrypted_private_key,
      backup_created_at: new Date().toISOString(),
      master_key_hash: crypto.createHash('sha256').update(this.masterKey).digest('hex')
    };

    // In production, store this encrypted backup in secure storage
    logger.info(`Key backup created for wallet ${walletId}`);
    return backup;
  }

  // Validate key integrity
  async validateKeyIntegrity(walletId) {
    const wallet = await query('SELECT * FROM wallets WHERE wallet_id = $1', [walletId]);

    if (!wallet.rows[0] || !wallet.rows[0].encrypted_private_key) {
      return { valid: false, error: 'Wallet or key not found' };
    }

    try {
      // Try to decrypt
      await this.decryptPrivateKey(wallet.rows[0].encrypted_private_key);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = new KeyService();