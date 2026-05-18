const { Keypair, PublicKey, Connection, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bip39 = require('bip39');
const logger = require('../utils/logger');
const keyService = require('./security/key.service');
const WalletModel = require('../models/wallet.model');
const walletRepository = require('../repositories/wallet.repository');

class SolanaWalletService {
  constructor() {
    this.connection = new Connection(process.env.RPC_URL || 'https://api.devnet.solana.com');
  }

  /**
   * Create a new Solana wallet with BIP39 mnemonic
   * @param {Object} options - Wallet creation options
   * @param {string} options.name - Wallet name
   * @param {string} options.derivationPath - HD derivation path (default: "m/44'/501'/0'/0'")
   * @returns {Promise<Object>} Wallet data
   */
  async createWallet(options = {}) {
    try {
      const { name = 'New Wallet', derivationPath = "m/44'/501'/0'/0'" } = options;

      // Generate BIP39 mnemonic
      const mnemonic = bip39.generateMnemonic();

      // Derive seed from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);

      // Derive keypair from seed using derivation path
      const { derivePath } = await import('ed25519-hd-key');
      const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
      const keypair = Keypair.fromSeed(derivedSeed);

      // Encrypt private key
      const privateKeyHex = Buffer.from(keypair.secretKey).toString('hex');
      const encryptedPrivateKey = await keyService.encryptPrivateKey(privateKeyHex);

      // Prepare wallet data for database
      const walletData = {
        wallet_address: keypair.publicKey.toBase58(),
        wallet_name: name,
        wallet_type: 'standard',
        encrypted_private_key: encryptedPrivateKey,
        key_derivation_path: derivationPath,
        metadata: {
          created_via: 'bip39',
          derivation_path: derivationPath,
          created_at: new Date().toISOString()
        }
      };

      // Save to database
      const savedWallet = await WalletModel.create(walletData);

      logger.info(`Created new Solana wallet: ${keypair.publicKey.toBase58()}`);

      return {
        wallet_id: savedWallet.wallet_id,
        publicKey: keypair.publicKey.toBase58(),
        mnemonic: mnemonic, // WARNING: Only return mnemonic for new wallets, never store it
        derivationPath,
        name,
        created: true
      };
    } catch (error) {
      logger.error('Failed to create Solana wallet:', error);
      throw new Error(`Wallet creation failed: ${error.message}`);
    }
  }

  /**
   * Import wallet from private key
   * @param {string} privateKey - Base58 encoded private key or hex string
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Wallet data
   */
  async importWallet(privateKey, options = {}) {
    try {
      const { name = 'Imported Wallet' } = options;

      let keypair;

      // Try to parse as base58 first, then hex
      try {
        // Assume base58 encoded secret key
        const secretKey = Uint8Array.from(Buffer.from(privateKey, 'base64'));
        keypair = Keypair.fromSecretKey(secretKey);
      } catch (e) {
        // Try hex format
        const secretKey = Uint8Array.from(Buffer.from(privateKey, 'hex'));
        keypair = Keypair.fromSecretKey(secretKey);
      }

      // Check if wallet already exists
      const existingWallet = await WalletModel.getByAddress(keypair.publicKey.toBase58());
      if (existingWallet) {
        throw new Error('Wallet already exists in the system');
      }

      // Encrypt private key
      const privateKeyHex = Buffer.from(keypair.secretKey).toString('hex');
      const encryptedPrivateKey = await keyService.encryptPrivateKey(privateKeyHex);

      // Prepare wallet data
      const walletData = {
        wallet_address: keypair.publicKey.toBase58(),
        wallet_name: name,
        wallet_type: 'imported',
        encrypted_private_key: encryptedPrivateKey,
        metadata: {
          imported_at: new Date().toISOString(),
          import_method: 'private_key'
        }
      };

      // Save to database
      const savedWallet = await WalletModel.create(walletData);

      logger.info(`Imported Solana wallet: ${keypair.publicKey.toBase58()}`);

      return {
        wallet_id: savedWallet.wallet_id,
        publicKey: keypair.publicKey.toBase58(),
        name,
        imported: true
      };
    } catch (error) {
      logger.error('Failed to import Solana wallet:', error);
      throw new Error(`Wallet import failed: ${error.message}`);
    }
  }

  /**
   * Import wallet from mnemonic
   * @param {string} mnemonic - BIP39 mnemonic phrase
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Wallet data
   */
  async importFromMnemonic(mnemonic, options = {}) {
    try {
      const { name = 'Imported Wallet', derivationPath = "m/44'/501'/0'/0'" } = options;

      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid BIP39 mnemonic phrase');
      }

      // Derive seed from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);

      // Derive keypair from seed
      const { derivePath } = await import('ed25519-hd-key');
      const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
      const keypair = Keypair.fromSeed(derivedSeed);

      // Check if wallet already exists
      const existingWallet = await WalletModel.getByAddress(keypair.publicKey.toBase58());
      if (existingWallet) {
        throw new Error('Wallet already exists in the system');
      }

      // Encrypt private key
      const privateKeyHex = Buffer.from(keypair.secretKey).toString('hex');
      const encryptedPrivateKey = await keyService.encryptPrivateKey(privateKeyHex);

      // Prepare wallet data
      const walletData = {
        wallet_address: keypair.publicKey.toBase58(),
        wallet_name: name,
        wallet_type: 'imported',
        encrypted_private_key: encryptedPrivateKey,
        key_derivation_path: derivationPath,
        metadata: {
          imported_at: new Date().toISOString(),
          import_method: 'mnemonic',
          derivation_path: derivationPath
        }
      };

      // Save to database
      const savedWallet = await WalletModel.create(walletData);

      logger.info(`Imported Solana wallet from mnemonic: ${keypair.publicKey.toBase58()}`);

      return {
        wallet_id: savedWallet.wallet_id,
        publicKey: keypair.publicKey.toBase58(),
        name,
        derivationPath,
        imported: true
      };
    } catch (error) {
      logger.error('Failed to import Solana wallet from mnemonic:', error);
      throw new Error(`Wallet import failed: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   * @param {string} walletAddress - Solana wallet address
   * @returns {Promise<Object>} Balance information
   */
  async getBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);

      return {
        address: walletAddress,
        balance: balance / LAMPORTS_PER_SOL, // Convert lamports to SOL
        lamports: balance,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to get balance for ${walletAddress}:`, error);
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }

  /**
   * Get wallet information
   * @param {string} walletAddress - Solana wallet address
   * @returns {Promise<Object>} Wallet information
   */
  async getWalletInfo(walletAddress) {
    try {
      const wallet = await WalletModel.getByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const balance = await this.getBalance(walletAddress);

      return {
        wallet_id: wallet.wallet_id,
        address: wallet.wallet_address,
        name: wallet.wallet_name,
        type: wallet.wallet_type,
        balance: balance.balance,
        lamports: balance.lamports,
        isActive: wallet.is_active,
        createdAt: wallet.created_at,
        metadata: wallet.metadata
      };
    } catch (error) {
      logger.error(`Failed to get wallet info for ${walletAddress}:`, error);
      throw new Error(`Wallet info retrieval failed: ${error.message}`);
    }
  }

  /**
   * List all wallets
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of wallets
   */
  async listWallets(filters = {}) {
    try {
      const { type, active = true } = filters;

      let wallets;
      if (type) {
        // This would need to be implemented in WalletModel
        wallets = await WalletModel.getByType(type, active);
      } else {
        wallets = await WalletModel.getAll(active);
      }

      // Get balances for all wallets
      const walletInfos = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const balance = await this.getBalance(wallet.wallet_address);
            return {
              wallet_id: wallet.wallet_id,
              address: wallet.wallet_address,
              name: wallet.wallet_name,
              type: wallet.wallet_type,
              balance: balance.balance,
              lamports: balance.lamports,
              isActive: wallet.is_active,
              createdAt: wallet.created_at
            };
          } catch (error) {
            // Return wallet info without balance if balance check fails
            return {
              wallet_id: wallet.wallet_id,
              address: wallet.wallet_address,
              name: wallet.wallet_name,
              type: wallet.wallet_type,
              balance: null,
              lamports: null,
              isActive: wallet.is_active,
              createdAt: wallet.created_at,
              balanceError: error.message
            };
          }
        })
      );

      return walletInfos;
    } catch (error) {
      logger.error('Failed to list wallets:', error);
      throw new Error(`Wallet listing failed: ${error.message}`);
    }
  }

  /**
   * Get decrypted keypair for a wallet (use with caution)
   * @param {string} walletAddress - Solana wallet address
   * @returns {Promise<Keypair>} Solana keypair
   */
  async getKeypair(walletAddress) {
    try {
      const wallet = await WalletModel.getByAddress(walletAddress);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (!wallet.encrypted_private_key) {
        throw new Error('Wallet has no private key stored');
      }

      // Decrypt private key
      const privateKeyHex = await keyService.decryptPrivateKey(wallet.encrypted_private_key);
      const secretKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));

      return Keypair.fromSecretKey(secretKey);
    } catch (error) {
      logger.error(`Failed to get keypair for ${walletAddress}:`, error);
      throw new Error(`Keypair retrieval failed: ${error.message}`);
    }
  }

  /**
   * Validate Solana address format
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid
   */
  isValidAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get wallet transaction history
   * @param {string} walletAddress - Solana wallet address
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(walletAddress, options = {}) {
    try {
      const { limit = 50, before = null } = options;
      const publicKey = new PublicKey(walletAddress);

      const signatures = await this.connection.getSignaturesForAddress(publicKey, {
        limit,
        before
      });

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await this.connection.getTransaction(sig.signature);
            return {
              signature: sig.signature,
              slot: sig.slot,
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
              confirmationStatus: sig.confirmationStatus,
              transaction: tx
            };
          } catch (error) {
            return {
              signature: sig.signature,
              slot: sig.slot,
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
              confirmationStatus: sig.confirmationStatus,
              error: error.message
            };
          }
        })
      );

      return transactions;
    } catch (error) {
      logger.error(`Failed to get transaction history for ${walletAddress}:`, error);
      throw new Error(`Transaction history retrieval failed: ${error.message}`);
    }
  }
}

module.exports = new SolanaWalletService();