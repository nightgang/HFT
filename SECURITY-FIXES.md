# 🔧 Security Fixes - Implementation Guide

**Created**: 2026-05-07  
**Target Completion**: Week 1-4  
**Status**: Planning Phase

---

## 📋 Overview

This document provides detailed implementation code for all security vulnerabilities identified in `SECURITY.md`.

---

## 🔴 P0: CRITICAL FIXES (Week 1)

### Fix #1: Private Key Encryption with AWS KMS

**File**: `backend/services/keyManagement.js` (NEW)

```javascript
const AWS = require('aws-sdk');
const crypto = require('crypto');
const logger = require('../utils/logger');

class KeyManagementService {
  constructor() {
    this.kms = new AWS.KMS({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.keyId = process.env.KMS_KEY_ID;
  }

  /**
   * Encrypt private key using AWS KMS
   * @param {string} privateKey - Raw private key
   * @returns {Promise<Object>} Encrypted key data
   */
  async encryptPrivateKey(privateKey) {
    try {
      if (!privateKey || privateKey.length === 0) {
        throw new Error('Private key cannot be empty');
      }

      const params = {
        KeyId: this.keyId,
        Plaintext: Buffer.from(privateKey)
      };

      const result = await this.kms.encrypt(params).promise();
      
      return {
        encrypted: result.CiphertextBlob.toString('base64'),
        encryptionKeyId: this.keyId,
        encryptedAt: new Date().toISOString(),
        algorithm: 'aws-kms-aes256'
      };
    } catch (error) {
      logger.error('Key encryption failed:', error);
      throw new Error('Failed to encrypt private key');
    }
  }

  /**
   * Decrypt private key using AWS KMS
   * @param {string} encryptedKey - Base64 encrypted key
   * @returns {Promise<string>} Decrypted private key
   */
  async decryptPrivateKey(encryptedKey) {
    try {
      const params = {
        CiphertextBlob: Buffer.from(encryptedKey, 'base64')
      };

      const result = await this.kms.decrypt(params).promise();
      
      // Audit log the decryption
      await require('../utils/audit').logKeyAccess(
        'private_key_decrypted',
        this.keyId,
        true
      );

      return result.Plaintext.toString();
    } catch (error) {
      logger.error('Key decryption failed:', error);
      
      // Audit failed decryption
      await require('../utils/audit').logKeyAccess(
        'private_key_decryption_failed',
        this.keyId,
        false
      );

      throw new Error('Failed to decrypt private key');
    }
  }

  /**
   * Rotate encryption key
   * Schedule: Every 90 days
   */
  async rotateKeySchedule() {
    const rotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    setInterval(async () => {
      try {
        logger.info('Starting key rotation process');
        
        // Get new KMS key from rotation service
        const newKeyId = await this.getNewKeyVersion();
        
        // Re-encrypt all stored keys with new key
        const wallets = await require('../models/Wallet').find({
          encryptedPrivateKey: { $exists: true }
        });

        for (const wallet of wallets) {
          const decrypted = await this.decryptPrivateKey(
            wallet.encryptedPrivateKey
          );
          
          this.keyId = newKeyId;
          const reencrypted = await this.encryptPrivateKey(decrypted);
          
          wallet.encryptedPrivateKey = reencrypted.encrypted;
          await wallet.save();
        }

        logger.info('Key rotation completed successfully');
      } catch (error) {
        logger.error('Key rotation failed:', error);
        // Alert ops team
      }
    }, rotationInterval);
  }

  /**
   * Request new key version (from AWS KMS)
   */
  async getNewKeyVersion() {
    const params = {
      Description: `HFT Trading System Key - Rotated ${new Date().toISOString()}`,
      Origin: 'AWS_KMS'
    };

    const result = await this.kms.createKey(params).promise();
    return result.KeyMetadata.KeyId;
  }

  /**
   * Generate new wallet with encrypted key
   */
  async generateSecureWallet(walletName) {
    const { Keypair } = require('@solana/web3.js');
    const keypair = Keypair.generate();
    
    const privateKeyString = Buffer.from(keypair.secretKey).toString('hex');
    const encrypted = await this.encryptPrivateKey(privateKeyString);

    return {
      walletName,
      publicKey: keypair.publicKey.toString(),
      encrypted,
      createdAt: new Date(),
      status: 'active'
    };
  }
}

module.exports = new KeyManagementService();
```

