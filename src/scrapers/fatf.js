// src/scrapers/fatf.js - UPDATED BROWSER LAUNCH FOR ALPINE
import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

// FATF-specific configuration matching your target structure
export const FATF_CONFIG = {
  name: "FATF High-Risk Jurisdictions",
  url: "https://www.fatf-gafi.org/en/high-risk/",
  titleSelector: ".high-risk-list li, .list-item, li, [class*='country'], [class*='jurisdiction']",
  dateSelector: ".content .date, time[datetime], .publication-date",
  type: "regulatory",
  scraper: "fatf",
  waitForSelector: ".high-risk-list, .content, main",
  timezone: "UTC",
  verification: { 
    minLength: 5, 
    maxLength: 50, 
    exclude: [] 
  }
};

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF-specific scraper...');
    
    // UPDATED BROWSER LAUNCH FOR ALPINE LINUX
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      headless: "new",
      ignoreHTTPSErrors: true,
      timeout: 60000
    });

    page = await browser.newPage();
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 Navigating to FATF website...');
    await page.goto(FATF_CONFIG.url, { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for content to load
    await page.waitForTimeout(5000);
    
    // Wait for specific content if specified
    if (FATF_CONFIG.waitForSelector) {
      try {
        await page.waitForSelector(FATF_CONFIG.waitForSelector, { 
          timeout: 15000,
          visible: true 
        });
      } catch (e) {
        console.warn(`Wait selector ${FATF_CONFIG.waitForSelector} not found`);
      }
    }

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
            
            // FATF-specific filtering
            if (text && text.length >= config.verification.minLength && 
                text.length <= config.verification.maxLength) {
              
              // Extract date if available
              let dateText = '';
              if (config.dateSelector) {
                const dateSelectors = Array.isArray(config.dateSelector) ? 
                  config.dateSelector : [config.dateSelector];
                
                for (const dateSelector of dateSelectors) {
                  const dateElement = document.querySelector(dateSelector);
                  if (dateElement) {
                    dateText = dateElement.getAttribute('datetime') || 
                              dateElement.textContent.trim();
                    break;
                  }
                }
              }
              
              results.push({
                title: text,
                url: element.href || window.location.href,
                date: dateText || new Date().toISOString(),
                source: config.name,
                type: config.type
              });
            }
          }
        } catch (e) {
          console.warn(`Selector ${selector} failed:`, e);
        }
      }
      
      return results;
    }, FATF_CONFIG);

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    // FATF-specific post-processing
    const processedData = fatfData
      .map(item => ({
        country: extractCountryName(item.title),
        status: extractJurisdictionStatus(item.title),
        source_url: item.url,
        listed_date: item.date,
        scraped_at: new Date().toISOString(),
        metadata: {
          original_title: item.title,
          source: item.source
        }
      }))
      .filter(item => isValidJurisdiction(item.country))
      .filter((item, index, array) => 
        array.findIndex(i => i.country === item.country) === index
      );

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
        `#FATF #Compliance #HighRisk`
      );
    } else {
      console.log('⚠️ No valid FATF jurisdictions found');
      
      await supabase
        .from('scraped_data')
        .insert({
          source: FATF_CONFIG.name,
          data: [],
          created_at: new Date().toISOString(),
          item_count: 0,
          status: 'no_data',
          type: FATF_CONFIG.type,
          notes: 'Scraper ran but found no valid jurisdictions'
        });
    }

    console.log('✅ FATF scraping completed');
    return processedData;

  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    
    await supabase
      .from('scraped_data')
      .insert({
        source: FATF_CONFIG.name,
        data: [],
        created_at: new Date().toISOString(),
        status: 'error',
        type: FATF_CONFIG.type,
        error_message: error.message
      });

    await sendTelegramAlert(`❌ FATF Failed: ${error.message}`);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// Helper functions for FATF-specific processing
function extractCountryName(title) {
  if (!title) return 'Unknown';
  
  let cleaned = title
    .replace(/^(\d+\.\s*)/, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*\-.*?$/, '')
    .replace(/^[^a-zA-Z]*/, '')
    .trim();
  
  const words = cleaned.split(/\s+/);
  return words.length <= 5 ? cleaned : words.slice(0, 3).join(' ');
}

function extractJurisdictionStatus(title) {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('high risk') || lowerTitle.includes('blacklist')) {
    return 'High Risk';
  }
  if (lowerTitle.includes('grey list') || lowerTitle.includes('increased monitoring')) {
    return 'Increased Monitoring';
  }
  if (lowerTitle.includes('removed') || lowerTitle.includes('delisted')) {
    return 'Removed';
  }
  
  return 'Listed';
}

function isValidJurisdiction(name) {
  if (!name || name.length < 3 || name.length > 50) return false;
  
  const lowerName = name.toLowerCase();
  const excludedTerms = [
    'country', 'jurisdiction', 'list', 'table', 'content', 
    'menu', 'navigation', 'footer', 'header', 'click', 'read more',
    'high-risk', 'monitoring', 'fatf', 'gafi'
  ];
  
  if (excludedTerms.some(term => lowerName.includes(term))) {
    return false;
  }
  
  return /[A-Z]/.test(name);
}

export default runScraper;
