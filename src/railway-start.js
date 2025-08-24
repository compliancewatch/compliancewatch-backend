import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import nodeCron from 'node-cron';

// Import targets - using empty arrays temporarily to avoid import errors
// const { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } = await import('../../config/targets.js');
const REGULATORY_TARGETS = [];
const BUSINESS_TARGETS = [];
const CRYPTO_TARGETS = [];

// Import ALL scraper functions
import { runUNSecurityCouncilScraper } from './scrapers/un-security-council.js';
import { runUNCTADScraper } from './scrapers/unctad.js';
import { runSECScraper } from './scrapers/sec.js';
import { runEUCommissionScraper } from './scrapers/eu-commission.js';
import { runFCAUKScraper } from './scrapers/fca-uk.js';
import { runMASAKScraper } from './scrapers/masak.js';
import { runCMBTurkeyScraper } from './scrapers/cmb-turkey.js';
import { runISAIsraelScraper } from './scrapers/isa-israel.js';
import { runSCAUAEScraper } from './scrapers/sca-uae.js';
import { runCNBVMexicoScraper } from './scrapers/cnbv-mexico.js';
import { runCVMBrazilScraper } from './scrapers/cvm-brazil.js';
import { runMASSingaporeScraper } from './scrapers/mas-singapore.js';
import { runCBRCChinaScraper } from './scrapers/cbrc-china.js';
import { runBloombergScraper } from './scrapers/bloomberg.js';
import { runReutersScraper } from './scrapers/reuters.js';
import { runFinancialTimesScraper } from './scrapers/financial-times.js';
import { runYahooFinanceScraper } from './scrapers/yahoo-finance.js';
import { runCoinDeskScraper } from './scrapers/coindesk.js';
import { runCoinTelegraphScraper } from './scrapers/cointelegraph.js';
import { runCryptoSlateScraper } from './scrapers/cryptoslate.js';
import { runTheBlockScraper } from './scrapers/the-block.js';
import { runScraper as runFATFScraper } from './scrapers/fatf.js';

// Map ALL targets to scraper functions
const scraperMap = {
  // Regulatory (13)
  'un-security-council': runUNSecurityCouncilScraper,
  'unctad': runUNCTADScraper,
  'sec': runSECScraper,
  'eu-commission': runEUCommissionScraper,
  'fca-uk': runFCAUKScraper,
  'masak': runMASAKScraper,
  'cmb-turkey': runCMBTurkeyScraper,
  'isa-israel': runISAIsraelScraper,
  'sca-uae': runSCAUAEScraper,
  'cnbv-mexico': runCNBVMexicoScraper,
  'cvm-brazil': runCVMBrazilScraper,
  'mas-singapore': runMASSingaporeScraper,
  'cbrc-china': runCBRCChinaScraper,
  
  // Business (4)
  'bloomberg': runBloombergScraper,
  'reuters': runReutersScraper,
  'financial-times': runFinancialTimesScraper,
  'yahoo-finance': runYahooFinanceScraper,
  
  // Crypto (4)
  'coindesk': runCoinDeskScraper,
  'cointelegraph': runCoinTelegraphScraper,
  'cryptoslate': runCryptoSlateScraper,
  'the-block': runTheBlockScraper,
  
  // Special (1)
  'fatf': runFATFScraper
};

