import puppeteer from 'puppeteer-core';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runGenericScraper(target) {
  let browser = null;
  let page = null;
  
  try {
    console.log(`🔄 Starting: ${target.name}`);
    
    // Enhanced browser configuration for Docker stability
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-setuid-sandbox',
        '--disable-features=VizDisplayCompositor',
        '--disable-software-rasterizer',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--flag-switches-begin',
        '--flag-switches-end'
      ],
      headless: "new",
      ignoreHTTPSErrors: true,
      timeout: 60000
    });

    page = await browser.newPage();
    
    // Enhanced page configuration
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log(`🌐 Navigating to: ${target.url}`);
    await page.goto(target.url, { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait more strategically
    await page.waitForTimeout(5000);
    
    // Try to wait for content if selectors are specified
    if (target.titleSelector) {
      try {
        await page.waitForSelector(target.titleSelector, { 
          timeout: 10000,
          visible: true 
        });
      } catch (e) {
        console.warn(`Selector ${target.titleSelector} not found, continuing...`);
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
          item_count: scrapedData.length,
          status: 'success'
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      await sendTelegramAlert(
        `✅ ${target.name} Update\n` +
        `📋 ${scrapedData.length} items collected\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#${target.name.replace(/\s+/g, '')} #Update`
      );
    } else {
      console.log(`⚠️ ${target.name}: No data found`);
      
      // Log empty result
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
    await supabase
      .from('scraped_data')
      .insert({
        source: target.name,
        data: [],
        created_at: new Date().toISOString(),
        status: 'error',
        error_message: error.message
      });

    await sendTelegramAlert(
      `❌ ${target.name} Failed\nError: ${error.message}\nTime: ${new Date().toLocaleString()}`
    );
    
    throw error;
    
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}
