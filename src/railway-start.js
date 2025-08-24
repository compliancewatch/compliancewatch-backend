import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import { runAISummarizer } from './services/ai-service.js';
import nodeCron from 'node-cron';

// Import targets - CHOOSE THE CORRECT PATH FOR YOUR SETUP:
// Option 1: If targets.js is in src/config/ (recommended)
import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } from './config/targets.js';

// Option 2: If targets.js is in root config/ folder
// import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } from '../../config/targets.js';

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
  // Regulatory (13 targets)
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
  
  // Business (4 targets)
  'bloomberg': runBloombergScraper,
  'reuters': runReutersScraper,
  'financial-times': runFinancialTimesScraper,
  'yahoo-finance': runYahooFinanceScraper,
  
  // Crypto (4 targets)
  'coindesk': runCoinDeskScraper,
  'cointelegraph': runCoinTelegraphScraper,
  'cryptoslate': runCryptoSlateScraper,
  'the-block': runTheBlockScraper,
  
  // Special (1 target)
  'fatf': runFATFScraper
};

// Track active scrapers to prevent duplicates
const activeScrapers = new Set();

async function runScraperWithAI(target) {
  if (activeScrapers.has(target.name)) {
    logger.warn(`⏩ ${target.name} already running, skipping...`);
    return { success: false, skipped: true };
  }

  activeScrapers.add(target.name);
  
  try {
    logger.info(`🔄 Starting: ${target.name}`);
    const scraperFunction = scraperMap[target.scraper];
    
    if (!scraperFunction) {
      throw new Error(`No scraper function found for: ${target.scraper}`);
    }

    // Run the scraper
    await scraperFunction();
    
    // AI Summarization for ALL targets
    logger.info(`🤖 Generating AI summary for ${target.name}...`);
    const aiSuccess = await runAISummarizer(target.name);
    
    if (!aiSuccess) {
      logger.warn(`⚠️ AI summary failed for ${target.name}, using fallback`);
      // Fallback notification
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `📰 ${target.name} Update\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `✅ Content scraped successfully\n` +
        `#${target.type} #${target.name.replace(/\s+/g, '')}`
      );
    }
    
    logger.info(`✅ ${target.name} completed with AI summary`);
    return { success: true };

  } catch (error) {
    logger.error(`❌ ${target.name} failed:`, error.message);
    
    // Error notification
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `❌ ${target.name} Failed\n` +
        `Error: ${error.message}\n` +
        `Time: ${new Date().toLocaleString()}\n` +
        `#Error #${target.type}`
      );
    } catch (telegramError) {
      logger.error('Failed to send error alert:', telegramError);
    }
    
    return { success: false, error: error.message };
    
  } finally {
    activeScrapers.delete(target.name);
  }
}

// Sequential scraper execution with AI integration
async function runScrapersByType(targets, typeName) {
  logger.info(`🔄 Starting ${typeName} scrapers...`);
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const target of targets) {
    try {
      const result = await runScraperWithAI(target);
      
      if (result.success) {
        successCount++;
      } else if (result.skipped) {
        skipCount++;
      } else {
        failCount++;
      }
      
      // Delay between scrapers (8 seconds)
      await new Promise(resolve => setTimeout(resolve, 8000));
      
    } catch (error) {
      logger.error(`Unexpected error with ${target.name}:`, error);
      failCount++;
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
  }
  
  logger.info(`✅ ${typeName} completed: ${successCount} ✓, ${failCount} ✗, ${skipCount} ⏩`);
  return { successCount, failCount, skipCount };
}

