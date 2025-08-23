import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with error handling
let supabase;
try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
  console.log('✅ Supabase client initialized');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  throw error;
}

// Test database connection with retry logic
export async function testConnection(maxRetries = 3) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const { data, error } = await supabase
        .from('scraped_data')
        .select('count')
        .limit(1)
        .single();

      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      console.log('✅ Supabase connected successfully');
      return { 
        connected: true, 
        data,
        message: 'Database connection successful'
      };
      
    } catch (error) {
      attempts++;
      console.error(`Database connection attempt ${attempts}/${maxRetries} failed:`, error.message);
      
      if (attempts >= maxRetries) {
        const errorMsg = `❌ Supabase connection failed after ${maxRetries} attempts: ${error.message}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
    }
  }
}

// Insert data with comprehensive error handling
export async function insertScrapedData(source, data, type = 'regulatory', language = 'en') {
  try {
    if (!data || data.length === 0) {
      console.log('⚠️ No data to insert for', source);
      return { success: false, message: 'No data provided' };
    }

    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: source,
        data: data,
        type: type,
        language: language,
        scraped_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log(`✅ Data inserted successfully for ${source} (${data.length} items)`);
    return { 
      success: true, 
      message: `Inserted ${data.length} items for ${source}`,
      count: data.length
    };

  } catch (error) {
    console.error('❌ Data insertion error:', error.message);
    return { 
      success: false, 
      message: error.message,
      error: error 
    };
  }
}

// Get scraping statistics
export async function getScrapingStats() {
  try {
    const { data, error } = await supabase
      .from('scraped_data')
      .select('source, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const stats = {};
    data.forEach(item => {
      if (!stats[item.source]) {
        stats[item.source] = 0;
      }
      stats[item.source]++;
    });

    return { success: true, stats, total: data.length };

  } catch (error) {
    console.error('Failed to get scraping stats:', error);
    return { success: false, error: error.message };
  }
}

// Export Supabase client and functions
export { supabase, testConnection, insertScrapedData, getScrapingStats };
