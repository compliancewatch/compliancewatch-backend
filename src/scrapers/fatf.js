import { runGenericScraper } from './generic-scraper.js';

// FATF-specific configuration
const FATF_CONFIG = {
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
  },
  notes: "Lists country names, shorter titles expected",
  specialProcessing: true
};

export async function runScraper() {
  try {
    console.log('🔄 Starting FATF-specific scraper...');
    
    // Use the enhanced generic scraper with FATF-specific config
    const results = await runGenericScraper(FATF_CONFIG);
    
    // FATF-specific post-processing
    const processedResults = await processFATFResults(results);
    
    console.log(`✅ FATF scraping completed: ${processedResults.length} jurisdictions`);
    return processedResults;

  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    throw error;
  }
}

// FATF-specific result processing
async function processFATFResults(results) {
  const fatfData = [];
  
  for (const item of results) {
    try {
      // FATF-specific processing logic
      const processedItem = {
        country: extractCountryName(item.title),
        status: extractJurisdictionStatus(item.title),
        source_url: item.url || FATF_CONFIG.url,
        scraped_at: new Date().toISOString(),
        listed_date: item.date,
        metadata: {
          original_title: item.title,
          processing_notes: 'FATF-specific extraction'
        }
      };
      
      // Validate it's actually a country/jurisdiction
      if (isValidJurisdiction(processedItem.country)) {
        fatfData.push(processedItem);
      }
    } catch (error) {
      console.warn('Error processing FATF item:', error);
    }
  }
  
  return fatfData;
}

// Helper function to extract country name from title
function extractCountryName(title) {
  if (!title) return 'Unknown';
  
  // Remove common prefixes and suffixes
  let cleaned = title
    .replace(/^(\d+\.\s*)/, '') // Remove numbering like "1. "
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parentheses content
    .replace(/\s*\-.*?$/, '') // Remove text after dash
    .replace(/^[^a-zA-Z]*/, '') // Remove leading non-letters
    .trim();
  
  // Extract likely country name (first 2-5 words)
  const words = cleaned.split(/\s+/);
  if (words.length <= 5) {
    return cleaned;
  }
  
  // For longer text, take the most relevant part
  return words.slice(0, 3).join(' ');
}

// Helper function to extract jurisdiction status
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

// Validate if this looks like a real jurisdiction
function isValidJurisdiction(name) {
  if (!name || name.length < 3) return false;
  
  const lowerName = name.toLowerCase();
  
  // Common false positives to exclude
  const excludedTerms = [
    'country', 'jurisdiction', 'list', 'table', 'content', 
    'menu', 'navigation', 'footer', 'header', 'click', 'read more',
    'high-risk', 'monitoring', 'fatf', 'gafi', 'www', 'http'
  ];
  
  if (excludedTerms.some(term => lowerName.includes(term))) {
    return false;
  }
  
  // Should contain at least one capital letter (for country names)
  if (!/[A-Z]/.test(name)) {
    return false;
  }
  
  // Should not be too short or too long for a country name
  if (name.length < 3 || name.length > 50) {
    return false;
  }
  
  return true;
}

// Alternative: Direct scraping for FATF if generic approach fails
export async function runDirectFATFScraper() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔄 Starting direct FATF scraper (fallback)...');
    
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      headless: "new",
      timeout: 60000
    });

    page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🌐 Navigating to FATF website...');
    await page.goto(FATF_CONFIG.url, { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForTimeout(5000);
    
    // FATF-specific extraction logic
    const fatfData = await page.evaluate(() => {
      const results = [];
      const selectors = [
        '.high-risk-list li',
        '.list-item',
        'li',
        '[class*="country"]',
        '[class*="jurisdiction"]',
        'table tr',
        '.content li'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          
          // More specific FATF pattern matching
          if (text && text.length > 5 && 
              (text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/) || 
               text.includes('Democratic') || 
               text.includes('Republic') ||
               text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/))) {
            
            results.push({
              country: text.replace(/^(\d+\.\s*)/, '').trim(),
              source_url: window.location.href,
              scraped_at: new Date().toISOString()
            });
          }
        }
      }
      
      return results;
    });

    // Process and validate results
    const processedData = fatfData
      .map(item => ({
        ...item,
        country: extractCountryName(item.country),
        status: extractJurisdictionStatus(item.country)
      }))
      .filter(item => isValidJurisdiction(item.country))
      .filter((item, index, array) => 
        array.findIndex(i => i.country === item.country) === index
      );

    console.log(`📊 Found ${processedData.length} FATF jurisdictions`);

    if (processedData.length > 0) {
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: FATF_CONFIG.name,
          data: processedData,
          created_at: new Date().toISOString(),
          item_count: processedData.length,
          status: 'success',
          type: 'regulatory',
          metadata: {
            method: 'direct-scraping',
            url: FATF_CONFIG.url
          }
        });

      if (error) throw error;

      await sendTelegramAlert(
        `🌍 FATF Update\n` +
        `📋 ${processedData.length} jurisdictions listed\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#FATF #Compliance #HighRisk`
      );
    }

    return processedData;

  } catch (error) {
    console.error('❌ Direct FATF scraper error:', error.message);
    throw error;
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// Export both methods for flexibility
export default {
  runScraper,
  runDirectFATFScraper,
  FATF_CONFIG
};
