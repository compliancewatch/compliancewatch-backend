import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH,
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browserInstance;
}

export async function runGenericScraper(target) {
  let page = null;
  try {
    console.log(`🔄 Starting: ${target.name}`);
    
    const browser = await getBrowser();
    page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log(`🌐 Navigating to: ${target.url}`);
    await page.goto(target.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    const scrapedData = await page.evaluate((target) => {
      try {
        const titles = Array.from(document.querySelectorAll(target.titleSelector || 'h1, h2, h3, a'));
        const dates = Array.from(document.querySelectorAll(target.dateSelector || 'time, .date'));
        
        return titles.slice(0, 10).map((titleEl, index) => ({
          title: titleEl.textContent.trim(),
          url: titleEl.href || window.location.href,
          date: dates[index] ? dates[index].textContent.trim() : new Date().toLocaleDateString(),
          source: target.name
        }));
      } catch (e) {
        console.error('Page evaluation error:', e);
        return [];
      }
    }, target);

    console.log(`📊 ${target.name}: Found ${scrapedData.length} items`);

    if (scrapedData.length > 0) {
      // ✅ USE created_at COLUMN
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: scrapedData,
          created_at: new Date().toISOString()  // ← CORRECT COLUMN NAME
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      // Send success notification
      await sendTelegramAlert(
        `✅ ${target.name} Update\n` +
        `📋 ${scrapedData.length} new items\n` +
        `🕒 ${new Date().toLocaleString()}`
      );
    }

    console.log(`✅ ${target.name} completed`);
    return scrapedData;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    await sendTelegramAlert(`❌ ${target.name} failed: ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close();
  }
}
