import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';
import { runAISummarizer } from '../services/ai-service.js';

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF scraper...');
    
    // New browser instance for each run
    browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000
    });

    page = await browser.newPage();
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const fatfData = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.high-risk-list li'));
      return items.map(item => ({
        country: item.querySelector('h4')?.textContent?.trim() || 'Unknown',
        reason: item.querySelector('p')?.textContent?.trim() || 'No reason provided',
        updated: new Date().toLocaleDateString()
      }));
    });

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: 'FATF High-Risk Jurisdictions',
        data: fatfData,
        created_at: new Date().toISOString()
      });

    if (error) throw new Error(`Database error: ${error.message}`);

    // AI summary
    if (fatfData.length > 0) {
      await runAISummarizer('FATF High-Risk Jurisdictions');
    }
    
    console.log('✅ FATF scraping completed');
    return fatfData;

  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    await sendTelegramAlert(`❌ FATF Failed: ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

export default runScraper;
