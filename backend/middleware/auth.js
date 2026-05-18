const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const auditLogger = require('../utils/audit');
const logger = require('../utils/logger');
const UserModel = require('../models/user.model');

// Cache encryption key to improve performance
let cachedEncryptionKey = null;

const getEncryptionKey = () => {
  if (!cachedEncryptionKey) {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    cachedEncryptionKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  }
  return cachedEncryptionKey;
};

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    auditLogger.logSecurityEvent('MISSING_AUTH_TOKEN', {
      endpoint: req.path,
      method: req.method
    }, req.ip, req.get('User-Agent'));
    return res.status(401).json({
      error: 'Access denied. No token provided.',
      code: 'AUTH_NO_TOKEN'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Log successful API access
    auditLogger.logApiAccess(req.path, req.method, decoded, req.ip, req.get('User-Agent'));

    next();
  } catch (error) {
    auditLogger.logSecurityEvent('INVALID_AUTH_TOKEN', {
      endpoint: req.path,
      method: req.method,
      error: error.message
    }, req.ip, req.get('User-Agent'));
    return res.status(401).json({
      error: 'Invalid token.',
      code: 'AUTH_INVALID_TOKEN'
    });
  }
};

// API Key Authentication for Webhooks and service endpoints
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Invalid API key.',
      code: 'API_KEY_INVALID'
    });
  }

  try {
    // Never compare sensitive API keys directly - always use database
    // Remove hardcoded HELIUS_API_KEY comparison for security
    const apiKeyRecord = await UserModel.findApiKeyByKey(apiKey);
    if (!apiKeyRecord) {
      auditLogger.logSecurityEvent('INVALID_API_KEY', {
        endpoint: req.path,
        method: req.method
      }, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        error: 'Invalid API key.',
        code: 'API_KEY_INVALID'
      });
    }

    // Check if API key is expired or disabled
    if (apiKeyRecord.revoked || (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date())) {
      auditLogger.logSecurityEvent('REVOKED_API_KEY', {
        endpoint: req.path,
        method: req.method,
        keyId: apiKeyRecord.key_id
      }, req.ip, req.get('User-Agent'));
      return res.status(401).json({
        error: 'API key has been revoked or expired.',
        code: 'API_KEY_REVOKED'
      });
    }

    await UserModel.recordApiKeyUsage(apiKeyRecord.key_id);
    req.apiKey = {
      keyId: apiKeyRecord.key_id,
      userId: apiKeyRecord.user_id,
      keyName: apiKeyRecord.key_name,
      scopes: apiKeyRecord.scopes,
    };

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    auditLogger.logSecurityEvent('API_KEY_AUTH_ERROR', {
      endpoint: req.path,
      method: req.method,
      error: error.message
    }, req.ip, req.get('User-Agent'));
    return res.status(500).json({
      error: 'API key authentication failed.',
      code: 'API_KEY_AUTH_ERROR'
    });
  }
};

// Encrypt/Decrypt functions for sensitive data (using cached key)
const encrypt = (text) => {
  if (!text) throw new Error('Text to encrypt cannot be empty');
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encrypted) => {
  if (!encrypted) throw new Error('Encrypted text cannot be empty');
  const key = getEncryptionKey();
  const parts = encrypted.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Generate secure random token
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Validate password strength
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength &&
         hasUpperCase &&
         hasLowerCase &&
         hasNumbers &&
         hasSpecialChar;
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePasswords = async (rawPassword, hashedPassword) => {
  if (!hashedPassword) return false;
  return bcrypt.compare(rawPassword, hashedPassword);
};

const verifyWebhookSignature = (payload, signature) => {
  if (!signature || !process.env.WEBHOOK_SIGNATURE_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SIGNATURE_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    return false;
  }
};

// Role-based authorization middleware
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      auditLogger.logSecurityEvent('UNAUTHORIZED_ROLE', {
        endpoint: req.path,
        method: req.method,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      }, req.ip, req.get('User-Agent'));
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_ROLE'
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authenticateApiKey,
  authorize,
  encrypt,
  decrypt,
  generateToken,
  validatePassword,
  hashPassword,
  comparePasswords,
  verifyWebhookSignature
};
