import puppeteer from 'puppeteer-core';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF scraper...');
    
    // Use Alpine's built-in Chromium
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: "new",
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

    if (fatfData.length > 0) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: 'FATF High-Risk Jurisdictions',
          data: fatfData,
          created_at: new Date().toISOString()
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      await sendTelegramAlert(
        `🌍 FATF Update\n` +
        `📋 ${fatfData.length} jurisdictions listed\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#FATF #Compliance #HighRisk`
      );
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
