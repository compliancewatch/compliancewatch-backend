// railway-start.js - ES Modules Version
import './config/constants.js';
import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import { runScraper } from './scrapers/fatf.js';
import nodeCron from 'node-cron';

async function start() {
  try {
    // Verify configurations
    if (!process.env.SUPABASE_URL) throw new Error('Supabase URL missing');
    if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('Telegram token missing');

    // Initialize services
    await testConnection();
    startBot();
    
    // Run scraper on schedule
    nodeCron.schedule('0 9 * * *', runScraper); // Daily at 9 AM

    logger.info('🚀 Application started successfully');
    
  } catch (error) {
    logger.error('❌ Startup failed', error);
    process.exit(1);
  }
}

start();
