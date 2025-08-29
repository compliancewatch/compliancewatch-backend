import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF scraper...');
    
    // Railway-optimized browser with Cloudflare Chromium
    browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    page = await browser.newPage();
    
    // Enhanced configuration
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('🌐 Navigating to FATF website...');
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Multiple wait strategies
    await page.waitForTimeout(5000);
    
    // Wait for content specifically
    try {
      await page.waitForSelector('.high-risk-list', { timeout: 15000 });
    } catch (error) {
      console.warn('FATF specific selector not found, continuing...');
    }

    const fatfData = await page.evaluate(() => {
      try {
        // More robust selectors for FATF
        const items = Array.from(document.querySelectorAll('.high-risk-list li, .list-item, li, [class*="risk"], [class*="jurisdiction"]'));
        const results = [];
        
        for (const item of items) {
          const countryElement = item.querySelector('h4, h3, h2, .country, [class*="country"]');
          const reasonElement = item.querySelector('p, .reason, .description, [class*="reason"], [class*="description"]');
          
          if (countryElement && countryElement.textContent.trim()) {
            results.push({
              country: countryElement.textContent.trim(),
              reason: reasonElement ? reasonElement.textContent.trim() : 'No details provided',
              updated: new Date().toLocaleDateString(),
              source_url: window.location.href
            });
          }
        }
        
        return results;
      } catch (e) {
        console.error('FATF evaluation error:', e);
        return [];
      }
    });

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    if (fatfData.length > 0) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: 'FATF High-Risk Jurisdictions',
          data: fatfData,
          created_at: new Date().toISOString(),
          item_count: fatfData.length,
          status: 'success'
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      await sendTelegramAlert(
        `🌍 FATF Update\n` +
        `📋 ${fatfData.length} jurisdictions listed\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#FATF #Compliance #HighRisk`
      );
    } else {
      console.log('⚠️ No FATF entries found, but scrape completed');
      
      // Log empty result
      await supabase
        .from('scraped_data')
        .insert({
          source: 'FATF High-Risk Jurisdictions',
          data: [],
          created_at: new Date().toISOString(),
          item_count: 0,
          status: 'no_data'
        });
    }

    console.log('✅ FATF scraping completed');
    return fatfData;

  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    
    // Log error to database
    try {
      await supabase
        .from('scraped_data')
        .insert({
          source: 'FATF High-Risk Jurisdictions',
          data: [],
          created_at: new Date().toISOString(),
          status: 'error',
          error_message: error.message
        });
    } catch (dbError) {
      console.error('Failed to save error to database:', dbError);
    }
    
    await sendTelegramAlert(`❌ FATF Failed: ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

export default runScraper;
