import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF scraper...');
    
    // Railway-optimized browser
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    page = await browser.newPage();
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    const fatfData = await page.evaluate(() => {
      try {
        const items = Array.from(document.querySelectorAll('.high-risk-list li'));
        return items.map(item => ({
          country: item.querySelector('h4')?.textContent?.trim() || 'Unknown',
          reason: item.querySelector('p')?.textContent?.trim() || 'No reason provided',
          updated: new Date().toLocaleDateString()
        }));
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
