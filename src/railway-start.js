import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import { runScraper } from './scrapers/fatf.js';
import nodeCron from 'node-cron';

async function initializeApplication() {
  try {
    logger.info('🚀 Starting ComplianceWatch Backend...');
    
    // Verify essential environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_KEY',
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHANNEL_ID'
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
    
    // Schedule scraping job (daily at 9 AM UTC)
    logger.info('⏰ Scheduling scraper job...');
    nodeCron.schedule('0 9 * * *', async () => {
      logger.info('🔄 Scheduled scrape job started');
      try {
        await runScraper();
        logger.info('✅ Scheduled scrape job completed');
      } catch (error) {
        logger.error('❌ Scheduled scrape job failed', error);
      }
    });
    
    logger.info('✅ Application started successfully');
    logger.info('📅 Next scrape scheduled for 09:00 UTC daily');
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    process.exit(1);
  }
}

// Start the application
initializeApplication();
