// src/app-core.js - COMPLETE CORE APPLICATION LOGIC
export async function initializeApplication({ logger, sendTelegramAlert, nodeCron, scrapers, targets }) {
  const { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } = targets;
  const activeScrapers = new Set();

  async function runScraperWithRetry(target) {
    if (activeScrapers.has(target.name)) {
      logger.warn(`⏩ ${target.name} already running, skipping...`);
      return { success: false, skipped: true };
    }

    activeScrapers.add(target.name);
    
    try {
      logger.info(`🔄 Starting: ${target.name}`);
      const scraperFunction = scrapers[target.scraper];
      
      if (!scraperFunction) {
        throw new Error(`No scraper function found for: ${target.scraper}`);
      }

      const result = await scraperFunction();
      logger.info(`✅ ${target.name} completed successfully`);
      return { success: true, data: result };

    } catch (error) {
      logger.error(`❌ ${target.name} failed:`, error.message);
      
      try {
        await sendTelegramAlert(
          `❌ ${target.name} Failed\nError: ${error.message}\nTime: ${new Date().toLocaleString()}\n#Error`
        );
      } catch (telegramError) {
        logger.error('Failed to send error alert:', telegramError);
      }
      
      return { success: false, error: error.message };
      
    } finally {
      activeScrapers.delete(target.name);
    }
  }

  async function runScrapersByType(targets, typeName) {
    logger.info(`🔄 Starting ${typeName} scrapers...`);
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const target of targets) {
      try {
        const result = await runScraperWithRetry(target);
        
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
      logger.info('🔄 Starting FULL scraping cycle...');
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
  
  logger.info('✅ Application core initialized successfully');
  logger.info('📅 Automated scraping: Every 3 hours');
  logger.info('💬 Telegram Alerts: Professional format with hashtags');
  
  // Startup notification
  try {
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
}
