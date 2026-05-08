const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const auditLogger = require('../utils/audit');

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

// API Key Authentication for Webhooks
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey || apiKey !== process.env.HELIUS_API_KEY) {
    return res.status(401).json({
      error: 'Invalid API key.',
      code: 'API_KEY_INVALID'
    });
  }

  next();
};

// Encrypt/Decrypt functions for sensitive data
const encrypt = (text) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encrypted) => {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
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

module.exports = {
  authenticate,
  authenticateApiKey,
  encrypt,
  decrypt,
  generateToken,
  validatePassword,
  hashPassword,
  comparePasswords,
  verifyWebhookSignature
};