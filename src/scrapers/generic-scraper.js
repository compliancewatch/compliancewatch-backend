import puppeteer from 'puppeteer-core';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runGenericScraper(target) {
  let browser = null;
  let page = null;
  
  try {
    console.log(`🔄 Starting: ${target.name}`);
    
    // Enhanced browser configuration for Docker
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-features=VizDisplayCompositor',
        '--disable-software-rasterizer'
      ],
      headless: "new",
      ignoreHTTPSErrors: true,
      timeout: 60000
    });

    page = await browser.newPage();
    
    // Enhanced page configuration
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

    console.log(`🌐 Navigating to: ${target.url}`);
    await page.goto(target.url, { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

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
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: target.name,
          data: scrapedData,
          created_at: new Date().toISOString()
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      await sendTelegramAlert(
        `✅ ${target.name} Update\n` +
        `📋 ${scrapedData.length} items collected\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#${target.name.replace(/\s+/g, '')} #Update`
      );
    }

    console.log(`✅ ${target.name} completed`);
    return scrapedData;

  } catch (error) {
    console.error(`❌ ${target.name} error:`, error.message);
    
    await sendTelegramAlert(
      `❌ ${target.name} Failed\nError: ${error.message}\nTime: ${new Date().toLocaleString()}`
    );
    
    throw error;
    
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}
