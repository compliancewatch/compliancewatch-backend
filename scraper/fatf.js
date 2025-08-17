import puppeteer from 'puppeteer';
import { saveToDB } from '../services/db.js';
import telegram from '../services/telegram-bot.js';
import { logger } from '../utils/logger.js';

async function scrapeFATF() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.fatf-gafi.org/en/publications.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const items = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.list-item')).map(item => ({
        title: item.querySelector('a')?.textContent.trim() || 'No title',
        url: item.querySelector('a')?.href || '#',
        date: new Date().toISOString(),
        source: 'FATF'
      }));
    });

    for (const item of items.slice(0, 3)) {
      const summary = `New update from FATF: ${item.title.substring(0, 50)}...`;
      await saveToDB({ ...item, summary });
      await telegram.postUpdate({ ...item, summary });
    }
  } catch (error) {
    logger.error(`Scrape failed: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

export default scrapeFATF;