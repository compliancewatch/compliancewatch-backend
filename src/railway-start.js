import { logger } from './utils/logger.js';
import { testConnection } from './services/database.js';
import { startBot } from './services/telegram-bot.js';
import nodeCron from 'node-cron';
import { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS, ALL_TARGETS } from '../config/targets.js';

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

// Map targets to their scraper functions
const scraperMap = {
  // Regulatory
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
  
  // Business
  'bloomberg': runBloombergScraper,
  'reuters': runReutersScraper,
  'financial-times': runFinancialTimesScraper,
  'yahoo-finance': runYahooFinanceScraper,
  
  // Crypto
  'coindesk': runCoinDeskScraper,
  'cointelegraph': runCoinTelegraphScraper,
  'cryptoslate': runCryptoSlateScraper,
  'the-block': runTheBlockScraper,
  
  // Special
  'fatf': runFATFScraper
};

async function runScrapersByType(targets, typeName) {
  logger.info(`🔄 Starting ${typeName} scrapers...`);
  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (const target of targets) {
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        const scraperFunction = scraperMap[target.scraper];
        if (scraperFunction) {
          logger.scraper.start(target.name);
          await scraperFunction();
          successCount++;
          success = true;
          results.push({ target: target.name, status: 'success' });
          
          // Add delay between scrapers to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        retries--;
        logger.warn(`Retry ${3-retries}/3 for ${target.name}:`, error.message);
        
        if (retries === 0) {
          logger.scraper.fail(target.name, error);
          failCount++;
          results.push({ target: target.name, status: 'failed', error: error.message });
        } else {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait before retry
        }
      }
    }
  }
  
  logger.info(`✅ ${typeName} scrapers completed: ${successCount} success, ${failCount} failed`);
  return { successCount, failCount, results };
}

// REMOVE THE DUPLICATE EXPORT - KEEP ONLY THIS ONE
async function runAllScrapers() {
  logger.info('🔄 Starting all scrapers...');
  
  const regulatoryResults = await runScrapersByType(REGULATORY_TARGETS, 'regulatory');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const businessResults = await runScrapersByType(BUSINESS_TARGETS, 'business');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const cryptoResults = await runScrapersByType(CRYPTO_TARGETS, 'crypto');
  
  const totalSuccess = regulatoryResults.successCount + businessResults.successCount + cryptoResults.successCount;
  const totalFail = regulatoryResults.failCount + businessResults.failCount + cryptoResults.failCount;
  
  logger.info(`✅ All scrapers completed: ${totalSuccess} success, ${totalFail} failed`);
  
  // Send summary notification
  try {
    const { sendTelegramAlert } = await import('./services/telegram-bot.js');
    await sendTelegramAlert(
      `📊 Full Scrape Complete\n` +
      `✅ Regulatory: ${regulatoryResults.successCount}/${REGULATORY_TARGETS.length}\n` +
      `✅ Business: ${businessResults.successCount}/${BUSINESS_TARGETS.length}\n` +
      `✅ Crypto: ${cryptoResults.successCount}/${CRYPTO_TARGETS.length}\n` +
      `🕒 ${new Date().toLocaleString()}`
    );
  } catch (error) {
    logger.error('Failed to send completion alert:', error);
  }
  
  return { 
    totalSuccess, 
    totalFail,
    regulatory: regulatoryResults,
    business: businessResults,
    crypto: cryptoResults
  };
}

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
    
    // Schedule scraping jobs
    logger.info('⏰ Scheduling scraper jobs...');
    
    // Regulatory targets: Daily at 9 AM UTC
    nodeCron.schedule('0 9 * * *', async () => {
      logger.info('⏰ Scheduled regulatory scrapers started');
      await runScrapersByType(REGULATORY_TARGETS, 'regulatory');
    });
    
    // Business targets: Daily at 10 AM UTC  
    nodeCron.schedule('0 10 * * *', async () => {
      logger.info('⏰ Scheduled business scrapers started');
      await runScrapersByType(BUSINESS_TARGETS, 'business');
    });
    
    // Crypto targets: Daily at 11 AM UTC
    nodeCron.schedule('0 11 * * *', async () => {
      logger.info('⏰ Scheduled crypto scrapers started');
      await runScrapersByType(CRYPTO_TARGETS, 'crypto');
    });
    
    // FATF specific: Daily at 8 AM UTC
    nodeCron.schedule('0 8 * * *', async () => {
      logger.info('⏰ Scheduled FATF scraper started');
      try {
        await runFATFScraper();
      } catch (error) {
        logger.error('FATF scraper failed:', error);
      }
    });
    
    // Full system scrape: Every Sunday at 7 AM UTC
    nodeCron.schedule('0 7 * * 0', async () => {
      logger.info('⏰ Scheduled full system scrape started');
      await runAllScrapers();
    });
    
    logger.info('✅ Application started successfully');
    logger.info('📅 Scrapers scheduled:');
    logger.info('   - FATF: Daily at 8 AM UTC');
    logger.info('   - Regulatory: Daily at 9 AM UTC');
    logger.info('   - Business: Daily at 10 AM UTC');
    logger.info('   - Crypto: Daily at 11 AM UTC');
    logger.info('   - Full System: Sundays at 7 AM UTC');
    
    // Health check endpoint for Railway
    if (process.env.NODE_ENV === 'production') {
      const express = (await import('express')).default;
      const app = express();
      
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'OK', 
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        });
      });
      
      app.listen(process.env.PORT || 3000, () => {
        logger.info(`🏥 Health check server running on port ${process.env.PORT || 3000}`);
      });
    }
    
  } catch (error) {
    logger.error('❌ Application startup failed', error);
    
    // Try to send error notification
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

// REMOVE THE DUPLICATE EXPORT LINE - ONLY EXPORT ONCE
// export { runAllScrapers, runScrapersByType };
