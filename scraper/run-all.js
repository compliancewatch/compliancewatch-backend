import scrapeFATF from './fatf.js';
import telegram from '../services/telegram-bot.js';
import { logger } from '../utils/logger.js';

(async () => {
  try {
    logger.info('Starting scraping job...');
    await scrapeFATF();
    logger.info('Scraping completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Scraping failed:', error.message);
    await telegram.bot.sendMessage(
      process.env.ADMIN_CHAT_ID,
      `🛑 Scraper failed: ${error.message}`
    );
    process.exit(1);
  }
})();