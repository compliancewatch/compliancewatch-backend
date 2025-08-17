const { startBot, postUpdates } = require('./services/telegram-bot');
const scrapeFATF = require('./scraper/regulatory/fatf');
const logger = require('./utils/logger');

async function test() {
  try {
    // 1. Test scraping
    logger.info('Starting FATF scrape test');
    await scrapeFATF();
    
    // 2. Test Telegram posting
    logger.info('Testing Telegram posting');
    await postUpdates();
    
    // 3. Start bot
    logger.info('Starting Telegram bot');
    startBot();
  } catch (error) {
    logger.error('Integration test failed:', error.stack);
  }
}

test();
