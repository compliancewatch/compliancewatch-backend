import puppeteer from 'puppeteer-core';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF scraper...');
    
    // Enhanced browser configuration
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
      headless: "new",
      ignoreHTTPSErrors: true,
      timeout: 60000
    });

    page = await browser.newPage();
    
    // Enhanced configuration
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log('🌐 Navigating to FATF website...');
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForTimeout(5000);
    
    // Wait for specific content
    try {
      await page.waitForSelector('.high-risk-list', { timeout: 10000 });
    } catch (error) {
      console.warn('FATF specific selector not found, continuing...');
    }

    const fatfData = await page.evaluate(() => {
      try {
        const items = Array.from(document.querySelectorAll('.high-risk-list li, .list-item, li'));
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
      console.log('⚠️ No FATF entries found');
      
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
    
    await supabase
      .from('scraped_data')
      .insert({
        source: 'FATF High-Risk Jurisdictions',
        data: [],
        created_at: new Date().toISOString(),
        status: 'error',
        error_message: error.message
      });

    await sendTelegramAlert(`❌ FATF Failed: ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

export default runScraper;