// Sequential scraper execution to prevent browser conflicts
async function runScrapersByType(targets, typeName) {
  logger.info(`🔄 Starting ${typeName} scrapers...`);
  let successCount = 0;
  let failCount = 0;

  // Process targets SEQUENTIALLY to avoid browser conflicts
  for (const target of targets) {
    try {
      const scraperFunction = scraperMap[target.scraper];
      if (scraperFunction) {
        logger.info(`🔄 Starting ${target.name}...`);
        await scraperFunction(); // AWAIT each scraper to complete
        successCount++;
        
        // Longer delay between scrapers to prevent resource conflicts
        logger.info(`⏳ Waiting 8 seconds before next scraper...`);
        await new Promise(resolve => setTimeout(resolve, 8000));
      }
    } catch (error) {
      logger.error(`❌ ${target.name} failed:`, error.message);
      failCount++;
      
      // Even longer delay after failures to allow recovery
      logger.info(`⏳ Waiting 12 seconds after failure...`);
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
  }
  
  logger.info(`✅ ${typeName} completed: ${successCount} ✓, ${failCount} ✗`);
  return { successCount, failCount };
}

async function runAllScrapers() {
  try {
    logger.info('🔄 Starting FULL scraping cycle...');
    
    // Run scrapers sequentially with delays between types
    const regulatoryResults = await runScrapersByType(REGULATORY_TARGETS, 'Regulatory');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay
    
    const businessResults = await runScrapersByType(BUSINESS_TARGETS, 'Business');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay
    
    const cryptoResults = await runScrapersByType(CRYPTO_TARGETS, 'Crypto');

    const totalSuccess = regulatoryResults.successCount + businessResults.successCount + cryptoResults.successCount;
    const totalFail = regulatoryResults.failCount + businessResults.failCount + cryptoResults.failCount;

    logger.info(`🎉 FULL cycle completed: ${totalSuccess} ✓, ${totalFail} ✗`);
    
    // Send summary to Telegram
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `📊 Scrape Cycle Complete\n` +
        `✅ Regulatory: ${regulatoryResults.successCount}/${REGULATORY_TARGETS.length}\n` +
        `✅ Business: ${businessResults.successCount}/${BUSINESS_TARGETS.length}\n` +
        `✅ Crypto: ${cryptoResults.successCount}/${CRYPTO_TARGETS.length}\n` +
        `🕒 ${new Date().toLocaleString()}`
      );
    } catch (error) {
      logger.error('Failed to send Telegram summary:', error);
    }
    
    return { totalSuccess, totalFail };
  } catch (error) {
    logger.error('runAllScrapers failed:', error);
    return { totalSuccess: 0, totalFail: 1 };
  }
}

async function initializeApplication() {
  try {
    logger.info('🚀 Starting ComplianceWatch Backend...');
    
    // Verify environment variables
    const requiredEnvVars = [
      'SUPABASE_URL', 'SUPABASE_KEY', 'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHANNEL_ID', 'CHROMIUM_PATH'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    logger.info('✅ Environment variables verified');
    
    // Initialize services
    await testConnection();
    
    // Start Telegram bot with error handling
    try {
      startBot();
      logger.info('🤖 Telegram bot initialization requested');
    } catch (botError) {
      logger.warn('Telegram bot startup failed (non-critical):', botError.message);
    }
    
    // Schedule scraping every 3 hours
    nodeCron.schedule('0 */3 * * *', async () => {
      logger.info('⏰ 3-hour scraping cycle started');
      try {
        await runAllScrapers();
      } catch (error) {
        logger.error('Scheduled scraping failed:', error);
      }
    });
    
    // Also run immediately on startup (after 30s delay to let system stabilize)
    setTimeout(async () => {
      logger.info('🔄 Initial full scrape starting...');
      try {
        await runAllScrapers();
        logger.info('✅ Initial scrape completed successfully');
      } catch (error) {
        logger.error('Initial scrape failed:', error);
      }
    }, 30000); // 30-second delay for system stabilization
    
    logger.info('✅ Application started successfully');
    logger.info('📅 Scraping scheduled every 3 hours');
    logger.info('💡 System will begin first scrape in 30 seconds...');
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    
    // Try to send error notification via simple API call
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `❌ Startup Failed\n` +
        `Error: ${error.message}\n` +
        `Time: ${new Date().toLocaleString()}`
      );
    } catch (telegramError) {
      logger.error('Also failed to send Telegram alert:', telegramError);
    }
    
    process.exit(1);
  }
}

// Enhanced error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  // Don't exit immediately, try to continue
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, try to continue
});

// Start the application
initializeApplication();
