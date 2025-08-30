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
    
    // Enhanced browser configuration - UPDATED FOR ALPINE LINUX
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
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
        '--window-size=1920,1080',
        '--lang=en-US,en'
      ],
      headless: "new",
      ignoreHTTPSErrors: true,
      timeout: 120000
    });

    page = await browser.newPage();
    
    // ================= ENHANCED ANTI-BOT EVASION =================
    await page.setJavaScriptEnabled(true);
    
    // Set realistic user agent (randomized)
    const userAgent = SCRAPER_CONFIG.userAgents[
      Math.floor(Math.random() * SCRAPER_CONFIG.userAgents.length)
    ];
    await page.setUserAgent(userAgent);
    
    // Set extra headers for realism
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-CH-UA': '"Chromium";v="120", "Not_A Brand";v="24"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"'
    });

    // Enhanced stealth scripts
    await page.evaluateOnNewDocument(() => {
      // Overwrite navigator properties
      Object.defineProperty(navigator, 'webdriver', { 
        get: () => false,
        configurable: true
      });
      Object.defineProperty(navigator, 'languages', { 
        get: () => ['en-US', 'en'],
        configurable: true
      });
      Object.defineProperty(navigator, 'plugins', { 
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ],
        configurable: true
      });
      
      // Mock Chrome runtime more realistically
      window.chrome = {
        runtime: {
          connect: () => ({}),
          sendMessage: () => ({}),
          onConnect: { addListener: () => {} },
          onMessage: { addListener: () => {} },
          getManifest: () => ({})
        },
        loadTimes: () => ({
          firstPaintTime: 0,
          requestTime: Date.now() - Math.random() * 1000,
          commitLoadTime: Date.now() - Math.random() * 500,
          finishDocumentLoadTime: Date.now() - Math.random() * 200
        }),
        csi: () => ({
          onloadT: Date.now() - Math.random() * 1000,
          startE: Date.now() - Math.random() * 1500,
          pageT: Date.now() - Math.random() * 800
        }),
        app: { 
          isInstalled: false,
          getDetails: () => null,
          getIsInstalled: () => false
        }
      };

      // Overwrite permissions
      Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: async () => ({ state: 'granted' })
        }),
        configurable: true
      });

      // Mock hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
        configurable: true
      });
    });

    // Randomize viewport with realistic variations
    await page.setViewport({ 
      width: 1920 + Math.floor(Math.random() * 100) - 50,
      height: 1080 + Math.floor(Math.random() * 100) - 50,
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false
    });

    // Enhanced resource blocking
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();
      
      // Block unnecessary resources but allow essential ones
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType) ||
          url.includes('google-analytics') ||
          url.includes('doubleclick') ||
          url.includes('facebook') ||
          url.includes('twitter') ||
          url.includes('linkedin')) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log(`🌐 Navigating to: ${target.url}`);
    
    // Enhanced navigation with randomized delays
    await page.goto(target.url, { 
      waitUntil: 'domcontentloaded',
      timeout: target.waitTimeout || SCRAPER_CONFIG.navigationTimeout,
      referer: 'https://www.google.com/'
    });

    // Strategic waiting with randomization
    const baseDelay = target.stealth ? 8000 : 5000;
    const randomDelay = baseDelay + Math.random() * 3000;
    await page.waitForTimeout(randomDelay);

    // Wait for network to settle
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 });

    // Handle dynamic content loading
    if (target.dynamicContent || target.scrollConfig?.enabled) {
      console.log(`🔄 Handling dynamic content for ${target.name}`);
      await ScrapingStrategies.executeDynamicScraping(page, target);
    }

    // Wait for specific content if specified
    if (target.waitForSelector) {
      try {
        await page.waitForSelector(target.waitForSelector, { 
          timeout: 20000,
          visible: true 
        });
        console.log(`✅ Found wait selector: ${target.waitForSelector}`);
      } catch (e) {
        console.warn(`⚠️ Wait selector ${target.waitForSelector} not found, continuing anyway`);
      }
    }

    // ================= ENHANCED CONTENT EXTRACTION =================
    console.log(`🔍 Extracting content from ${target.name}`);
    
    const scrapedData = await page.evaluate(async (target, config) => {
      const results = [];
      const maxItems = 20;
      
      try {
        // Extract titles with multiple selector strategies
        let titleElements = [];
        const titleSelectors = Array.isArray(target.titleSelector) ? 
          target.titleSelector : [target.titleSelector];
        
        for (const selector of titleSelectors) {
          try {
            const elements = Array.from(document.querySelectorAll(selector));
            if (elements.length > 0) {
              titleElements = elements;
              break;
            }
          } catch (e) {
            // Continue to next selector if this one fails
            continue;
          }
        }

        // Extract dates with multiple selector strategies
        let dateElements = [];
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

        // Process items with enhanced filtering
        for (let i = 0; i < Math.min(titleElements.length, maxItems); i++) {
          try {
            const titleEl = titleElements[i];
            if (!titleEl) continue;

            const titleText = titleEl.textContent.trim();
            const url = titleEl.href || window.location.href;

            // Skip if no meaningful content
            if (!titleText || titleText.length < config.minTitleLength) continue;

            // Skip navigation and excluded patterns
            const isExcluded = config.excludedPatterns.some(pattern => 
              new RegExp(pattern, 'i').test(titleText)
            );
            if (isExcluded) continue;

            // Extract date with fallbacks
            let dateText = '';
            let dateElement = dateElements[i] || dateElements[0];
            
            if (dateElement) {
              // Prefer datetime attribute for machine-readable dates
              dateText = dateElement.getAttribute('datetime') || 
                         dateElement.textContent.trim();
            }

            // Get full URL if relative
            let fullUrl = url;
            if (url && !url.startsWith('http')) {
              fullUrl = new URL(url, window.location.href).href;
            }

            results.push({
              title: titleText,
              url: fullUrl,
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

    // ================= ENHANCED DATA PROCESSING =================
    const processedData = [];
    
    for (const item of scrapedData) {
      try {
        // Parse and normalize date
        const normalizedDate = DateUtils.parseDate(item.date, target.timezone);
        
        // Apply verification filters
        const shouldInclude = (title) => {
          const { minLength, maxLength } = target.verification || 
            { minLength: SCRAPER_CONFIG.minTitleLength, maxLength: SCRAPER_CONFIG.maxTitleLength };
          
          const length = title.length;
          if (length < minLength || length > maxLength) return false;
          
          // Check against excluded patterns
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

    // Apply deduplication
    const deduplicationConfig = target.deduplication || { strategy: "title", threshold: 0.8 };
    const uniqueItems = DeduplicationUtils.deduplicate(
      processedData, 
      deduplicationConfig.strategy, 
      deduplicationConfig.threshold
    );

    console.log(`✅ ${target.name}: ${uniqueItems.length} unique items after processing`);

    // ================= DATABASE STORAGE =================
    if (uniqueItems.length > 0) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: uniqueItems,
          created_at: new Date().toISOString(),
          item_count: uniqueItems.length,
          status: 'success',
          type: target.type,
          metadata: {
            url: target.url,
            selectors: {
              title: target.titleSelector,
              date: target.dateSelector
            },
            processing: {
              deduplication_strategy: deduplicationConfig.strategy,
              deduplication_threshold: deduplicationConfig.threshold,
              date_timezone: target.timezone
            }
          }
        });

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Send success alert
      const topItems = uniqueItems.slice(0, 3).map(item => 
        `• ${item.title.substring(0, 60)}${item.title.length > 60 ? '...' : ''}`
      ).join('\n');

      await sendTelegramAlert(
        `✅ ${target.name} Update\n` +
        `📋 ${uniqueItems.length} items collected\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `📝 Top items:\n${topItems}\n` +
        `#${target.name.replace(/\s+/g, '')} #${target.type} #Update`
      );

    } else {
      console.log(`⚠️ ${target.name}: No valid data found after processing`);
      
      await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: [],
          created_at: new Date().toISOString(),
          item_count: 0,
          status: 'no_data',
          type: target.type,
          notes: 'Scraper ran but found no valid content after filtering',
          metadata: {
            url: target.url,
            raw_count: scrapedData.length,
            processed_count: processedData.length
          }
        });
    }

    console.log(`🎯 ${target.name} completed successfully`);
    return uniqueItems;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    
    // Enhanced error logging
    await supabase
      .from('scraped_data')
      .insert({
        source: target.name,
        data: [],
        created_at: new Date().toISOString(),
        status: 'error',
        type: target.type,
        error_message: error.message,
        error_stack: error.stack,
        metadata: {
          url: target.url,
          timestamp: new Date().toISOString()
        }
      });

    // Enhanced error alert
    await sendTelegramAlert(
      `❌ ${target.name} Failed\n` +
      `🔗 ${target.url}\n` +
      `📛 Error: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}\n` +
      `🕒 Time: ${new Date().toLocaleString()}\n` +
      `#${target.name.replace(/\s+/g, '')} #Error #${target.type}`
    );
    
    throw error;
    
  } finally {
    // Enhanced cleanup with better error handling
    try {
      if (page) {
        await page.close().catch(e => console.warn('Page close warning:', e.message));
      }
    } catch (e) {
      console.warn('Page cleanup warning:', e.message);
    }
    
    try {
      if (browser) {
        await browser.close().catch(e => console.warn('Browser close warning:', e.message));
      }
    } catch (e) {
      console.warn('Browser cleanup warning:', e.message);
    }
    
    console.log(`🧹 Cleanup completed for ${target.name}`);
  }
}

// Utility function for individual scraper files
export function createScraper(targetConfig) {
  return async () => {
    return await runGenericScraper(targetConfig);
  };
}
