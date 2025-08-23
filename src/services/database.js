// src/services/database.js
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

    if (error) throw new Error(`Supabase connection failed: ${error.message}`);

    console.log('✅ Supabase connected successfully');
    return { connected: true, data };
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    throw error;
  }
}
