import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import nodeCron from 'node-cron';

// Import targets - FIXED PATH (choose one option below)
// Option 1: If targets.js is in src/config/ folder
import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } from './config/targets.js';

// Option 2: If targets.js is in root config/ folder (uncomment below)
// import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } from '../../config/targets.js';

// Option 3: Temporary fallback if file not found (uncomment below)
// const REGULATORY_TARGETS = [];
// const BUSINESS_TARGETS = [];
// const CRYPTO_TARGETS = [];

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

async function runScrapersByType(targets, typeName) {
  logger.info(`🔄 Starting ${typeName} scrapers...`);
  let successCount = 0;
  let failCount = 0;

  for (const target of targets) {
    try {
      const scraperFunction = scraperMap[target.scraper];
      if (scraperFunction) {
        logger.info(`🔄 Starting ${target.name}...`);
        await scraperFunction();
        successCount++;
        
        // Delay between scrapers to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      logger.error(`❌ ${target.name} failed:`, error.message);
      failCount++;
    }
  }
  
  logger.info(`✅ ${typeName} completed: ${successCount} ✓, ${failCount} ✗`);
  return { successCount, failCount };
}

async function runAllScrapers() {
  try {
    logger.info('🔄 Starting FULL scraping cycle (25+ sources)...');
    
    const results = await Promise.allSettled([
      runScrapersByType(REGULATORY_TARGETS, 'Regulatory'),
      runScrapersByType(BUSINESS_TARGETS, 'Business'),
      runScrapersByType(CRYPTO_TARGETS, 'Crypto')
    ]);

    const totalSuccess = results.reduce((sum, result) => sum + (result.value?.successCount || 0), 0);
    const totalFail = results.reduce((sum, result) => sum + (result.value?.failCount || 0), 0);

    logger.info(`🎉 FULL cycle completed: ${totalSuccess} ✓, ${totalFail} ✗`);
    
    // Send summary to Telegram
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `📊 Full Scrape Complete\n` +
        `✅ Regulatory: ${results[0].value?.successCount || 0}/${REGULATORY_TARGETS.length}\n` +
        `✅ Business: ${results[1].value?.successCount || 0}/${BUSINESS_TARGETS.length}\n` +
        `✅ Crypto: ${results[2].value?.successCount || 0}/${CRYPTO_TARGETS.length}\n` +
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
    logger.info('🚀 Starting ComplianceWatch Backend (25+ Sources)...');
    
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
    startBot();
    
    // Schedule scraping every 3 hours
    nodeCron.schedule('0 */3 * * *', async () => {
      logger.info('⏰ 3-hour scraping cycle started');
      await runAllScrapers();
    });
    
    // Also run immediately on startup (after 15s delay)
    setTimeout(async () => {
      logger.info('🔄 Initial full scrape starting...');
      await runAllScrapers();
    }, 15000);
    
    logger.info('✅ Application started successfully');
    logger.info('📅 Scraping 25+ sources every 3 hours');
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    
    // Try to send error notification via Telegram if basic services are up
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `❌ Application Startup Failed\n` +
        `Error: ${error.message}\n` +
        `Time: ${new Date().toLocaleString()}`
      );
    } catch (telegramError) {
      logger.error('Also failed to send Telegram alert:', telegramError);
    }
    
    process.exit(1);
  }
}

// Start the application
initializeApplication();
