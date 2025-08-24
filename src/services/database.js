import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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

export async function insertScrapedData(source, data, type = 'general') {
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
        item_count: data.length,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log(`✅ Data inserted successfully for ${source} (${data.length} items)`);
    return { success: true, count: data.length };

  } catch (error) {
    console.error('❌ Data insertion error:', error.message);
    return { success: false, error: error.message };
  }
}
