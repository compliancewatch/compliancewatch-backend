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
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 Navigating to FATF website...');
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait longer and try multiple selectors
    await page.waitForTimeout(8000);
    
    // Try multiple selector strategies
    const fatfData = await page.evaluate(() => {
      console.log('🔍 Scanning FATF page for data...');
      
      // Try multiple selector patterns
      const selectors = [
        '.high-risk-list li',
        '.list-item',
        'li',
        '[class*="country"]',
        '[class*="jurisdiction"]',
        'table tr',
        '.content li',
        'div > ul > li'
      ];
      
      const results = [];
      
      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        for (const element of elements) {
          const text = element.textContent.trim();
          
          // Look for country/jurisdiction patterns
          if (text.length > 10 && (text.match(/[A-Z][a-z]+/) || text.includes('country') || text.includes('jurisdiction'))) {
            results.push({
              country: text,
              source_url: window.location.href,
              scraped_at: new Date().toISOString()
            });
          }
        }
      }
      
      return results;
    });

    console.log(`📊 Found ${fatfData.length} potential FATF entries`);

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
      console.log('⚠️ No FATF entries found - may need selector adjustment');
      
      // Log that we tried but found nothing
      await supabase
        .from('scraped_data')
        .insert({
          source: 'FATF High-Risk Jurisdictions',
          data: [],
          created_at: new Date().toISOString(),
          item_count: 0,
          status: 'no_data',
          notes: 'Scraper ran but found no data with current selectors'
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
