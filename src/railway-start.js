// src/railway-start.js
import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import { runAISummarizer } from './services/ai-service.js';
import nodeCron from 'node-cron';

// Import targets
import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS, ALL_TARGETS } from '../../config/targets.js';

// Import all scraper functions
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

// Map targets to scraper functions
const scraperMap = {
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
  'bloomberg': runBloombergScraper,
  'reuters': runReutersScraper,
  'financial-times': runFinancialTimesScraper,
  'yahoo-finance': runYahooFinanceScraper,
  'coindesk': runCoinDeskScraper,
  'cointelegraph': runCoinTelegraphScraper,
  'cryptoslate': runCryptoSlateScraper,
  'the-block': runTheBlockScraper,
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
        await scraperFunction();
        successCount++;
        // Process with AI summarization
        await processWithAI(target.name);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      logger.error(`Failed to scrape ${target.name}:`, error);
      failCount++;
    }
  }
  
  logger.info(`✅ ${typeName} scrapers: ${successCount} success, ${failCount} failed`);
  return { successCount, failCount };
}

async function processWithAI(source) {
  try {
    logger.info(`🤖 Processing ${source} data with AI...`);
    const summary = await runAISummarizer(source);
    
    if (summary) {
      const { sendTelegramAlert } = await import('./services/telegram-bot.js');
      await sendTelegramAlert(summary);
      logger.info(`✅ AI summary sent for ${source}`);
    }
  } catch (error) {
    logger.error(`AI processing failed for ${source}:`, error);
  }
}

async function runAllScrapers() {
  logger.info('🔄 Starting full scraping cycle...');
  
  const results = await Promise.allSettled([
    runScrapersByType(REGULATORY_TARGETS, 'regulatory'),
    runScrapersByType(BUSINESS_TARGETS, 'business'),
    runScrapersByType(CRYPTO_TARGETS, 'crypto')
  ]);

  const totalSuccess = results.reduce((sum, result) => 
    sum + (result.value?.successCount || 0), 0);
  const totalFail = results.reduce((sum, result) => 
    sum + (result.value?.failCount || 0), 0);

  logger.info(`✅ Full cycle completed: ${totalSuccess} success, ${totalFail} failed`);
  return { totalSuccess, totalFail };
}

async function initializeApplication() {
  try {
    logger.info('🚀 Starting Enhanced ComplianceWatch Backend...');
    
    // Verify environment variables
    const requiredEnvVars = [
      'SUPABASE_URL', 'SUPABASE_KEY', 'TELEGRAM_BOT_TOKEN',
      'TELEGRAM_CHANNEL_ID', 'CHROMIUM_PATH', 'OPENROUTER_API_KEY'
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
    
    // Also run immediately on startup
    setTimeout(async () => {
      await runAllScrapers();
    }, 10000);
    
    logger.info('✅ Application started successfully');
    logger.info('📅 Scraping scheduled: Every 3 hours');
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    process.exit(1);
  }
}

initializeApplication();
