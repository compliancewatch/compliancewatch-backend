import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runGenericScraper(target) {
  let browser = null;
  let page = null;
  
  try {
    console.log(`🔄 Starting: ${target.name}`);
    
    // Railway-optimized browser launch with Cloudflare Chromium
    browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    page = await browser.newPage();
    
    // Enhanced configuration for better success rates
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

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
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for page to stabilize with multiple wait strategies
    await page.waitForTimeout(5000);
    
    // Try to wait for content if selectors are specified
    if (target.titleSelector) {
      try {
        await page.waitForSelector(target.titleSelector, { 
          timeout: 15000,
          visible: true 
        });
      } catch (selectorError) {
        console.warn(`Selector ${target.titleSelector} not found, continuing anyway...`);
      }
    }

    const scrapedData = await page.evaluate((target) => {
      try {
        // More robust selector logic
        const titles = Array.from(document.querySelectorAll(target.titleSelector || 'h1, h2, h3, h4, h5, h6, a, .title, .headline, [class*="title"], [class*="headline"]'));
        const dates = Array.from(document.querySelectorAll(target.dateSelector || 'time, .date, .timestamp, [datetime], [class*="date"], [class*="time"]'));
        
        const results = [];
        const maxItems = 10;
        
        for (let i = 0; i < Math.min(titles.length, maxItems); i++) {
          const titleEl = titles[i];
          const dateEl = dates[i] || dates[0]; // Fallback to first date
          
          if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 5) {
            results.push({
              title: titleEl.textContent.trim(),
              url: titleEl.href || window.location.href,
              date: dateEl ? dateEl.textContent.trim() : new Date().toLocaleDateString(),
              source: target.name
            });
          }
        }
        
        return results;
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
          created_at: new Date().toISOString(),
          item_count: scrapedData.length
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      // Success notification
      await sendTelegramAlert(
        `✅ ${target.name} Update\n` +
        `📋 ${scrapedData.length} items collected\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#${target.name.replace(/\s+/g, '')} #Update`
      );
    } else {
      console.log(`⚠️ ${target.name}: No data found, but scrape completed`);
      
      // Still log the attempt
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

    console.log(`✅ ${target.name} completed`);
    return scrapedData;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    
    // Log error to database
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
    
    await sendTelegramAlert(
      `❌ ${target.name} Failed\nError: ${error.message}\nTime: ${new Date().toLocaleString()}`
    );
    
    throw error;
    
  } finally {
    // Cleanup
    if (page) {
      try {
        await page.close();
      } catch (pageError) {
        console.error('Error closing page:', pageError.message);
      }
    }
    
    if (browser) {
      try {
        await browser.close();
      } catch (browserError) {
        console.error('Error closing browser:', browserError.message);
      }
    }
  }
}
