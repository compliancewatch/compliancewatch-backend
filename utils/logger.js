// utils/logger.js
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
fs.mkdirSync('logs', { recursive: true });

// Enhanced error tracking
let lastError = {
  message: 'No errors yet',
  timestamp: new Date().toISOString()
};
let errorCount = 0;

const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ level, message, timestamp, stack }) => {
    let log = `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}`;
    if (stack) log += `\n${stack}`;
    return log;
  })
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        logFormat
      )
    }),
    new transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3
    }),
    new transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join('logs', 'exceptions.log')
    })
  ]
});

// Enhanced error handling
const originalError = logger.error;
logger.error = (message, error) => {
  const errorObj = error || new Error(message || 'Unknown error');
  
  lastError = {
    message: message || errorObj.message,
    timestamp: new Date().toISOString(),
    stack: errorObj.stack
  };
  errorCount++;
  
  originalError.call(logger, message || errorObj.message, errorObj);
};

// Utility methods
logger.getLastError = () => lastError;
logger.getErrorCount = () => errorCount;
logger.resetErrorCount = () => { errorCount = 0; };

module.exports = logger;