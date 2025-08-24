import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';
import { runAISummarizer } from '../services/ai-service.js';

// Global browser instance with robust management
let browserInstance = null;
let browserRestartCount = 0;
const MAX_BROWSER_RESTARTS = 5;

async function getBrowser() {
  if (!browserInstance) {
    try {
      browserInstance = await puppeteer.launch({
        executablePath: process.env.CHROMIUM_PATH,
        headless: "new",
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--remote-debugging-port=0'
        ],
        timeout: 30000
      });
      
      console.log('✅ Browser instance created');
      
      browserInstance.on('disconnected', () => {
        console.log('⚠️ Browser disconnected unexpectedly');
        browserInstance = null;
      });
      
    } catch (error) {
      console.error('❌ Failed to create browser:', error.message);
      browserInstance = null;
      throw error;
    }
  }
  
  // Check if browser is still connected and usable
  if (browserInstance && !browserInstance.connected) {
    console.log('⚠️ Browser not connected, recreating...');
    browserInstance = null;
    return getBrowser();
  }
  
  return browserInstance;
}

async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      console.log('✅ Browser closed gracefully');
    } catch (error) {
      console.error('Error closing browser:', error.message);
    }
    browserInstance = null;
  }
}

export async function runGenericScraper(target) {
  let page = null;
  try {
    console.log(`🔄 Starting: ${target.name}`);
    
    const browser = await getBrowser();
    
    // Additional safety check
    if (!browser || !browser.connected) {
      throw new Error('Browser not available or disconnected');
    }

    page = await browser.newPage();
    
    // Set realistic timeouts
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(15000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log(`🌐 Navigating to: ${target.url}`);
    await page.goto(target.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const scrapedData = await page.evaluate((target) => {
      try {
        const titles = Array.from(document.querySelectorAll(target.titleSelector || 'h1, h2, h3, a'));
        const dates = Array.from(document.querySelectorAll(target.dateSelector || 'time, .date'));
        
        return titles.slice(0, 10).map((titleEl, index) => ({
          title: titleEl.textContent.trim(),
          url: titleEl.href || window.location.href,
          date: dates[index] ? dates[index].textContent.trim() : new Date().toLocaleDateString(),
          source: target.name
        }));
      } catch (e) {
        console.error('Page evaluation error:', e);
        return [];
      }
    }, target);

    console.log(`📊 ${target.name}: Found ${scrapedData.length} items`);

    if (scrapedData.length > 0) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: scrapedData,
          created_at: new Date().toISOString()
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      // Try AI summary, but don't let it break the scraper
      try {
        await runAISummarizer(target.name);
      } catch (aiError) {
        console.error(`AI summary failed for ${target.name}:`, aiError.message);
        // Continue without AI - not critical
      }
    }

    console.log(`✅ ${target.name} completed`);
    return scrapedData;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    
    // Close browser on error to clean up
    await closeBrowser();
    browserRestartCount++;
    
    if (browserRestartCount >= MAX_BROWSER_RESTARTS) {
      console.error('❌ Too many browser restarts, stopping...');
      process.exit(1);
    }
    
    await sendTelegramAlert(
      `❌ ${target.name} Failed\nError: ${error.message}\nTime: ${new Date().toLocaleString()}`
    );
    
    throw error;
  } finally {
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
