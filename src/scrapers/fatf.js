// src/scrapers/fatf.js
import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // FATF High-Risk Countries scraping
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const fatfData = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.high-risk-list li'));
      return items.map(item => ({
        country: item.querySelector('h4')?.textContent?.trim() || 'Unknown',
        reason: item.querySelector('p')?.textContent?.trim() || 'No reason provided',
        updated: document.querySelector('.update-date')?.textContent?.trim() || 'Unknown date'
      }));
    });

    // Save to Supabase
    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: 'FATF High-Risk Jurisdictions',
        data: fatfData,
        scraped_at: new Date().toISOString()
      });

    if (error) {
      await sendTelegramAlert(`⚠️ Supabase Error: ${error.message}`);
    } else {
      await sendTelegramAlert(`✅ FATF data scraped successfully: ${fatfData.length} entries`);
    }

    return fatfData;

  } catch (error) {
    await sendTelegramAlert(`❌ Scraper failed: ${error.message}`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
