// src/scrapers/fatf.js - UPDATED WITH BETTER SELECTORS
import puppeteer from 'puppeteer';
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export const FATF_CONFIG = {
  name: "FATF High-Risk Jurisdictions",
  url: "https://www.fatf-gafi.org/en/high-risk/",
  titleSelector: ".high-risk-list li, .list-item, li, .country-item, .jurisdiction",
  dateSelector: ".date, time, [datetime], .published-date",
  type: "regulatory",
  scraper: "fatf",
  waitForSelector: "body"
};

export async function runScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting FATF-specific scraper...');
    
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

    // DEBUG: Check what's on the page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent,
        h2: document.querySelector('h2')?.textContent,
        bodyText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log('🔍 Page analysis:', JSON.stringify(pageContent, null, 2));

    // FATF-specific extraction with better error handling
    const fatfData = await page.evaluate((config) => {
      const results = [];
      const selectors = Array.isArray(config.titleSelector) ? 
        config.titleSelector : [config.titleSelector];
      
      // Try all selectors until we find one that works
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          console.log(`Trying selector "${selector}": found ${elements.length} elements`);
          
          for (const element of elements) {
            const text = element.textContent.trim();
            
            if (text && text.length > 3) {
              // Basic filtering for country names
              if (text.match(/[A-Z][a-z]+/) && !text.match(/menu|navigation|search|login/i)) {
                results.push({
                  country: text,
                  source_url: window.location.href,
                  scraped_at: new Date().toISOString()
                });
              }
            }
          }
          
          // If we found results with this selector, break early
          if (results.length > 0) break;
          
        } catch (e) {
          console.warn(`Selector "${selector}" failed:`, e.message);
          continue;
        }
      }
      
      return results;
    }, FATF_CONFIG);

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    // Process and validate results
    const processedData = fatfData
      .map(item => ({
        country: extractCountryName(item.country),
        status: extractJurisdictionStatus(item.country),
        source_url: item.source_url,
        scraped_at: item.scraped_at,
        metadata: {
          original_text: item.country
        }
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
function extractCountryName(text) {
  if (!text) return 'Unknown';
  
  // Clean up the text - remove numbers, punctuation, etc.
  let cleaned = text
    .replace(/^(\d+[\.\)]\s*)/, '') // Remove numbering like "1. " or "1) "
    .replace(/[\(\)\[\]\-\–\:]/g, '') // Remove various punctuation
    .replace(/^[\s\W]+/, '') // Remove leading non-word characters
    .replace(/[\s\W]+$/, '') // Remove trailing non-word characters
    .trim();
  
  // Take only the first few words (country names are usually 1-3 words)
  const words = cleaned.split(/\s+/);
  if (words.length <= 3) {
    return cleaned;
  }
  
  // For longer text, take the most relevant part (usually the beginning)
  return words.slice(0, 3).join(' ');
}

function extractJurisdictionStatus(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('high risk') || lowerText.includes('blacklist')) {
    return 'High Risk';
  }
  if (lowerText.includes('grey list') || lowerText.includes('increased monitoring')) {
    return 'Increased Monitoring';
  }
  if (lowerText.includes('removed') || lowerText.includes('delisted')) {
    return 'Removed';
  }
  
  return 'Listed';
}

function isValidJurisdiction(name) {
  if (!name || name.length < 2 || name.length > 50) return false;
  
  const lowerName = name.toLowerCase();
  const excludedTerms = [
    'country', 'jurisdiction', 'list', 'table', 'content', 
    'menu', 'navigation', 'footer', 'header', 'click', 'read more',
    'high-risk', 'monitoring', 'fatf', 'gafi', 'www', 'http',
    'home', 'about', 'contact', 'search', 'login', 'sign'
  ];
  
  if (excludedTerms.some(term => lowerName.includes(term))) {
    return false;
  }
  
  // Should contain at least one capital letter (for country names)
  if (!/[A-Z]/.test(name)) {
    return false;
  }
  
  // Should not be all uppercase (probably not a country name)
  if (name === name.toUpperCase()) {
    return false;
  }
  
  return true;
}

export default runScraper;
