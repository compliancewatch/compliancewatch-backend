// index.js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const logger = require('./utils/logger');
const scheduler = require('./services/scheduler');
const telegramBot = require('./services/telegram-bot');
const database = require('./services/database');

class Application {
  constructor() {
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown(1);
    });

    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  async start() {
    try {
      logger.info('Starting application...');
      
      // Verify database connection
      if (!await database.testConnection()) {
        throw new Error('Database connection failed');
      }
      
      // Start services
      telegramBot.start();
      scheduler.init();
      
      logger.info('Application started successfully');
    } catch (error) {
      logger.error('Application startup failed', error);
      this.shutdown(1);
    }
  }

  shutdown(code = 0) {
    logger.info('Shutting down application...');
    telegramBot.stop();
    process.exit(code);
  }
}

// Start the application
const app = new Application();
app.start();