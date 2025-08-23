import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

// Global browser instance to avoid multiple browsers
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--remote-debugging-port=0',
        '--remote-debugging-address=0.0.0.0'
      ],
      timeout: 60000
    });
    
    // Handle browser disconnects
    browserInstance.on('disconnected', () => {
      console.log('Browser disconnected, cleaning up...');
      browserInstance = null;
    });
  }
  
  // Check if browser is still connected
  if (!browserInstance.connected) {
    console.log('Browser not connected, creating new instance...');
    browserInstance = null;
    return getBrowser();
  }
  
  return browserInstance;
}

async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (error) {
      console.error('Error closing browser:', error.message);
    }
    browserInstance = null;
  }
}

// Restart browser every 10 scrapes to prevent memory leaks
let scrapeCount = 0;
const MAX_SCRAPES_BEFORE_RESTART = 10;

export async function runGenericScraper(target) {
  let page = null;
  try {
    console.log(`🔄 Starting scraper for: ${target.name}`);
    
    // Get or create browser instance
    const browser = await getBrowser();
    
    // Restart browser periodically to prevent memory issues
    scrapeCount++;
    if (scrapeCount >= MAX_SCRAPES_BEFORE_RESTART) {
      console.log('🔄 Restarting browser to prevent memory leaks...');
      await closeBrowser();
      scrapeCount = 0;
      return runGenericScraper(target); // Retry with new browser
    }

    // Check if browser is still connected
    if (!browser.connected) {
      console.log('Browser disconnected, recreating...');
      await closeBrowser();
      return runGenericScraper(target); // Retry with new browser
    }

    console.log('🌐 Creating new page...');
    page = await browser.newPage();
    
    // Set longer timeouts
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log(`🌐 Navigating to: ${target.url}`);
    await page.goto(target.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for the page to stabilize
    await page.waitForTimeout(3000);

    console.log('🔍 Checking for selectors...');
    try {
      await page.waitForSelector(target.titleSelector, { 
        timeout: 15000,
        visible: true
      });
    } catch (selectorError) {
      console.warn(`Selector ${target.titleSelector} not found, trying without it...`);
    }

    console.log('🔍 Extracting data...');
    const scrapedData = await page.evaluate((target) => {
      try {
        const titles = Array.from(document.querySelectorAll(target.titleSelector || 'h1, h2, h3, h4, h5, h6, a'));
        const dates = Array.from(document.querySelectorAll(target.dateSelector || 'time, .date, [datetime]'));
        
        return titles.slice(0, 15).map((titleEl, index) => ({
          title: titleEl.textContent.trim(),
          url: titleEl.href || window.location.href,
          date: dates[index] ? dates[index].textContent.trim() : new Date().toLocaleDateString(),
          source: target.name,
          language: target.language,
          type: target.type
        }));
      } catch (e) {
        console.error('Evaluation error:', e);
        return [{ title: 'Error during scraping', source: target.name }];
      }
    }, target);

    console.log(`📊 Found ${scrapedData.length} items from ${target.name}`);

    // Only save if we have meaningful data
    if (scrapedData.length > 0 && !scrapedData[0].title.includes('Error')) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: scrapedData,
          scraped_at: new Date().toISOString(),
          type: target.type,
          language: target.language
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Send success notification
      if (scrapedData.length > 0) {
        await sendTelegramAlert(
          `✅ ${target.name} Update\n` +
          `📋 ${scrapedData.length} new items\n` +
          `🕒 ${new Date().toLocaleString()}`
        );
      }
    } else {
      console.log('⚠️ No meaningful data found, skipping database insert');
    }

    console.log(`✅ ${target.name} scraping completed`);
    return scrapedData;

  } catch (error) {
    console.error(`❌ ${target.name} scraper error:`, error.message);
    
    // Close browser on error to clean up
    await closeBrowser();
    scrapeCount = 0;
    
    await sendTelegramAlert(
      `❌ ${target.name} Failed\n` +
      `Error: ${error.message}\n` +
      `Time: ${new Date().toLocaleString()}`
    );
    
    throw error;
  } finally {
    // Clean up page
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (pageError) {
        console.error('Error closing page:', pageError.message);
      }
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  await closeBrowser();
  process.exit(0);
});
