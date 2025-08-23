// src/utils/logger.js
export const logger = {
  info: (message) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
    if (error) console.error(error.stack || error.message);
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
  }
};

export default logger;