async function runAllScrapers() {
  try {
    logger.info('🔄 Starting FULL scraping cycle (20+ sources)...');
    logger.info(`📊 Targets: ${REGULATORY_TARGETS.length} Regulatory, ${BUSINESS_TARGETS.length} Business, ${CRYPTO_TARGETS.length} Crypto`);
    
    // Run scrapers sequentially with delays between types
    const regulatoryResults = await runScrapersByType(REGULATORY_TARGETS, 'Regulatory');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const businessResults = await runScrapersByType(BUSINESS_TARGETS, 'Business');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const cryptoResults = await runScrapersByType(CRYPTO_TARGETS, 'Crypto');

    const totalSuccess = regulatoryResults.successCount + businessResults.successCount + cryptoResults.successCount;
    const totalFail = regulatoryResults.failCount + businessResults.failCount + cryptoResults.failCount;
    const totalSkip = regulatoryResults.skipCount + businessResults.skipCount + cryptoResults.skipCount;

    logger.info(`🎉 FULL cycle completed: ${totalSuccess} ✓, ${totalFail} ✗, ${totalSkip} ⏩`);
    
    // Send comprehensive summary to Telegram
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `📊 ComplianceWatch Scan Complete\n` +
        `🌍 Regulatory: ${regulatoryResults.successCount}/${REGULATORY_TARGETS.length} ✓\n` +
        `💼 Business: ${businessResults.successCount}/${BUSINESS_TARGETS.length} ✓\n` +
        `₿ Crypto: ${cryptoResults.successCount}/${CRYPTO_TARGETS.length} ✓\n` +
        `⏩ Skipped: ${totalSkip} | ❌ Failed: ${totalFail}\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `Next scan in 3 hours ⏰`
      );
    } catch (error) {
      logger.error('Failed to send Telegram summary:', error);
    }
    
    return { totalSuccess, totalFail, totalSkip };
    
  } catch (error) {
    logger.error('runAllScrapers failed:', error);
    
    // Critical failure notification
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `🚨 SYSTEM CRITICAL FAILURE\n` +
        `Full scraping cycle failed\n` +
        `Error: ${error.message}\n` +
        `Time: ${new Date().toLocaleString()}\n` +
        `#Critical #Error`
      );
    } catch (telegramError) {
      logger.error('Also failed to send critical alert:', telegramError);
    }
    
    return { totalSuccess: 0, totalFail: 1, totalSkip: 0 };
  }
}

async function initializeApplication() {
  try {
    logger.info('🚀 Starting ComplianceWatch AI Backend...');
    logger.info(`📦 Loading ${REGULATORY_TARGETS.length + BUSINESS_TARGETS.length + CRYPTO_TARGETS.length} targets`);
    
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
    
    // Start Telegram bot
    try {
      startBot();
      logger.info('🤖 Telegram bot initialized');
    } catch (botError) {
      logger.warn('Telegram bot startup issue (will use API fallback):', botError.message);
    }
    
    // Schedule scraping every 3 hours
    nodeCron.schedule('0 */3 * * *', async () => {
      logger.info('⏰ 3-hour scraping cycle triggered');
      try {
        await runAllScrapers();
      } catch (error) {
        logger.error('Scheduled scraping failed:', error);
      }
    });
    
    // Initial scrape after 45 seconds (let system stabilize)
    setTimeout(async () => {
      logger.info('🔄 Initial full scrape starting...');
      try {
        const results = await runAllScrapers();
        logger.info(`✅ Initial scrape completed: ${results.totalSuccess} successes`);
      } catch (error) {
        logger.error('Initial scrape failed:', error);
      }
    }, 45000);
    
    logger.info('✅ Application started successfully');
    logger.info('📅 Automated scraping: Every 3 hours');
    logger.info('🤖 AI Summaries: Enabled for all targets');
    logger.info('💬 Telegram Alerts: Professional format with hashtags');
    
    // Startup notification
    try {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(
        `🚀 ComplianceWatch AI System Online\n` +
        `✅ All services operational\n` +
        `📊 ${REGULATORY_TARGETS.length + BUSINESS_TARGETS.length + CRYPTO_TARGETS.length} sources configured\n` +
        `⏰ Updates every 3 hours\n` +
        `🤖 AI-powered summaries enabled\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#SystemOnline #ComplianceAI`
      );
    } catch (error) {
      logger.warn('Failed to send startup notification:', error);
    }
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    process.exit(1);
  }
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the application
initializeApplication();
