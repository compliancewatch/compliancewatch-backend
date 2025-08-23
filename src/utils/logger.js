// Enhanced logger utility with multiple transport support
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = process.env.LOG_LEVEL || 'info';

function shouldLog(level) {
  return logLevels[level] <= logLevels[currentLevel];
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

export const logger = {
  error: (message, error = null) => {
    if (shouldLog('error')) {
      const timestamp = new Date().toISOString();
      console.error(`${colors.red}[ERROR]${colors.reset} ${timestamp}: ${message}`);
      if (error) {
        console.error(error.stack || error.message);
      }
    }
  },
  
  warn: (message) => {
    if (shouldLog('warn')) {
      const timestamp = new Date().toISOString();
      console.warn(`${colors.yellow}[WARN]${colors.reset} ${timestamp}: ${message}`);
    }
  },
  
  info: (message) => {
    if (shouldLog('info')) {
      const timestamp = new Date().toISOString();
      console.log(`${colors.green}[INFO]${colors.reset} ${timestamp}: ${message}`);
    }
  },
  
  debug: (message) => {
    if (shouldLog('debug')) {
      const timestamp = new Date().toISOString();
      console.log(`${colors.blue}[DEBUG]${colors.reset} ${timestamp}: ${message}`);
    }
  },
  
  // Specialized loggers
  scraper: {
    start: (source) => {
      logger.info(`🔄 Starting scraper: ${source}`);
    },
    
    success: (source, count) => {
      logger.info(`✅ ${source} completed: ${count} items found`);
    },
    
    fail: (source, error) => {
      logger.error(`❌ ${source} failed:`, error);
    }
  },
  
  database: {
    connected: () => {
      logger.info('✅ Database connected successfully');
    },
    
    error: (operation, error) => {
      logger.error(`❌ Database ${operation} failed:`, error);
    },
    
    insert: (source, count) => {
      logger.info(`💾 Inserted ${count} items for ${source}`);
    }
  },
  
  telegram: {
    sent: () => {
      logger.info('📨 Telegram message sent');
    },
    
    error: (error) => {
      logger.error('❌ Telegram send failed:', error);
    }
  }
};

// Export for direct import
export default logger;
