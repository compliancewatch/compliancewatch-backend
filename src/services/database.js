import { createClient } from '@supabase/supabase-js';

// Create Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Test connection function
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('scraped_data')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('✅ Supabase connected successfully');
    return { connected: true, data };
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    throw error;
  }
}

// Insert data function
export async function insertScrapedData(source, data) {
  try {
    const { error } = await supabase
      .from('scraped_data')
      .insert({
        source: source,
        data: data,
        scraped_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log(`✅ Data inserted for ${source}`);
    return true;
  } catch (error) {
    console.error('❌ Data insertion error:', error.message);
    throw error;
  }
}

// Export all functions
export default { supabase, testConnection, insertScrapedData };
