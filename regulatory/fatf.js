// scraper/regulatory/fatf.js
const puppeteer = require('puppeteer');
const logger = require('../../utils/logger');
const { supabase } = require('../../services/supabase');
const { generateSummary } = require('../../services/ai-service');

module.exports = async function scrapeFATF() {
  const target = {
    name: "FATF",
    url: "https://www.fatf-gafi.org/en/publications.html",
    titleSelector: ".list-item h3",
    dateSelector: ".date",
    dateFormat: "MMMM D, YYYY",
    language: "en"
  };

  logger.info(`Starting FATF scrape (${target.url})`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigation with timeout
    await page.goto(target.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Scrape data
    const items = await page.evaluate((target) => {
      return Array.from(document.querySelectorAll(target.titleSelector)).map(item => ({
        title: item.textContent.trim(),
        url: item.querySelector('a')?.href || target.url,
        date: item.closest('.list-item')?.querySelector(target.dateSelector)?.textContent.trim(),
        source: target.name
      }));
    }, target);

    logger.info(`Found ${items.length} items`);

    // Process and store items
    for (const item of items.slice(0, 5)) { // Limit to 5 items
      try {
        const summary = await generateSummary(item.title, item.url);
        
        const { error } = await supabase
          .from('news_updates')
          .insert([{
            ...item,
            summary,
            is_posted: false
          }]);

        if (error) throw error;
        logger.debug(`Stored: ${item.title.substring(0, 50)}...`);
      } catch (error) {
        logger.error(`Failed to process item: ${error.message}`);
      }
    }

  } catch (error) {
    logger.error(`Scrape failed: ${error.message}`);
  } finally {
    await browser.close();
    logger.info('FATF scrape completed');
  }
};