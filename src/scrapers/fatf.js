// src/scrapers/fatf.js - SIMPLIFIED VERSION
import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export const FATF_CONFIG = {
  name: "FATF High-Risk Jurisdictions",
  url: "https://www.fatf-gafi.org/en/high-risk/",
  titleSelector: ".high-risk-list li, .list-item, li",
  type: "regulatory",
  scraper: "fatf"
};

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF-specific scraper...');
    
    // SIMPLIFIED browser launch
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      headless: "new",
      timeout: 30000
    });

    page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 Navigating to FATF website...');
    await page.goto(FATF_CONFIG.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // FATF-specific extraction
    const fatfData = await page.evaluate((config) => {
      const results = [];
      const selectors = Array.isArray(config.titleSelector) ? 
        config.titleSelector : [config.titleSelector];
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent.trim();
            
            if (text && text.length > 5) {
              results.push({
                title: text,
                url: element.href || window.location.href,
                source: config.name,
                type: config.type
              });
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return results;
    }, FATF_CONFIG);

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    // Process results
    const processedData = fatfData
      .map(item => ({
        country: extractCountryName(item.title),
        status: extractJurisdictionStatus(item.title),
        source_url: item.url,
        scraped_at: new Date().toISOString()
      }))
      .filter(item => isValidJurisdiction(item.country));

    console.log(`✅ Processed ${processedData.length} unique jurisdictions`);

    if (processedData.length > 0) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: FATF_CONFIG.name,
          data: processedData,
          created_at: new Date().toISOString(),
          item_count: processedData.length,
          status: 'success',
          type: FATF_CONFIG.type
        });

      if (error) throw new Error(`Database error: ${error.message}`);

      await sendTelegramAlert(
        `🌍 FATF Update\n` +
        `📋 ${processedData.length} jurisdictions listed\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#FATF #Compliance`
      );
    } else {
      console.log('⚠️ No valid FATF jurisdictions found');
    }

    console.log('✅ FATF scraping completed');
    return processedData;

  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    
    await sendTelegramAlert(`❌ FATF Failed: ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// Helper functions (keep these the same)
function extractCountryName(title) {
  if (!title) return 'Unknown';
  let cleaned = title.replace(/^(\d+\.\s*)/, '').trim();
  const words = cleaned.split(/\s+/);
  return words.length <= 5 ? cleaned : words.slice(0, 3).join(' ');
}

function extractJurisdictionStatus(title) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('high risk') || lowerTitle.includes('blacklist')) return 'High Risk';
  if (lowerTitle.includes('grey list') || lowerTitle.includes('increased monitoring')) return 'Increased Monitoring';
  if (lowerTitle.includes('removed') || lowerTitle.includes('delisted')) return 'Removed';
  return 'Listed';
}

function isValidJurisdiction(name) {
  if (!name || name.length < 3 || name.length > 50) return false;
  const lowerName = name.toLowerCase();
  const excludedTerms = ['country', 'jurisdiction', 'list', 'table', 'menu', 'navigation'];
  return !excludedTerms.some(term => lowerName.includes(term)) && /[A-Z]/.test(name);
}

export default runScraper;
