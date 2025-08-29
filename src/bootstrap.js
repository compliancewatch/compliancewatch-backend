// src/bootstrap.js - COMPLETE NEW STARTUP FILE
console.log('🚀 ComplianceWatch Bootstrap Starting...');

async function initializeApp() {
  try {
    console.log('📦 Loading dependencies...');
    
    // 1. First load config with dynamic import
    console.log('🔧 Loading configuration...');
    const { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS } = await import('../../config/targets.js');
    console.log('✅ Config loaded:', {
      regulatory: REGULATORY_TARGETS.length,
      business: BUSINESS_TARGETS.length,
      crypto: CRYPTO_TARGETS.length
    });

    // 2. Load other core dependencies
    console.log('🔧 Loading core modules...');
    const { logger } = await import('./utils/logger.js');
    const { testConnection } = await import('./services/database.js');
    const { startBot, sendTelegramAlert } = await import('./services/telegram-bot.js');
    const nodeCron = (await import('node-cron')).default;

    console.log('✅ Core modules loaded');

    // 3. Load all scrapers dynamically
    console.log('🔧 Loading scrapers...');
    const scrapers = {
      'un-security-council': (await import('./scrapers/un-security-council.js')).runUNSecurityCouncilScraper,
      'unctad': (await import('./scrapers/unctad.js')).runUNCTADScraper,
      'sec': (await import('./scrapers/sec.js')).runSECScraper,
      'eu-commission': (await import('./scrapers/eu-commission.js')).runEUCommissionScraper,
      'fca-uk': (await import('./scrapers/fca-uk.js')).runFCAUKScraper,
      'masak': (await import('./scrapers/masak.js')).runMASAKScraper,
      'cmb-turkey': (await import('./scrapers/cmb-turkey.js')).runCMBTurkeyScraper,
      'isa-israel': (await import('./scrapers/isa-israel.js')).runISAIsraelScraper,
      'sca-uae': (await import('./scrapers/sca-uae.js')).runSCAUAEScraper,
      'cnbv-mexico': (await import('./scrapers/cnbv-mexico.js')).runCNBVMexicoScraper,
      'cvm-brazil': (await import('./scrapers/cvm-brazil.js')).runCVMBrazilScraper,
      'mas-singapore': (await import('./scrapers/mas-singapore.js')).runMASSingaporeScraper,
      'cbrc-china': (await import('./scrapers/cbrc-china.js')).runCBRCChinaScraper,
      'bloomberg': (await import('./scrapers/bloomberg.js')).runBloombergScraper,
      'reuters': (await import('./scrapers/reuters.js')).runReutersScraper,
      'financial-times': (await import('./scrapers/financial-times.js')).runFinancialTimesScraper,
      'yahoo-finance': (await import('./scrapers/yahoo-finance.js')).runYahooFinanceScraper,
      'coindesk': (await import('./scrapers/coindesk.js')).runCoinDeskScraper,
      'cointelegraph': (await import('./scrapers/cointelegraph.js')).runCoinTelegraphScraper,
      'cryptoslate': (await import('./scrapers/cryptoslate.js')).runCryptoSlateScraper,
      'the-block': (await import('./scrapers/the-block.js')).runTheBlockScraper,
      'fatf': (await import('./scrapers/fatf.js')).runScraper
    };

    console.log('✅ All scrapers loaded');

    // 4. Initialize services
    console.log('🔧 Initializing services...');
    await testConnection();
    startBot();
    
    // 5. Start the main application logic
    console.log('🔧 Starting main application...');
    const { initializeApplication } = await import('./app-core.js');
    await initializeApplication({
      logger,
      sendTelegramAlert,
      nodeCron,
      scrapers,
      targets: { REGULATORY_TARGETS, BUSINESS_TARGETS, CRYPTO_TARGETS }
    });

  } catch (error) {
    console.error('❌ Bootstrap failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Start the application
initializeApp();