---

### Fix #2: Password Hashing & 2FA Authentication

**File**: `backend/middleware/auth.js` (UPDATED)

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

// Constants
const BCRYPT_ROUNDS = 10;
const JWT_EXPIRY = '24h';
const FAILED_LOGIN_LIMIT = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

class AuthenticationService {
  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password) {
    if (!password || password.length < 12) {
      throw new Error('Password must be at least 12 characters');
    }
    
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate JWT token
   */
  static generateToken(user) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET not configured or too short');
    }

    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY,
        algorithm: 'HS256',
        issuer: 'hft-trading-system',
        audience: 'hft-api'
      }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'hft-trading-system',
        audience: 'hft-api'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Setup 2FA for user (TOTP)
   */
  static async setupTwoFA(userId) {
    const secret = speakeasy.generateSecret({
      name: `HFT Trading System (${userId})`,
      issuer: 'nightgang-hft',
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes: this.generateBackupCodes(),
      provisionalToken: jwt.sign(
        { userId, temp2FA: true },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      )
    };
  }

  /**
   * Verify 2FA token (TOTP)
   */
  static async verifyTwoFA(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time windows
    });
  }

  /**
   * Generate backup codes (8)
   */
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Check account lockout
   */
  static async checkAccountLockout(userId) {
    const lockoutKey = `lockout:${userId}`;
    const attempts = await require('../utils/cache').get(lockoutKey) || 0;

    if (attempts >= FAILED_LOGIN_LIMIT) {
      throw new Error('Account locked due to failed login attempts. Try again in 15 minutes.');
    }

    return attempts;
  }

  /**
   * Record failed login
   */
  static async recordFailedLogin(userId) {
    const lockoutKey = `lockout:${userId}`;
    const attempts = (await require('../utils/cache').get(lockoutKey) || 0) + 1;

    await require('../utils/cache').set(
      lockoutKey,
      attempts,
      LOCKOUT_DURATION / 1000
    );

    if (attempts >= FAILED_LOGIN_LIMIT) {
      logger.warn(`Account locked: ${userId} (${attempts} failed attempts)`);
    }
  }

  /**
   * Clear failed login attempts
   */
  static async clearFailedLogins(userId) {
    const lockoutKey = `lockout:${userId}`;
    await require('../utils/cache').delete(lockoutKey);
  }
}

// Express middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.substring(7);
    const user = AuthenticationService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireTwoFA = (req, res, next) => {
  if (!req.user.twoFAVerified) {
    return res.status(403).json({ error: 'Two-factor authentication required' });
  }
  next();
};

module.exports = {
  AuthenticationService,
  authenticate,
  requireTwoFA
};
```

---

### Fix #3: Secrets Management with HashiCorp Vault

**File**: `backend/services/secretsManager.js` (NEW)

```javascript
const axios = require('axios');
const logger = require('../utils/logger');

class SecretsManager {
  constructor() {
    this.vaultUrl = process.env.VAULT_ADDR;
    this.vaultToken = process.env.VAULT_TOKEN;
    
    if (!this.vaultUrl || !this.vaultToken) {
      throw new Error('VAULT_ADDR and VAULT_TOKEN environment variables required');
    }

    this.client = axios.create({
      baseURL: this.vaultUrl,
      headers: {
        'X-Vault-Token': this.vaultToken
      }
    });
  }

