import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function saveToDB(data) {
  const { error } = await supabase
    .from('scraped_data')
    .insert([{
      source: data.source || 'FATF',
      data: {
        title: data.title,
        url: data.url,
        date: data.date,
        summary: data.summary
      },
      scraped_at: new Date().toISOString()
    }]);

  if (error) {
    logger.error('DB save error:', error.message);
    throw error;
  }
}

export { saveToDB };