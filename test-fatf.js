import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logError } from './utils/logger.js';

puppeteer.use(StealthPlugin());

async function testFATFScraper() {
  console.log("🚀 Starting enhanced FATF scraper test...");
  
  try {
    const browser = await puppeteer.launch({
      headless: false,  // Switch to true after testing
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');

    console.log("🌐 Navigating to FATF...");
    await page.goto('https://www.fatf-gafi.org/en/publications.html', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log("🔍 Extracting data...");
    const data = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.list-item').forEach(item => {
        items.push({
          title: item.querySelector('a')?.innerText.trim(),
          link: item.querySelector('a')?.href,
          date: item.querySelector('.date')?.innerText.trim()
        });
      });
      return items;
    });

    console.log("✅ Scrape results:", JSON.stringify(data, null, 2));
    await browser.close();
    return data;

  } catch (error) {
    logError('FATF_TEST', error);
    console.error("❌ Full error details:", error.stack);
    return [];
  }
}

testFATFScraper();