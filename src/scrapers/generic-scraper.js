// src/scrapers/generic-scraper.js - ENHANCED WITH DEBUGGING
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
    
    // Browser configuration
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
    
    // Basic anti-bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`🌐 Navigating to: ${target.url}`);
    
    await page.goto(target.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // DEBUG: Log page content for selector troubleshooting
    try {
      const pageTitle = await page.title();
      console.log(`🔍 Page title: ${pageTitle}`);
      
      // Check what selectors are available
      const availableElements = await page.evaluate((selectors) => {
        const results = {};
        const selectorList = Array.isArray(selectors) ? selectors : [selectors];
        
        selectorList.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            results[selector] = elements.length;
          } catch (e) {
            results[selector] = 'invalid selector';
          }
        });
        
        return results;
      }, target.titleSelector);
      
      console.log(`🔍 Selector analysis:`, JSON.stringify(availableElements, null, 2));
      
    } catch (debugError) {
      console.warn('Debug analysis failed:', debugError.message);
    }

    await page.waitForTimeout(3000);

    // Wait for selector if specified
    if (target.waitForSelector && target.waitForSelector !== 'body') {
      try {
        await page.waitForSelector(target.waitForSelector, { timeout: 10000 });
      } catch (e) {
        console.warn(`Wait selector ${target.waitForSelector} not found`);
      }
    }

    // Enhanced content extraction with better error handling
    const scrapedData = await page.evaluate(async (target, config) => {
      const results = [];
      const maxItems = 20;
      
      try {
        // Extract titles with multiple strategies
        const titleSelectors = Array.isArray(target.titleSelector) ? 
          target.titleSelector : [target.titleSelector];
        
        let allTitleElements = [];
        for (const selector of titleSelectors) {
          try {
            const elements = Array.from(document.querySelectorAll(selector));
            if (elements.length > 0) {
              allTitleElements = elements;
              break; // Use the first selector that works
            }
          } catch (e) {
            continue;
          }
        }

        // Extract dates
        let allDateElements = [];
        if (target.dateSelector) {
          const dateSelectors = Array.isArray(target.dateSelector) ? 
            target.dateSelector : [target.dateSelector];
          
          for (const selector of dateSelectors) {
            try {
              const elements = Array.from(document.querySelectorAll(selector));
              if (elements.length > 0) {
                allDateElements = elements;
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }

        console.log(`Found ${allTitleElements.length} title elements, ${allDateElements.length} date elements`);

        // Process items
        for (let i = 0; i < Math.min(allTitleElements.length, maxItems); i++) {
          try {
            const titleEl = allTitleElements[i];
            if (!titleEl) continue;

            const titleText = titleEl.textContent.trim();
            const url = titleEl.href || window.location.href;

            // Basic filtering
            if (!titleText || titleText.length < config.minTitleLength) continue;

            // Check against excluded patterns
            const isExcluded = config.excludedPatterns.some(pattern => 
              new RegExp(pattern, 'i').test(titleText)
            );
            if (isExcluded) continue;

            // Extract date
            let dateText = '';
            if (allDateElements[i]) {
              dateText = allDateElements[i].getAttribute('datetime') || 
                         allDateElements[i].textContent.trim();
            } else if (allDateElements[0]) {
              dateText = allDateElements[0].getAttribute('datetime') || 
                         allDateElements[0].textContent.trim();
            }

            results.push({
              title: titleText,
              url: url.startsWith('http') ? url : new URL(url, window.location.href).href,
              date: dateText,
              source: target.name,
              type: target.type,
              elementIndex: i
            });

          } catch (itemError) {
            console.warn('Error processing item:', itemError);
            continue;
          }
        }

      } catch (e) {
        console.error('Page evaluation error:', e);
      }
      
      return results;
    }, target, SCRAPER_CONFIG);

    console.log(`📊 ${target.name}: Found ${scrapedData.length} raw items`);

    // Process and enhance data
    const processedData = [];
    
    for (const item of scrapedData) {
      try {
        const normalizedDate = DateUtils.parseDate(item.date, target.timezone);
        
        // Apply verification
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
            scraped_at: new Date().toISOString(),
            // Add content for summarization
            content_snippet: item.title // Will be used for AI summary
          });
        }
      } catch (error) {
        console.warn('Error processing item:', error);
      }
    }

    // Apply deduplication
    const deduplicationConfig = target.deduplication || { strategy: "title", threshold: 0.8 };
    const uniqueItems = DeduplicationUtils.deduplicate(
      processedData, 
      deduplicationConfig.strategy, 
      deduplicationConfig.threshold
    );

    console.log(`✅ ${target.name}: ${uniqueItems.length} unique items after processing`);

    // Save to database
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

      // Send enhanced Telegram alert with AI summary
      await sendEnhancedTelegramAlert(target, uniqueItems);

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

// Enhanced Telegram alert with AI summaries
async function sendEnhancedTelegramAlert(target, items) {
  try {
    const topItems = items.slice(0, 3);
    let message = `✅ ${target.name} Update\n`;
    message += `📋 ${items.length} items collected\n`;
    message += `🕒 ${new Date().toLocaleString()}\n\n`;
    
    for (const [index, item] of topItems.entries()) {
      // Generate AI summary (you'll implement this)
      const summary = await generateAISummary(item.title, item.source);
      
      message += `📰 ${index + 1}. ${item.title}\n`;
      message += `🔗 ${item.url}\n`;
      message += `📅 ${new Date(item.date).toLocaleDateString()}\n`;
      message += `🤖 ${summary}\n\n`;
    }
    
    message += `#${target.name.replace(/\s+/g, '')} #${target.type} #AIUpdate`;
    
    await sendTelegramAlert(message);
  } catch (error) {
    // Fallback to simple alert
    console.warn('Enhanced alert failed, sending simple alert:', error);
    const topTitles = items.slice(0, 3).map(item => 
      `• ${item.title.substring(0, 60)}${item.title.length > 60 ? '...' : ''}`
    ).join('\n');
    
    await sendTelegramAlert(
      `✅ ${target.name} Update\n` +
      `📋 ${items.length} items collected\n` +
      `🕒 ${new Date().toLocaleString()}\n` +
      `📝 Top items:\n${topTitles}\n` +
      `#${target.name.replace(/\s+/g, '')} #${target.type}`
    );
  }
}

// AI Summary generator (to be implemented)
async function generateAISummary(title, source) {
  // This is a placeholder - you'll implement actual AI integration
  // For now, return a simple summary
  return `Summary: ${title} from ${source} requires regulatory attention.`;
}

export function createScraper(targetConfig) {
  return async () => {
    return await runGenericScraper(targetConfig);
  };
}
