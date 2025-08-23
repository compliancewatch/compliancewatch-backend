import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { waitUntil: 'networkidle2' });
    
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.high-risk-list li')).map(el => ({
        country: el.querySelector('h4')?.textContent?.trim() || 'Unknown',
        reason: el.querySelector('p')?.textContent?.trim() || 'No reason provided'
      }));
    });

    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: 'FATF High-Risk Jurisdictions',
        data: data,
        scraped_at: new Date()
      });

    if (error) await sendTelegramAlert(`⚠️ Supabase Error: ${error.message}`);

  } catch (error) {
    await sendTelegramAlert(`❌ Scraper failed: ${error.message}`);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

export default runScraper;
