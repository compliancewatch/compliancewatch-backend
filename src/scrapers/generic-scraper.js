import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';
import { runAISummarizer } from '../services/ai-service.js'; // ← ADD AI IMPORT

// Global browser instance with better management
let browserInstance = null;
let scrapeCount = 0;
const MAX_SCRAPES_BEFORE_RESTART = 15;

async function getBrowser() {
  if (!browserInstance) {
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
        '--disable-gpu'
      ],
      timeout: 60000
    });
    
    // Handle browser cleanup
    browserInstance.on('disconnected', () => {
      console.log('Browser disconnected, cleaning up...');
      browserInstance = null;
    });
  }
  
  // Restart browser periodically to prevent memory leaks
  scrapeCount++;
  if (scrapeCount >= MAX_SCRAPES_BEFORE_RESTART) {
    console.log('🔄 Restarting browser to prevent memory leaks...');
    if (browserInstance) {
      await browserInstance.close();
    }
    browserInstance = null;
    scrapeCount = 0;
  }
  
  return browserInstance;
}

export async function runGenericScraper(target) {
  let page = null;
  try {
    console.log(`🔄 Starting: ${target.name}`);
    
    const browser = await getBrowser();
    
    // Check if browser is still connected
    if (!browser.connected) {
      console.log('Browser disconnected, recreating...');
      browserInstance = null;
      return runGenericScraper(target); // Retry with new browser
    }

    page = await browser.newPage();
    
    // Enhanced browser configuration
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Block unnecessary resources for faster loading
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

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Try to wait for selectors if specified
    if (target.titleSelector) {
      try {
        await page.waitForSelector(target.titleSelector, { 
          timeout: 10000,
          visible: true 
        });
      } catch (selectorError) {
        console.warn(`Selector ${target.titleSelector} not found, continuing anyway...`);
      }
    }

    const scrapedData = await page.evaluate((target) => {
      try {
        const titles = Array.from(document.querySelectorAll(target.titleSelector || 'h1, h2, h3, h4, h5, h6, a'));
        const dates = Array.from(document.querySelectorAll(target.dateSelector || 'time, .date, [datetime], .timestamp'));
        
        const results = [];
        const maxItems = 15; // Limit to prevent too many items
        
        for (let i = 0; i < Math.min(titles.length, maxItems); i++) {
          const titleEl = titles[i];
          const dateEl = dates[i] || dates[0]; // Fallback to first date if available
          
          if (titleEl && titleEl.textContent.trim()) {
            results.push({
              title: titleEl.textContent.trim(),
              url: titleEl.href || window.location.href,
              date: dateEl ? dateEl.textContent.trim() : new Date().toLocaleDateString(),
              source: target.name,
              language: target.language || 'en',
              type: target.type || 'general'
            });
          }
        }
        
        return results;
      } catch (e) {
        console.error('Page evaluation error:', e);
        return [{ 
          title: 'Error during content extraction', 
          source: target.name,
          error: e.message 
        }];
      }
    }, target);

    console.log(`📊 ${target.name}: Found ${scrapedData.length} items`);

    // Filter out error items and empty data
    const validData = scrapedData.filter(item => 
      item.title && !item.title.includes('Error during') && item.title.trim().length > 5
    );

    if (validData.length > 0) {
      // Save to database
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: validData,
          created_at: new Date().toISOString(),
          item_count: validData.length,
          type: target.type,
          language: target.language,
          status: 'success'
        });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // ✅ USE AI SUMMARIZATION (like FATF scraper)
      try {
        console.log(`🤖 Generating AI summary for ${target.name}...`);
        const aiSuccess = await runAISummarizer(target.name);
        
        if (!aiSuccess) {
          // Fallback to basic notification if AI fails
          await sendTelegramAlert(
            `✅ ${target.name} Update\n` +
            `📋 ${validData.length} new items found\n` +
            `🕒 ${new Date().toLocaleString()}\n` +
            `#${target.name.replace(/\s+/g, '')} #${target.type}`
          );
        }
      } catch (aiError) {
        console.error(`AI summarization failed for ${target.name}:`, aiError);
        // Fallback notification
        await sendTelegramAlert(
          `📰 ${target.name} Update\n` +
          `📊 ${validData.length} items processed\n` +
          `🕒 ${new Date().toLocaleString()}\n` +
          `#${target.type} #Update`
        );
      }
    } else {
      console.log(`⚠️ ${target.name}: No valid data found`);
      
      // Still save to track scraping attempts
      await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: [],
          created_at: new Date().toISOString(),
          item_count: 0,
          status: 'no_data'
        });
    }

    console.log(`✅ ${target.name} completed successfully`);
    return validData;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    
    // Save error to database
    try {
      await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: [],
          created_at: new Date().toISOString(),
          status: 'error',
          error_message: error.message
        });
    } catch (dbError) {
      console.error('Failed to save error to database:', dbError);
    }
    
    // Send error notification
    await sendTelegramAlert(
      `❌ ${target.name} Failed\n` +
      `Error: ${error.message}\n` +
      `Time: ${new Date().toLocaleString()}\n` +
      `#Error #${target.type}`
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

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (browserInstance) {
    await browserInstance.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  if (browserInstance) {
    await browserInstance.close();
  }
  process.exit(0);
});
