import puppeteer from 'puppeteer-core';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runGenericScraper(target) {
  let browser = null;
  let page = null;
  
  try {
    console.log(`🔄 Starting: ${target.name}`);
    
    // Enhanced browser configuration
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--window-size=1920,1080'
      ],
      headless: "new",
      ignoreHTTPSErrors: true,
      timeout: 90000
    });

    page = await browser.newPage();
    
    // ================= ANTI-BOT EVASION =================
    await page.setJavaScriptEnabled(true);
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    // Stealth scripts
    await page.evaluateOnNewDocument(() => {
      // Overwrite navigator properties
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { 
        get: () => [{ name: 'Chrome PDF Plugin' }, { name: 'Chrome PDF Viewer' }]
      });
      
      // Mock Chrome runtime
      window.chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: { isInstalled: false }
      };
    });

    // Randomize viewport
    await page.setViewport({ 
      width: 1920,
      height: 1080
    });

    // Block unnecessary resources
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
    
    // Navigate with enhanced options
    await page.goto(target.url, { 
      waitUntil: 'networkidle2',
      timeout: target.waitTimeout || 60000
    });

    // Wait strategically
    await page.waitForTimeout(target.stealth ? 8000 : 5000);
    
    // Wait for specific content if specified
    if (target.waitForSelector) {
      try {
        await page.waitForSelector(target.waitForSelector, { 
          timeout: 15000,
          visible: true 
        });
      } catch (e) {
        console.warn(`Wait selector ${target.waitForSelector} not found`);
      }
    }

    // Take screenshot for debugging (optional)
    // await page.screenshot({ path: `/tmp/${target.name.replace(/\s+/g, '_')}.png` });

    const scrapedData = await page.evaluate((target) => {
      try {
        // Robust content extraction
        const titles = Array.from(document.querySelectorAll(target.titleSelector || 'h1, h2, h3, h4, h5, h6, a, .title, .headline'));
        const dates = Array.from(document.querySelectorAll(target.dateSelector || 'time, .date, .timestamp, [datetime]'));
        
        const results = [];
        const maxItems = 15;
        
        for (let i = 0; i < Math.min(titles.length, maxItems); i++) {
          const titleEl = titles[i];
          const dateEl = dates[i] || dates[0];
          
          if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 10) {
            const titleText = titleEl.textContent.trim();
            const url = titleEl.href || window.location.href;
            
            // Filter out navigation/header links
            if (!url.includes('#') && !titleText.match(/^(home|menu|login|sign|search)$/i)) {
              results.push({
                title: titleText,
                url: url,
                date: dateEl ? dateEl.textContent.trim() : new Date().toLocaleDateString(),
                source: target.name
              });
            }
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
      
      await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: [],
          created_at: new Date().toISOString(),
          item_count: 0,
          status: 'no_data',
          notes: 'Scraper ran but found no content with current selectors'
        });
    }

    console.log(`✅ ${target.name} completed`);
    return scrapedData;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    
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
