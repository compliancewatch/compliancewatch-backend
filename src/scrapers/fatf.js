// src/scrapers/fatf.js
import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';
import { runAISummarizer } from '../services/ai-service.js';

export async function runScraper() {
  let browser;
  try {
    console.log('🔄 Starting FATF scraper...');
    
    browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: "new", // Fix deprecation warning
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    const fatfData = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.high-risk-list li'));
      return items.map(item => ({
        country: item.querySelector('h4')?.textContent?.trim() || 'Unknown',
        reason: item.querySelector('p')?.textContent?.trim() || 'No reason provided',
        updated: new Date().toLocaleDateString()
      }));
    });

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    // Save to Supabase - USE CORRECT COLUMN NAMES
    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: 'FATF High-Risk Jurisdictions',
        data: fatfData,
        created_at: new Date().toISOString(), // Use created_at instead of scraped_at
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Database error details:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Generate AI summary and send to Telegram
    if (fatfData.length > 0) {
      await runAISummarizer('FATF High-Risk Jurisdictions');
    } else {
      await sendTelegramAlert('⚠️ FATF Update: No new high-risk jurisdictions found in latest scan.');
    }
    
    console.log('✅ FATF scraping completed');
    return fatfData;

  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    
    await sendTelegramAlert(
      `❌ FATF Scraping Failed\nError: ${error.message}\nTime: ${new Date().toLocaleString()}`
    );
    
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

export default runScraper;
