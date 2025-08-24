// src/railway-start.js
import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import nodeCron from 'node-cron';

async function initializeApplication() {
  try {
    logger.info('🚀 Starting ComplianceWatch Backend...');
    
    // Verify essential environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_KEY', 
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHANNEL_ID',
      'CHROMIUM_PATH',
      'OPENROUTER_API_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    logger.info('✅ Environment variables verified');
    
    // Initialize services
    logger.info('🔗 Testing database connection...');
    await testConnection();
    
    logger.info('🤖 Starting Telegram bot...');
    startBot();
    
    // Schedule scraping every 3 hours
    logger.info('⏰ Scheduling scrapers...');
    scheduleScrapers();
    
    logger.info('✅ Application started successfully');
    logger.info('📅 Scraping scheduled every 3 hours');
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    process.exit(1);
  }
}

function scheduleScrapers() {
  // Scrape every 3 hours
  nodeCron.schedule('0 */3 * * *', async () => {
    logger.info('⏰ Scheduled scraping started');
    try {
      await runAllScrapers();
    } catch (error) {
      logger.error('Scheduled scraping failed:', error);
    }
  });
  
  // Also run immediately (after 10 second delay)
  setTimeout(async () => {
    logger.info('🔄 Initial scrape starting...');
    await runAllScrapers();
  }, 10000);
}

async function runAllScrapers() {
  try {
    // Import and run FATF scraper
    const { runScraper } = await import('./scrapers/fatf.js');
    await runScraper();
    
    logger.info('✅ All scrapers completed');
  } catch (error) {
    logger.error('Scraping failed:', error);
  }
}

// Start the application
initializeApplication();
