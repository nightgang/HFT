const express = require('express');
const router = express.Router();
const solanaWalletService = require('../services/solana-wallet.service');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply authentication to all wallet routes
router.use(authenticate);

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: List all wallets
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by wallet type
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of wallets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Wallet'
 */
router.get('/', async (req, res) => {
  try {
    const { type, active } = req.query;
    const filters = {};

    if (type) filters.type = type;
    if (active !== undefined) filters.active = active === 'true';

    const wallets = await solanaWalletService.listWallets(filters);

    res.json({
      success: true,
      data: wallets
    });
  } catch (error) {
    logger.error('Failed to list wallets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallets:
 *   post:
 *     summary: Create a new wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Wallet name
 *               derivationPath:
 *                 type: string
 *                 default: "m/44'/501'/0'/0'"
 *                 description: HD derivation path
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletCreateResponse'
 */
router.post('/', async (req, res) => {
  try {
    const { name, derivationPath } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Wallet name is required'
      });
    }

    const wallet = await solanaWalletService.createWallet({
      name,
      derivationPath
    });

    res.status(201).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    logger.error('Failed to create wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallets/import:
 *   post:
 *     summary: Import a wallet from private key
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - privateKey
 *             properties:
 *               privateKey:
 *                 type: string
 *                 description: Base58 or hex encoded private key
 *               name:
 *                 type: string
 *                 description: Wallet name
 *     responses:
 *       201:
 *         description: Wallet imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletImportResponse'
 */
router.post('/import', async (req, res) => {
  try {
    const { privateKey, name } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Private key is required'
      });
    }

    const wallet = await solanaWalletService.importWallet(privateKey, { name });

    res.status(201).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    logger.error('Failed to import wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallets/import-mnemonic:
 *   post:
 *     summary: Import a wallet from BIP39 mnemonic
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mnemonic
 *             properties:
 *               mnemonic:
 *                 type: string
 *                 description: BIP39 mnemonic phrase
 *               name:
 *                 type: string
 *                 description: Wallet name
 *               derivationPath:
 *                 type: string
 *                 default: "m/44'/501'/0'/0'"
 *                 description: HD derivation path
 *     responses:
 *       201:
 *         description: Wallet imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletImportResponse'
 */
router.post('/import-mnemonic', async (req, res) => {
  try {
    const { mnemonic, name, derivationPath } = req.body;

    if (!mnemonic) {
      return res.status(400).json({
        success: false,
        error: 'Mnemonic is required'
      });
    }

    const wallet = await solanaWalletService.importFromMnemonic(mnemonic, {
      name,
      derivationPath
    });

    res.status(201).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    logger.error('Failed to import wallet from mnemonic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallets/{address}:
 *   get:
 *     summary: Get wallet information
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Solana wallet address
 *     responses:
 *       200:
 *         description: Wallet information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletInfo'
 */
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!solanaWalletService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Solana address format'
      });
    }

    const wallet = await solanaWalletService.getWalletInfo(address);

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    logger.error(`Failed to get wallet info for ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallets/{address}/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Solana wallet address
 *     responses:
 *       200:
 *         description: Wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                 balance:
 *                   type: number
 *                   description: Balance in SOL
 *                 lamports:
 *                   type: number
 *                   description: Balance in lamports
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 */
router.get('/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;

    if (!solanaWalletService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Solana address format'
      });
    }

    const balance = await solanaWalletService.getBalance(address);

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    logger.error(`Failed to get balance for ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallets/{address}/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Solana wallet address
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of transactions to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Transaction signature to start before
 *     responses:
 *       200:
 *         description: Transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   signature:
 *                     type: string
 *                   slot:
 *                     type: number
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   confirmationStatus:
 *                     type: string
 *                   transaction:
 *                     type: object
 */
router.get('/:address/transactions', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit, before } = req.query;

    if (!solanaWalletService.isValidAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Solana address format'
      });
    }

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (before) options.before = before;

    const transactions = await solanaWalletService.getTransactionHistory(address, options);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    logger.error(`Failed to get transactions for ${req.params.address}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallets/validate-address:
 *   post:
 *     summary: Validate Solana address format
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: Address to validate
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 address:
 *                   type: string
 */
router.post('/validate-address', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    const isValid = solanaWalletService.isValidAddress(address);

    res.json({
      success: true,
      data: {
        valid: isValid,
        address
      }
    });
  } catch (error) {
    logger.error('Failed to validate address:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;