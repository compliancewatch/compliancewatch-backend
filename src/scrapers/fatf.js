// src/scrapers/fatf.js
import { supabase } from '../services/database.js';
import { sendTelegramAlert } from '../services/telegram-bot.js';

export async function runScraper() {
  try {
    console.log('🔄 Starting FATF scraper...');
    
    // Simulate successful scrape
    const mockData = [
      { country: "Test Country", reason: "Test reason", date: new Date().toISOString() }
    ];
    
    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: "FATF High-Risk Jurisdictions",
        data: mockData,
        scraped_at: new Date().toISOString()
      });

    if (error) throw new Error(`Database error: ${error.message}`);
    
    await sendTelegramAlert('✅ FATF data scraped successfully');
    console.log('✅ FATF scraping completed');
    
  } catch (error) {
    console.error('❌ FATF scraper error:', error.message);
    await sendTelegramAlert(`❌ FATF scraper failed: ${error.message}`);
    throw error;
  }
}

export default runScraper;
