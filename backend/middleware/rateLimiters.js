const rateLimit = require('express-rate-limit');
const monitoringService = require('../services/monitoring/monitoring.service');
const logger = require('../utils/logger');

const buildLimiter = ({ windowMs, max, messageCode, messageText }) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: messageText,
      code: messageCode,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      try {
        monitoringService.recordRateLimitHit(req.path);
      } catch (error) {
        logger.debug('Failed to record rate limit hit:', error.message);
      }
      res.status(429).json({ error: messageText, code: messageCode });
    }
  });
};

module.exports = {
  apiLimiter: buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    messageCode: 'RATE_LIMIT_EXCEEDED',
    messageText: 'Too many requests from this IP, please try again later.'
  }),
  strictLimiter: buildLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    messageCode: 'STRICT_RATE_LIMIT_EXCEEDED',
    messageText: 'Too many sensitive requests, please try again later.'
  }),
  tradeExecutionLimiter: buildLimiter({
    windowMs: 60 * 1000,
    max: 5,
    messageCode: 'TRADE_RATE_LIMIT_EXCEEDED',
    messageText: 'Too many trade execution requests, please slow down.'
  })
};
