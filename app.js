// app.js
const logger = require('./utils/logger');
const Scheduler = require('./services/scheduler');
const TelegramBot = require('./services/telegram-bot');
const Database = require('./services/database');

class Application {
  constructor() {
    this.scheduler = new Scheduler();
    this.telegramBot = new TelegramBot();
    this.database = new Database();
  }

  async start() {
    this.validateEnvironment();
    this.setupErrorHandling();
    
    try {
      await this.database.connect();
      this.scheduler.init();
      this.telegramBot.start();
    } catch (error) {
      throw error;
    }
  }

  validateEnvironment() {
    const requiredVars = [
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHANNEL_ID',
      'SUPABASE_URL',
      'SUPABASE_KEY'
    ];

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    });
  }

  setupErrorHandling() {
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.shutdown(1);
    });
  }

  shutdown(code = 0) {
    logger.info('Shutting down application...');
    this.scheduler.stopAll();
    this.telegramBot.stop();
    process.exit(code);
  }
}

module.exports = Application;
