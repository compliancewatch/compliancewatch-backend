// src/railway-start.js
import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';

async function initializeApplication() {
  try {
    logger.info('🚀 Starting ComplianceWatch Backend...');
    
    // Verify essential environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_KEY', 
      'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHANNEL_ID',
      'CHROMIUM_PATH'
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
    
    logger.info('✅ Application started successfully');
    logger.info('📋 Core services running: Database + Telegram Bot');
    
    // Manual scraping can be triggered via Telegram
    logger.info('💡 Use Telegram /scrape command to trigger manual scraping');
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    process.exit(1);
  }
}

// Start the application
initializeApplication();