  /**
   * Store secret in Vault
   */
  async storeSecret(path, secretData) {
    try {
      const response = await this.client.post(`/v1/secret/data/${path}`, {
        data: secretData
      });

      logger.info(`Secret stored: ${path}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to store secret ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Retrieve secret from Vault
   */
  async getSecret(path) {
    try {
      const response = await this.client.get(`/v1/secret/data/${path}`);
      return response.data.data.data;
    } catch (error) {
      logger.error(`Failed to retrieve secret ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Initialize all secrets at startup
   */
  async initializeSecrets() {
    const requiredSecrets = [
      'helius-api-key',
      'jwt-secret',
      'admin-credentials',
      'solana-rpc-url'
    ];

    const secrets = {};

    for (const secret of requiredSecrets) {
      try {
        secrets[secret] = await this.getSecret(secret);
      } catch (error) {
        logger.error(`Missing required secret: ${secret}`);
        throw new Error(`Configuration error: ${secret} not found in Vault`);
      }
    }

    return secrets;
  }

  /**
   * Rotate API keys
   * Schedule: Every 30 days
   */
  async rotateApiKeys() {
    const rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days

    setInterval(async () => {
      try {
        logger.info('Starting API key rotation');

        const newHeliusKey = await this.generateNewApiKey('helius');
        const newJupiterKey = await this.generateNewApiKey('jupiter');

        await this.storeSecret('helius-api-key', { key: newHeliusKey });
        await this.storeSecret('jupiter-api-key', { key: newJupiterKey });

        logger.info('API key rotation completed');
      } catch (error) {
        logger.error('API key rotation failed:', error);
      }
    }, rotationInterval);
  }

  /**
   * Generate new API key from provider
   */
  async generateNewApiKey(provider) {
    // Implementation depends on provider
    // This is a placeholder
    return `new-${provider}-key-${Date.now()}`;
  }

  /**
   * Audit secret access
   */
  async auditSecretAccess(path, userId, success) {
    try {
      await require('../models/AuditLog').create({
        action: 'secret_accessed',
        path,
        userId,
        success,
        timestamp: new Date(),
        ip: process.env.REQUEST_IP
      });
    } catch (error) {
      logger.error('Audit logging failed:', error);
    }
  }
}

module.exports = new SecretsManager();
```

---

### Fix #4: Database Schema with Encryption

**File**: `backend/models/User.js` (NEW)

```javascript
const mongoose = require('mongoose');
const crypto = require('crypto');
const { AuthenticationService } = require('../middleware/auth');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },

  password: {
    type: String,
    required: true,
    minlength: 60 // bcrypt hash length
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  role: {
    type: String,
    enum: ['admin', 'trader', 'viewer'],
    default: 'trader'
  },

  // 2FA
  twoFAEnabled: {
    type: Boolean,
    default: false
  },

  twoFASecret: {
    type: String,
    // Stored encrypted
    encrypted: true
  },

  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false },
    usedAt: Date
  }],

  // API Keys
  apiKeys: [{
    key: String,
    secret: String, // Encrypted
    name: String,
    createdAt: Date,
    lastUsed: Date,
    active: Boolean
  }],

  // Login tracking
  lastLogin: Date,
  lastLoginIP: String,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,

  // Session management
  activeSessions: [{
    token: String,
    createdAt: Date,
    expiresAt: Date,
    userAgent: String,
    ip: String
  }],

  // Audit
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await AuthenticationService.hashPassword(this.password);
  this.updatedAt = new Date();
  next();
});

// Encrypt sensitive fields
userSchema.pre('save', function(next) {
  const sensitiveFields = ['twoFASecret'];
  
  for (const field of sensitiveFields) {
    if (this.isModified(field) && this[field]) {
      const cipher = crypto.createCipher('aes-256-cbc', process.env.DB_ENCRYPTION_KEY);
      this[field] = cipher.update(this[field], 'utf8', 'hex') + cipher.final('hex');
    }
  }
  next();
});

// Decrypt sensitive fields on retrieval
userSchema.methods.decryptField = function(field) {
  if (!this[field]) return null;

  const decipher = crypto.createDecipher('aes-256-cbc', process.env.DB_ENCRYPTION_KEY);
  return decipher.update(this[field], 'hex', 'utf8') + decipher.final('utf8');
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.lockedUntil && this.lockedUntil > new Date();
};

// Record failed login
userSchema.methods.recordFailedLogin = async function() {
  this.loginAttempts += 1;

  if (this.loginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
  }

  return this.save();
};

