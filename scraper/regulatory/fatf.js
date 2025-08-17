// scraper/regulatory/fatf.js
const puppeteer = require('puppeteer');
const { logger } = require('../../utils/logger');
const { saveToSupabase } = require('../../services/supabase');
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

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto(target.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const items = await page.evaluate((target) => {
      return Array.from(document.querySelectorAll(target.titleSelector)).map(item => ({
        title: item.textContent.trim(),
        url: item.querySelector('a')?.href || target.url,
        date: item.closest('.list-item').querySelector(target.dateSelector)?.textContent.trim(),
        source: target.name
      }));
    }, target);

    for (const item of items.slice(0, 5)) { // Limit to 5 items
      const summary = await generateSummary(item.title, item.url);
      await saveToSupabase({ 
        ...item,
        summary,
        is_posted: false
      });
    }
  } catch (error) {
    logger.error(`FATF scrape failed: ${error.message}`);
  } finally {
    await browser.close();
  }
};
