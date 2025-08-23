import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  let browser;
  try {
    console.log('🔄 Starting FATF scraper...');
    
    browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('🌐 Navigating to FATF website...');
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('🔍 Extracting data...');
    const fatfData = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.high-risk-list li'));
      return items.map(item => ({
        country: item.querySelector('h4')?.textContent?.trim() || 'Unknown',
        reason: item.querySelector('p')?.textContent?.trim() || 'No reason provided',
        updated: document.querySelector('.update-date')?.textContent?.trim() || new Date().toLocaleDateString()
      }));
    });

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    // Save to Supabase
    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: 'FATF High-Risk Jurisdictions',
        data: fatfData,
        scraped_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Send success notification
    await sendTelegramAlert(
      `FATF Update Complete ✅\n` +
      `📋 ${fatfData.length} jurisdictions\n` +
      `🕒 ${new Date().toLocaleString()}`
    );

    console.log('✅ FATF scraping completed successfully');
    return fatfData;

  } catch (error) {
    console.error('❌ Scraper error:', error.message);
    
    // Send error notification
    await sendTelegramAlert(
      `FATF Scraping Failed ❌\n` +
      `Error: ${error.message}\n` +
      `Time: ${new Date().toLocaleString()}`
    );
    
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔄 Browser closed');
    }
  }
}

// Export the function
export default runScraper;