// Clear failed attempts on successful login
userSchema.methods.clearFailedAttempts = async function() {
  this.loginAttempts = 0;
  this.lockedUntil = null;
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
```

---

### Fix #5: Environment Setup Documentation

**File**: `SECURITY-ENV-SETUP.md` (NEW)

```bash
# Security-Critical Environment Setup

## Required Environment Variables for Production

### AWS KMS (Private Key Encryption)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
KMS_KEY_ID=arn:aws:kms:us-east-1:ACCOUNT:key/KEY-ID

### Secrets Management (HashiCorp Vault)
VAULT_ADDR=https://vault.example.com:8200
VAULT_TOKEN=<long-secure-token>
VAULT_NAMESPACE=hft-prod

### JWT Configuration
JWT_SECRET=<64-character-random-string>
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

### Database (PostgreSQL)
DB_HOST=postgres.example.com
DB_PORT=5432
DB_USER=hft_prod_user
DB_PASSWORD=<strong-password>
DB_NAME=hft_trading
DB_SSL=true
DB_ENCRYPTION_KEY=<32-character-hex-string>

### Redis (Session/Cache)
REDIS_URL=redis://:password@redis.example.com:6379
REDIS_TLS=true

### API Keys (Retrieved from Vault)
# These will be fetched from Vault at startup
# Do NOT set these directly

### Application
NODE_ENV=production
PORT=3001
WS_PORT=3002
ALLOWED_ORIGINS=https://app.example.com,https://api.example.com

### Solana
RPC_URL=https://api.mainnet-beta.solana.com
JUPITER_API_URL=https://quote-api.jup.ag/v6

### Logging
LOG_LEVEL=info
LOG_FORMAT=json
SENTRY_DSN=https://...@sentry.io/...

## Setup Checklist

1. [ ] Generate all random secrets using secure methods
2. [ ] Store secrets in Vault, NOT in .env
3. [ ] Set restrictive file permissions (600) on any config files
4. [ ] Use TLS/SSL for all connections
5. [ ] Enable database encryption at rest
6. [ ] Setup HSM for production keys
7. [ ] Rotate secrets every 30 days
8. [ ] Monitor secret access logs

## NEVER
- [ ] Commit .env to version control
- [ ] Log sensitive values
- [ ] Use default passwords
- [ ] Disable SSL verification
- [ ] Store secrets in code comments
- [ ] Share secrets via unencrypted channels
```

---

## 🟠 P1: HIGH PRIORITY FIXES (Week 2)

### Fix #6: Webhook Signature Verification

**File**: `backend/middleware/webhookSecurity.js` (NEW)

```javascript
const crypto = require('crypto');
const logger = require('../utils/logger');

class WebhookSecurityMiddleware {
  /**
   * Verify Helius webhook signature
   * Helius uses HMAC-SHA256
   */
  static async verifyHeliusSignature(req, res, next) {
    try {
      const signature = req.headers['x-helius-signature'];
      const timestamp = req.headers['x-helius-timestamp'];

      if (!signature || !timestamp) {
        logger.warn('Missing webhook headers');
        return res.status(401).json({ error: 'Invalid webhook' });
      }

      // Verify timestamp (5 minute window)
      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);

      if (Math.abs(currentTime - requestTime) > 300) {
        logger.warn('Webhook timestamp outside acceptable window');
        return res.status(401).json({ error: 'Request too old' });
      }

      // Verify signature
      const secret = process.env.HELIUS_WEBHOOK_SECRET;
      const payload = req.rawBody; // Must use raw body, not parsed

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Check replay attack using Redis
      const nonce = `webhook:${timestamp}:${signature}`;
      const redis = require('../utils/cache');
      
      const exists = await redis.get(nonce);
      if (exists) {
        logger.warn('Duplicate webhook detected (replay attack)');
        return res.status(401).json({ error: 'Duplicate webhook' });
      }

      // Store nonce for 10 minutes
      await redis.set(nonce, 1, 600);

      // Audit successful verification
      await require('../utils/audit').logWebhookVerification({
        service: 'helius',
        verified: true,
        timestamp,
        ip: req.ip
      });

      next();
    } catch (error) {
      logger.error('Webhook verification error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Rate limit per webhook source
   */
  static webhookRateLimiter() {
    return (req, res, next) => {
      const source = req.headers['x-helius-source'] || req.ip;
      const rateLimitKey = `webhook:ratelimit:${source}`;
      const redis = require('../utils/cache');

      redis.incr(rateLimitKey, (err, count) => {
        if (err) return next();

        if (count === 1) {
          redis.expire(rateLimitKey, 60); // 1 minute window
        }

        res.setHeader('X-RateLimit-Limit', '100');
        res.setHeader('X-RateLimit-Remaining', Math.max(0, 100 - count));

        if (count > 100) {
          logger.warn(`Webhook rate limit exceeded: ${source}`);
          return res.status(429).json({ error: 'Rate limit exceeded' });
        }

        next();
      });
    };
  }
}

module.exports = WebhookSecurityMiddleware;
```

---

### Fix #7: MEV Protection with Jito Bundles

**File**: `backend/services/mevProtection.js` (NEW)

```javascript
const axios = require('axios');
const { Connection, Transaction } = require('@solana/web3.js');
const logger = require('../utils/logger');

class MEVProtectionService {
  constructor() {
    this.jitoUrl = process.env.JITO_BLOCK_ENGINE_URL || 
      'https://mainnet.block-engine.jito.wtf/api/v1';
    this.connection = new Connection(process.env.PRIVATE_RPC_URL);
  }

  /**
   * Send transaction through Jito to prevent MEV
   */
  async sendBundledTransaction(transaction, userTip = 100000) {
    try {
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Create bundle with tip
      const bundle = [
        transaction.serialize().toString('base64'),
        // Add tip transaction
        this.createTipTransaction(userTip).serialize().toString('base64')
      ];

      const response = await axios.post(
        `${this.jitoUrl}/bundles`,
        { transactions: bundle },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.JITO_AUTH_TOKEN}`
          }
        }
      );

      logger.info('Bundle submitted to Jito', {
        bundleId: response.data.bundle_id
      });

      return {
        bundleId: response.data.bundle_id,
        bundleStatus: 'pending',
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Jito bundle submission failed:', error);
      // Fallback to regular RPC
      return this.fallbackToRegularRpc(transaction);
    }
  }

  /**
   * Monitor bundle status
   */
  async getBundleStatus(bundleId) {
    try {
      const response = await axios.get(
        `${this.jitoUrl}/bundles/${bundleId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.JITO_AUTH_TOKEN}`
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get bundle status:', error);
      return null;
    }
  }

  /**
   * Validate slippage before execution
   */
  async validateSlippage(expectedAmount, maxSlippageBps = 1500) {
    return {
      expectedAmount,
      maxSlippageBps,
      maxSlippagePercent: (maxSlippageBps / 10000 * 100).toFixed(2),
      maxLossAmount: (expectedAmount * maxSlippageBps / 10000).toFixed(6)
    };
  }

  /**
   * Detect sandwich attack patterns
   */
  async detectSandwichAttempt(tokenMint, buyAmount) {
    try {
      // Check for suspicious transactions in mempool
      const recentTxs = await this.connection.getSignaturesForAddress(
        require('@solana/web3.js').PublicKey.default
      );

      const suspiciousPatterns = [];

      for (const tx of recentTxs) {
        // Analyze transaction for MEV patterns
        // This is simplified - full implementation would parse transactions
        if (this.looksLikeSandwich(tx, tokenMint)) {
          suspiciousPatterns.push(tx);
        }
      }

      if (suspiciousPatterns.length > 0) {
        logger.warn('Potential sandwich attack detected', {
          patterns: suspiciousPatterns.length,
          token: tokenMint
        });

        return {
          riskLevel: 'HIGH',
          patterns: suspiciousPatterns.length,
          recommendation: 'Use Jito bundle or increase slippage'
        };
      }

      return { riskLevel: 'LOW' };
    } catch (error) {
      logger.error('Sandwich detection error:', error);
      return { riskLevel: 'UNKNOWN' };
    }
  }

  /**
   * Create tip transaction for Jito
   */
  createTipTransaction(amount) {
    // Implementation would create proper tip transaction
    return new Transaction();
  }

  /**
   * Fallback to regular RPC
   */
  async fallbackToRegularRpc(transaction) {
    try {
      const signature = await this.connection.sendTransaction(transaction);
      return {
        signature,
        method: 'regular_rpc',
        warning: 'Sent via regular RPC (not protected from MEV)'
      };
    } catch (error) {
      throw new Error('Transaction failed: ' + error.message);
    }
  }

  /**
   * Analyze transaction pattern
   */
  looksLikeSandwich(tx, targetToken) {
    // Placeholder - full implementation would parse transaction
    return false;
  }
}

module.exports = new MEVProtectionService();
```

---

### Fix #8: Secure WebSocket with Authentication

**File**: `backend/ws/secureWebsocket.js` (NEW)

```javascript
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class SecureWebSocketServer {
  constructor(port) {
    this.port = port;
    this.clients = new Map(); // userId -> Set of connections
    
    this.wss = new WebSocket.Server({
      port,
      perMessageDeflate: false
    });

    this.setupHandlers();
  }

  setupHandlers() {
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  /**
   * Handle new WebSocket connection with auth
   */
  async handleConnection(ws, req) {
    try {
      // Extract JWT from query string
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'No authentication token');
        return;
      }

      // Verify token
      let user;
      try {
        user = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ['HS256']
        });
      } catch (error) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Setup per-connection rate limiter
      const rateLimiter = new RateLimiter({
        messages: 100,
        windowMs: 60000 // 1 minute
      });

      // Setup heartbeat
      const heartbeat = setInterval(() => {
        if (ws.isAlive === false) {
          ws.terminate();
          this.removeClient(user.userId);
          clearInterval(heartbeat);
          return;
        }
        ws.isAlive = false;
        ws.ping();
      }, 30000); // 30 seconds

      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      // Setup timeout (30 minutes)
      const timeout = setTimeout(() => {
        ws.close(1000, 'Connection timeout');
        clearInterval(heartbeat);
      }, 30 * 60 * 1000);

      ws.on('message', (data) => {
        try {
          // Rate limiting
          if (!rateLimiter.consume()) {
            ws.close(1008, 'Rate limit exceeded');
            clearInterval(heartbeat);
            clearTimeout(timeout);
            return;
          }

          // Parse and validate message
          const message = JSON.parse(data);

          // Only send data relevant to user
          this.handleMessage(ws, user, message);
        } catch (error) {
          logger.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            error: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        clearInterval(heartbeat);
        clearTimeout(timeout);
        this.removeClient(user.userId);
        logger.info(`WebSocket closed: ${user.userId}`);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        clearInterval(heartbeat);
        clearTimeout(timeout);
        this.removeClient(user.userId);
      });

      // Register client
      this.addClient(user.userId, ws);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        userId: user.userId,
        timestamp: new Date()
      }));

      logger.info(`WebSocket connected: ${user.userId}`);
    } catch (error) {
      logger.error('Connection error:', error);
      ws.close(1011, 'Internal error');
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(ws, user, message) {
    const { type, data } = message;

    switch (type) {
      case 'subscribe':
        this.handleSubscribe(ws, user, data);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, user, data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        logger.warn(`Unknown message type: ${type}`);
    }
  }

  /**
   * Broadcast to specific user only
   */
  broadcast(userId, message) {
    if (!this.clients.has(userId)) return;

    const connections = this.clients.get(userId);
    const payload = JSON.stringify(message);

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  /**
   * Add client connection
   */
  addClient(userId, ws) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);
  }

  /**
   * Remove client connection
   */
  removeClient(userId) {
    const connections = this.clients.get(userId);
    if (connections) {
      connections.clear();
      if (connections.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  start() {
    logger.info(`🔒 Secure WebSocket server running on port ${this.port}`);
  }

  stop() {
    this.wss.close();
  }
}

class RateLimiter {
  constructor({ messages = 10, windowMs = 60000 }) {
    this.messages = messages;
    this.windowMs = windowMs;
    this.count = 0;
    this.resetTime = Date.now() + windowMs;
  }

  consume() {
    if (Date.now() > this.resetTime) {
      this.count = 0;
      this.resetTime = Date.now() + this.windowMs;
    }

    if (this.count >= this.messages) {
      return false;
    }

    this.count++;
    return true;
  }
}

module.exports = SecureWebSocketServer;
```

---

## 📅 Implementation Timeline

| Week | Focus Area | Items | Status |
|------|-----------|-------|--------|
| Week 1 | Critical Fixes | Fix #1-5 | 🔴 P0 |
| Week 2 | High Priority | Fix #6-8 | 🟠 P1 |
| Week 3 | Monitoring | Logging, Alerting | 🟡 P2 |
| Week 4 | Testing | Pentest, Scanning | ✅ Complete |

---

## ✅ Testing Checklist

Before each fix deployment:

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] Load tests pass (no performance regression)
- [ ] Manual security review
- [ ] Documentation updated
- [ ] Team sign-off

---

**Created**: 2026-05-07  
**Status**: Implementation Guide  
**Next Review**: 2026-05-14
