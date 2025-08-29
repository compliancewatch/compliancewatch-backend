// src/app-core.js - CORE APPLICATION LOGIC
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
    let successCount = 0, failCount = 0, skipCount = 0;

    for (const target of targets) {
      try {
        const result = await runScraperWithRetry(target);
        result.success ? successCount++ : result.skipped ? skipCount++ : failCount++;
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
      
      const regulatoryResults = await runScrapersByType(REGULATORY_TARGETS, 'Regulatory');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const businessResults = await runScrapersByType(BUSINESS_TARGETS, 'Business');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const cryptoResults = await runScrapersByType(CRYPTO_TARGETS, 'Crypto');

      const totalSuccess = regulatoryResults.successCount + businessResults.successCount + cryptoResults.successCount;
      const totalFail = regulatoryResults.failCount + businessResults.failCount + cryptoResults.failCount;
      const totalSkip = regulatoryResults.skipCount + businessResults.skipCount + cryptoResults.skipCount;

      logger.info(`🎉 FULL cycle completed: ${totalSuccess} ✓, ${totalFail} ✗, ${totalSkip} ⏩`);
      
      await sendTelegramAlert(
        `📊 ComplianceWatch Scan Complete\n` +
        `🌍 Regulatory: ${regulatoryResults.successCount}/${REGULATORY_TARGETS.length} ✓\n` +
        `💼 Business: ${businessResults.successCount}/${BUSINESS_TARGETS.length} ✓\n` +
        `₿ Crypto: ${cryptoResults.successCount}/${CRYPTO_TARGETS.length} ✓\n` +
        `⏩ Skipped: ${totalSkip} | ❌ Failed: ${totalFail}\n` +
        `🕒 ${new Date().toLocaleString()}\nNext scan in 3 hours ⏰`
      );
      
      return { totalSuccess, totalFail, totalSkip };
      
    } catch (error) {
      logger.error('runAllScrapers failed:', error);
      await sendTelegramAlert(`🚨 SYSTEM CRITICAL FAILURE\nError: ${error.message}\nTime: ${new Date().toLocaleString()}`);
      return { totalSuccess: 0, totalFail: 1, totalSkip: 0 };
    }
  }

  // Schedule scraping every 3 hours
  nodeCron.schedule('0 */3 * * *', runAllScrapers);

  // Initial scrape after 30 seconds
  setTimeout(runAllScrapers, 30000);

  logger.info('✅ Application core initialized successfully');
}
