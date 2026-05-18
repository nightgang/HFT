const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Ensure logs directory exists
const fs = require('fs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const appLogger = winston.createLogger({
  level: 'info',
  format: baseFormat,
  defaultMeta: { service: 'solana-trading', type: 'app' },
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'app.log') }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
  ],
});

const errorLogger = winston.createLogger({
  level: 'error',
  format: baseFormat,
  defaultMeta: { service: 'solana-trading', type: 'error' },
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log') }),
  ],
});

const accessLogger = winston.createLogger({
  level: 'info',
  format: baseFormat,
  defaultMeta: { service: 'solana-trading', type: 'access' },
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'access.log') }),
  ],
});

const aiLogger = winston.createLogger({
  level: 'info',
  format: baseFormat,
  defaultMeta: { service: 'solana-trading', type: 'ai-inference' },
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'ai-inference.log') }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  const consoleFormat = winston.format.simple();
  [appLogger, errorLogger, accessLogger, aiLogger].forEach(l => l.add(new winston.transports.Console({ format: consoleFormat })));
}

const logger = appLogger;
module.exports = logger;
module.exports.errorLogger = errorLogger;
module.exports.accessLogger = accessLogger;
module.exports.aiLogger = aiLogger;
module.exports.logger = logger;
