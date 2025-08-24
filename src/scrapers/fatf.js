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
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      timeout: 60000
    });

    const page = await browser.newPage();
    
    // Set realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('🌐 Navigating to FATF website...');
    await page.goto('https://www.fatf-gafi.org/en/high-risk/', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for content to load with better selectors
    await page.waitForSelector('.high-risk-list', { timeout: 15000 });
    await page.waitForTimeout(3000); // Additional wait for stability

    const fatfData = await page.evaluate(() => {
      try {
        const items = Array.from(document.querySelectorAll('.high-risk-list li'));
        const results = [];
        
        for (const item of items) {
          const countryElement = item.querySelector('h4');
          const reasonElement = item.querySelector('p');
          
          if (countryElement) {
            results.push({
              country: countryElement.textContent.trim(),
              reason: reasonElement ? reasonElement.textContent.trim() : 'No details provided',
              updated: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
              source_url: window.location.href,
              type: 'high-risk-jurisdiction'
            });
          }
        }
        
        return results;
      } catch (e) {
        console.error('Page evaluation error:', e);
        return [];
      }
    });

    console.log(`📊 Found ${fatfData.length} FATF entries`);

    if (fatfData.length === 0) {
      // Still save to database to track scraping attempts
      const { error } = await supabase
        .from('scraped_data')
        .insert({
          source: 'FATF High-Risk Jurisdictions',
          data: [],
          created_at: new Date().toISOString(),
          status: 'no_data'
        });

      if (error) {
        console.error('Database insert error:', error);
      }
      
      console.log('⚠️ No FATF entries found, but scrape completed');
      return [];
    }

    // Save to database
    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: 'FATF High-Risk Jurisdictions',
        data: fatfData,
        created_at: new Date().toISOString(),
        item_count: fatfData.length,
        status: 'success'
      });

    if (error) {
      console.error('Database error details:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Generate AI summary - enhanced with better error handling
    if (fatfData.length > 0) {
      try {
        console.log('🤖 Generating AI summary for FATF...');
        const summarySuccess = await runAISummarizer('FATF High-Risk Jurisdictions');
        
        if (summarySuccess) {
          console.log('✅ AI summary generated successfully');
        } else {
          console.log('⚠️ AI summary generation skipped or failed');
          // Fallback to basic notification
          await sendTelegramAlert(
            `🌍 FATF High-Risk Jurisdictions Update\n` +
            `📅 ${new Date().toLocaleDateString()}\n` +
            `📋 ${fatfData.length} jurisdictions listed\n` +
            `🔗 https://www.fatf-gafi.org/en/high-risk/\n` +
            `#FATF #Compliance #HighRisk`
          );
        }
      } catch (aiError) {
        console.error('AI summarization error:', aiError);
        // Fallback notification
        await sendTelegramAlert(
          `🌍 FATF Update Completed\n` +
          `✅ ${fatfData.length} jurisdictions processed\n` +
          `🕒 ${new Date().toLocaleString()}\n` +
          `#FATF #Compliance`
        );
      }
    } else {
      console.log('ℹ️ No data to summarize');
      await sendTelegramAlert(
        `ℹ️ FATF Monitoring Complete\n` +
        `No new high-risk jurisdictions identified\n` +
        `🕒 ${new Date().toLocaleString()}\n` +
        `#FATF #Monitoring`
      );
    }
    
    console.log('✅ FATF scraping completed successfully');
    return fatfData;

  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    
    // Save error to database for tracking
    try {
      await supabase
        .from('scraped_data')
        .insert({
          source: 'FATF High-Risk Jurisdictions',
          data: [],
          created_at: new Date().toISOString(),
          status: 'error',
          error_message: error.message
        });
    } catch (dbError) {
      console.error('Failed to save error to database:', dbError);
    }
    
    // Send error notification
    await sendTelegramAlert(
      `❌ FATF Scraping Failed\n` +
      `Error: ${error.message}\n` +
      `Time: ${new Date().toLocaleString()}\n` +
      `#FATF #Error`
    );
    
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('🌐 Browser closed successfully');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}

// Additional function for quick testing
export async function testFATFScraper() {
  try {
    console.log('🧪 Testing FATF scraper...');
    const result = await runScraper();
    console.log('✅ Test completed:', result.length, 'entries found');
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

export default runScraper;
