// src/scrapers/generic-scraper.js
import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';
import { 
  SCRAPER_CONFIG,
  DateUtils, 
  DeduplicationUtils, 
  ScrapingStrategies 
} from '../utils/scraper-utils.js';

export async function runGenericScraper(target) {
  let browser = null;
  let page = null;
  
  try {
    console.log(`🔄 Starting: ${target.name} (${target.type})`);
    
    // SIMPLIFIED browser configuration for Railway
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--window-size=1920,1080'
      ],
      headless: "new",
      ignoreHTTPSErrors: true,
      timeout: 30000
    });

    page = await browser.newPage();
    
    // Basic anti-bot evasion
    await page.setJavaScriptEnabled(true);
    
    // Set realistic user agent
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    await page.setUserAgent(userAgent);
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br'
    });

    // Basic stealth
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`🌐 Navigating to: ${target.url}`);
    
    await page.goto(target.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Wait for specific content if specified
    if (target.waitForSelector) {
      try {
        await page.waitForSelector(target.waitForSelector, { 
          timeout: 10000
        });
      } catch (e) {
        console.warn(`Wait selector ${target.waitForSelector} not found`);
      }
    }

    // Content extraction
    const scrapedData = await page.evaluate(async (target, config) => {
      const results = [];
      const maxItems = 15;
      
      try {
        // Extract titles
        const titleSelectors = Array.isArray(target.titleSelector) ? 
          target.titleSelector : [target.titleSelector];
        
        let titleElements = [];
        for (const selector of titleSelectors) {
          try {
            const elements = Array.from(document.querySelectorAll(selector));
            if (elements.length > 0) {
              titleElements = elements;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        // Extract dates
        let dateElements = [];
        if (target.dateSelector) {
          const dateSelectors = Array.isArray(target.dateSelector) ? 
            target.dateSelector : [target.dateSelector];
          
          for (const selector of dateSelectors) {
            try {
              const elements = Array.from(document.querySelectorAll(selector));
              if (elements.length > 0) {
                dateElements = elements;
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }

        // Process items
        for (let i = 0; i < Math.min(titleElements.length, maxItems); i++) {
          try {
            const titleEl = titleElements[i];
            if (!titleEl) continue;

            const titleText = titleEl.textContent.trim();
            const url = titleEl.href || window.location.href;

            // Basic filtering
            if (!titleText || titleText.length < 10) continue;

            let dateText = '';
            if (dateElements[i]) {
              dateText = dateElements[i].getAttribute('datetime') || 
                         dateElements[i].textContent.trim();
            }

            results.push({
              title: titleText,
              url: url.startsWith('http') ? url : new URL(url, window.location.href).href,
              date: dateText,
              source: target.name,
              type: target.type
            });

          } catch (itemError) {
            continue;
          }
        }

      } catch (e) {
        console.error('Page evaluation error:', e);
      }
      
      return results;
    }, target, SCRAPER_CONFIG);

    console.log(`📊 ${target.name}: Found ${scrapedData.length} raw items`);

    // Data processing
    const processedData = [];
    
    for (const item of scrapedData) {
      try {
        const normalizedDate = DateUtils.parseDate(item.date, target.timezone);
        
        const shouldInclude = (title) => {
          const { minLength, maxLength } = target.verification || 
            { minLength: SCRAPER_CONFIG.minTitleLength, maxLength: SCRAPER_CONFIG.maxTitleLength };
          
          const length = title.length;
          if (length < minLength || length > maxLength) return false;
          
          return !SCRAPER_CONFIG.excludedPatterns.some(pattern => 
            new RegExp(pattern, 'i').test(title)
          );
        };

        if (shouldInclude(item.title)) {
          processedData.push({
            title: item.title,
            url: item.url,
            date: normalizedDate,
            source: item.source,
            type: item.type,
            scraped_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn('Error processing item:', error);
      }
    }

    // Deduplication
    const deduplicationConfig = target.deduplication || { strategy: "title", threshold: 0.8 };
    const uniqueItems = DeduplicationUtils.deduplicate(
      processedData, 
      deduplicationConfig.strategy, 
      deduplicationConfig.threshold
    );

    console.log(`✅ ${target.name}: ${uniqueItems.length} unique items after processing`);

    // Database storage
    if (uniqueItems.length > 0) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: uniqueItems,
          created_at: new Date().toISOString(),
          item_count: uniqueItems.length,
          status: 'success',
          type: target.type
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      await sendTelegramAlert(
        `✅ ${target.name} Update\n` +
        `📋 ${uniqueItems.length} items collected\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#${target.name.replace(/\s+/g, '')} #${target.type}`
      );

    } else {
      console.log(`⚠️ ${target.name}: No valid data found`);
      
      await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: [],
          created_at: new Date().toISOString(),
          item_count: 0,
          status: 'no_data',
          type: target.type
        });
    }

    console.log(`🎯 ${target.name} completed successfully`);
    return uniqueItems;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    
    await supabase
      .from('scraped_data')
      .insert({
        source: target.name,
        data: [],
        created_at: new Date().toISOString(),
        status: 'error',
        type: target.type,
        error_message: error.message
      });

    await sendTelegramAlert(
      `❌ ${target.name} Failed\n` +
      `Error: ${error.message}\n` +
      `Time: ${new Date().toLocaleString()}`
    );
    
    throw error;
    
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

export function createScraper(targetConfig) {
  return async () => {
    return await runGenericScraper(targetConfig);
  };
}
